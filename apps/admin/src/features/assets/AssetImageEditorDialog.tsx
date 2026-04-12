import { useEffect, useMemo, useRef, useState } from 'react';
import { Slider } from 'primereact/slider';

import { Button, Checkbox, DialogPanel, NumberInput, Select, TabItem, Tabs, Textarea, TextInput } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';
import { getApiBaseUrl } from '../../lib/api';
import { formatErrorMessage } from '../../lib/graphqlErrorUi';
import { LinkPickerButton } from '../../ui/atoms';
import type { ContentLinkValue } from '../content/fieldRenderers/LinkSelectorDialog';
import { DataGrid } from '../../ui/molecules';
import './AssetImageEditorDialog.css';

type Point = { x: number; y: number };
type CropRect = { x: number; y: number; w: number; h: number };
type CropHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
type PaintTool = 'brush' | 'eraser';
type BgRemovalModel = 'isnet_quint8' | 'isnet_fp16' | 'isnet';
type BgRemovalDevice = 'cpu' | 'gpu';
type PoiStyle = { color?: string; icon?: string; size?: number };
type Poi = {
  id: string;
  x: number;
  y: number;
  label?: string;
  link?: ContentLinkValue;
  style?: PoiStyle;
  visible?: boolean;
};
type Preset = {
  id: string;
  name: string;
  mode: 'cover' | 'contain';
  width: number;
  height: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  crop?: CropRect;
  useFocalPoint?: boolean;
  background?: string;
};
type Rendition = {
  id: number;
  presetId?: string | null;
  width: number;
  height: number;
  format?: string | null;
  bytes: number;
};
type AssetDetail = {
  id: number;
  originalName: string;
  width?: number | null;
  height?: number | null;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  tagsJson?: string | null;
  focalPoint?: Point | null;
  pois?: Poi[];
  renditionPresets?: Preset[];
  renditions?: Rendition[];
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function parseTags(tagsJson?: string | null): string[] {
  if (!tagsJson) {
    return [];
  }
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function createClientId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function clampCropRect(crop: CropRect): CropRect {
  const minSize = 0.04;
  const w = Math.min(1, Math.max(minSize, crop.w));
  const h = Math.min(1, Math.max(minSize, crop.h));
  const x = Math.min(1 - w, Math.max(0, crop.x));
  const y = Math.min(1 - h, Math.max(0, crop.y));
  return { x, y, w, h };
}

function fitCropToAspect(crop: CropRect, targetAspect: number): CropRect {
  if (!Number.isFinite(targetAspect) || targetAspect <= 0) {
    return clampCropRect(crop);
  }
  const minSize = 0.04;
  const centerX = crop.x + crop.w / 2;
  const centerY = crop.y + crop.h / 2;
  let width = crop.w;
  let height = crop.h;
  if (width / height > targetAspect) {
    width = height * targetAspect;
  } else {
    height = width / targetAspect;
  }
  width = Math.max(minSize, Math.min(1, width));
  height = Math.max(minSize, Math.min(1, height));
  const x = Math.min(1 - width, Math.max(0, centerX - width / 2));
  const y = Math.min(1 - height, Math.max(0, centerY - height / 2));
  return { x, y, w: width, h: height };
}

function updateCropWithHandle(
  startRect: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  lockAspect: boolean,
  targetAspect: number
): CropRect {
  const minSize = 0.04;
  const startLeft = startRect.x;
  const startTop = startRect.y;
  const startRight = startRect.x + startRect.w;
  const startBottom = startRect.y + startRect.h;

  if (handle === 'move') {
    const x = Math.min(1 - startRect.w, Math.max(0, startRect.x + deltaX));
    const y = Math.min(1 - startRect.h, Math.max(0, startRect.y + deltaY));
    const moved = { x, y, w: startRect.w, h: startRect.h };
    return lockAspect ? fitCropToAspect(moved, targetAspect) : clampCropRect(moved);
  }

  let left = startLeft + (handle.includes('w') ? deltaX : 0);
  let top = startTop + (handle.includes('n') ? deltaY : 0);
  let right = startRight + (handle.includes('e') ? deltaX : 0);
  let bottom = startBottom + (handle.includes('s') ? deltaY : 0);

  if (right - left < minSize) {
    if (handle.includes('w')) {
      left = right - minSize;
    } else {
      right = left + minSize;
    }
  }
  if (bottom - top < minSize) {
    if (handle.includes('n')) {
      top = bottom - minSize;
    } else {
      bottom = top + minSize;
    }
  }

  left = Math.max(0, Math.min(1 - minSize, left));
  top = Math.max(0, Math.min(1 - minSize, top));
  right = Math.max(left + minSize, Math.min(1, right));
  bottom = Math.max(top + minSize, Math.min(1, bottom));

  const raw = {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top
  };
  return lockAspect ? fitCropToAspect(raw, targetAspect) : clampCropRect(raw);
}

async function createBackgroundRemovedPreview(
  src: string,
  config: {
    model: BgRemovalModel;
    device: BgRemovalDevice;
    onProgress?: (percent: number) => void;
  }
): Promise<string> {
  const [{ removeBackground }] = await Promise.all([import('@imgly/background-removal')]);
  const response = await fetch(src, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load source image for IMG.LY background removal');
  }
  const input = await response.blob();
  const output = await removeBackground(input, {
    model: config.model,
    device: config.device,
    output: { format: 'image/png', quality: 0.95 },
    progress: (_key: string, current: number, total: number) => {
      if (!total) {
        return;
      }
      config.onProgress?.(Math.max(0, Math.min(100, Math.round((current / total) * 100))));
    }
  });
  return URL.createObjectURL(output);
}

function PresetDraftDialog({
  visible,
  value,
  onHide,
  onApply
}: {
  visible: boolean;
  value: Preset;
  onHide: () => void;
  onApply: (next: Preset) => void;
}) {
  const [draft, setDraft] = useState<Preset>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <DialogPanel header="Preset" visible={visible} onHide={onHide} className="w-10 md:w-7 lg:w-5">
      <div className="form-row">
        <label>Name</label>
        <TextInput value={draft.name} onChange={(next) => setDraft({ ...draft, name: next })} />

        <label>Width</label>
        <NumberInput
          value={draft.width}
          onChange={(next) => setDraft({ ...draft, width: Number(next ?? 0) })}
          min={1}
          max={8000}
        />

        <label>Height</label>
        <NumberInput
          value={draft.height}
          onChange={(next) => setDraft({ ...draft, height: Number(next ?? 0) })}
          min={1}
          max={8000}
        />

        <label>Mode</label>
        <Select
          value={draft.mode}
          options={[{ label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }]}
          onChange={(next) => next && setDraft({ ...draft, mode: next as 'cover' | 'contain' })}
        />

        <label>Format</label>
        <Select
          value={draft.format ?? 'webp'}
          options={[
            { label: 'WebP', value: 'webp' },
            { label: 'JPEG', value: 'jpeg' },
            { label: 'PNG', value: 'png' }
          ]}
          onChange={(next) => next && setDraft({ ...draft, format: next as 'webp' | 'jpeg' | 'png' })}
        />

        <label>Quality: {draft.quality ?? 80}</label>
        <Slider
          min={1}
          max={100}
          value={draft.quality ?? 80}
          onChange={(event) => setDraft({ ...draft, quality: Number(event.value ?? 80) })}
        />

        <label>
          <Checkbox
            checked={draft.useFocalPoint !== false}
            onChange={(next) => setDraft({ ...draft, useFocalPoint: next })}
          />{' '}
          Use focal point
        </label>
      </div>
      <div className="inline-actions mt-3 justify-content-end">
        <Button label="Cancel" text onClick={onHide} />
        <Button
          label="Save"
          onClick={() => {
            if (!draft.name.trim() || draft.width <= 0 || draft.height <= 0) {
              return;
            }
            onApply({
              ...draft,
              name: draft.name.trim(),
              quality: Math.max(1, Math.min(100, draft.quality ?? 80))
            });
            onHide();
          }}
        />
      </div>
    </DialogPanel>
  );
}

export function AssetImageEditorDialog({
  visible,
  assetId,
  token,
  siteId,
  onHide,
  onSaved
}: {
  visible: boolean;
  assetId: number | null;
  token: string | null;
  siteId: number;
  onHide: () => void;
  onSaved?: () => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const apiBase = getApiBaseUrl();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintDrawingRef = useRef(false);
  const paintLastPointRef = useRef<Point | null>(null);
  const paintHistoryRef = useRef<ImageData[]>([]);
  const paintHistoryIndexRef = useRef(-1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [focal, setFocal] = useState<Point>({ x: 0.5, y: 0.5 });
  const [showThirds, setShowThirds] = useState(true);
  const [poiMode, setPoiMode] = useState(false);
  const [pois, setPois] = useState<Poi[]>([]);
  const [dragPoiId, setDragPoiId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [renditions, setRenditions] = useState<Rendition[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetDraft, setPresetDraft] = useState<Preset>({
    id: createClientId('preset'),
    name: '',
    width: 1200,
    height: 675,
    mode: 'cover',
    quality: 80,
    format: 'webp',
    useFocalPoint: true
  });
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [mainCropMode, setMainCropMode] = useState(false);
  const [lockCropAspect, setLockCropAspect] = useState(true);
  const [mainCrop, setMainCrop] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const [activeCropDrag, setActiveCropDrag] = useState<{
    handle: CropHandle;
    startClient: Point;
    startRect: CropRect;
  } | null>(null);
  const [presetPreviewFailed, setPresetPreviewFailed] = useState(false);
  const [presetPreviewVersion, setPresetPreviewVersion] = useState(0);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [generatingPreset, setGeneratingPreset] = useState(false);
  const [blurBackground, setBlurBackground] = useState(false);
  const [blurStrength, setBlurStrength] = useState(14);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [imageContrast, setImageContrast] = useState(100);
  const [imageSaturation, setImageSaturation] = useState(100);
  const [imageHueRotate, setImageHueRotate] = useState(0);
  const [imageGrayscale, setImageGrayscale] = useState(0);
  const [imageSepia, setImageSepia] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipX, setImageFlipX] = useState(false);
  const [imageFlipY, setImageFlipY] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [backgroundModel, setBackgroundModel] = useState<BgRemovalModel>('isnet_quint8');
  const [backgroundDevice, setBackgroundDevice] = useState<BgRemovalDevice>('gpu');
  const [backgroundRemovalProgress, setBackgroundRemovalProgress] = useState(0);
  const [backgroundRemoving, setBackgroundRemoving] = useState(false);
  const [backgroundRemovedPreviewUrl, setBackgroundRemovedPreviewUrl] = useState<string | null>(null);
  const [paintMode, setPaintMode] = useState(false);
  const [paintTool, setPaintTool] = useState<PaintTool>('brush');
  const [paintColor, setPaintColor] = useState('#ef4444');
  const [paintBrushSize, setPaintBrushSize] = useState(18);
  const [paintOpacity, setPaintOpacity] = useState(85);
  const [paintSoftness, setPaintSoftness] = useState(24);
  const [paintCanUndo, setPaintCanUndo] = useState(false);
  const [paintCanRedo, setPaintCanRedo] = useState(false);
  const [poisJsonDraft, setPoisJsonDraft] = useState('[]');
  const [presetsJsonDraft, setPresetsJsonDraft] = useState('[]');

  const imageUrl = assetId ? `${apiBase}/assets/${assetId}` : '';
  const previewAspect = asset?.width && asset?.height ? `${asset.width} / ${asset.height}` : '16 / 9';
  const selectedPreset = presets.find((entry) => entry.id === selectedPresetId) ?? null;
  const aspect = selectedPreset ? selectedPreset.width / selectedPreset.height : 16 / 9;
  const selectedPresetRendition = selectedPreset
    ? renditions.find((entry) => entry.presetId === selectedPreset.id) ?? null
    : null;
  const imageAdjustmentsFilter = `brightness(${imageBrightness}%) contrast(${imageContrast}%) saturate(${imageSaturation}%) hue-rotate(${imageHueRotate}deg) grayscale(${imageGrayscale}%) sepia(${imageSepia}%)`;
  const imageAdjustmentsTransform = `${imageFlipX ? 'scaleX(-1)' : ''} ${imageFlipY ? 'scaleY(-1)' : ''} rotate(${imageRotation}deg)`;
  const canvasImageUrl =
    removeBackground && backgroundRemovedPreviewUrl && !backgroundRemoving ? backgroundRemovedPreviewUrl : imageUrl;
  const presetPreviewUrl =
    assetId && selectedPreset && !presetPreviewFailed
      ? `${apiBase}/assets/${assetId}/rendition/preset/${encodeURIComponent(selectedPreset.id)}?v=${presetPreviewVersion}`
      : imageUrl;

  const refresh = async () => {
    if (!assetId) {
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const res = await sdk.getAsset({ id: assetId });
      const row = (res.getAsset as AssetDetail | null) ?? null;
      if (!row) {
        setAsset(null);
        setStatus('Asset not found');
        return;
      }
      setAsset(row);
      setTitle(row.title ?? '');
      setAltText(row.altText ?? '');
      setDescription(row.description ?? '');
      setTags(parseTags(row.tagsJson));
      setFocal(row.focalPoint ?? { x: 0.5, y: 0.5 });
      setPois(Array.isArray(row.pois) ? row.pois : []);
      setPresets(Array.isArray(row.renditionPresets) ? row.renditionPresets : []);
      setRenditions(Array.isArray(row.renditions) ? row.renditions : []);
      setSelectedPresetId((prev) => prev ?? row.renditionPresets?.[0]?.id ?? null);
      setPoisJsonDraft(JSON.stringify(row.pois ?? [], null, 2));
      setPresetsJsonDraft(JSON.stringify(row.renditionPresets ?? [], null, 2));
    } catch (error) {
      setStatus(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible || !assetId) {
      return;
    }
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, assetId]);

  useEffect(() => {
    const canvas = paintCanvasRef.current;
    if (!canvas) {
      paintHistoryRef.current = [];
      paintHistoryIndexRef.current = -1;
      setPaintCanUndo(false);
      setPaintCanRedo(false);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    paintHistoryRef.current = [];
    paintHistoryIndexRef.current = -1;
    setPaintCanUndo(false);
    setPaintCanRedo(false);
  }, [assetId, visible]);

  useEffect(() => {
    if (!dragPoiId) {
      return;
    }
    const onMove = (event: MouseEvent) => {
      const host = canvasRef.current;
      if (!host) {
        return;
      }
      const rect = host.getBoundingClientRect();
      const x = clamp01((event.clientX - rect.left) / rect.width);
      const y = clamp01((event.clientY - rect.top) / rect.height);
      setPois((prev) => prev.map((entry) => (entry.id === dragPoiId ? { ...entry, x, y } : entry)));
    };
    const onUp = () => setDragPoiId(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragPoiId]);

  useEffect(() => {
    setPresetPreviewFailed(false);
    setPresetPreviewVersion(0);
    if (selectedPreset?.crop) {
      setMainCrop(clampCropRect(selectedPreset.crop));
    } else {
      setMainCrop({ x: 0, y: 0, w: 1, h: 1 });
    }
  }, [selectedPresetId, selectedPreset?.crop]);

  useEffect(() => {
    if (!activeCropDrag || !mainCropMode || !canvasRef.current) {
      return;
    }
    const host = canvasRef.current;
    const bounds = host.getBoundingClientRect();
    const onMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - activeCropDrag.startClient.x) / Math.max(1, bounds.width);
      const deltaY = (event.clientY - activeCropDrag.startClient.y) / Math.max(1, bounds.height);
      setMainCrop(
        updateCropWithHandle(
          activeCropDrag.startRect,
          activeCropDrag.handle,
          deltaX,
          deltaY,
          lockCropAspect && Boolean(selectedPreset),
          aspect
        )
      );
    };
    const onUp = () => setActiveCropDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeCropDrag, mainCropMode, lockCropAspect, selectedPreset, aspect]);

  useEffect(() => {
    if (!removeBackground || !imageUrl) {
      setBackgroundRemoving(false);
      setBackgroundRemovalProgress(0);
      setBackgroundRemovedPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setBackgroundRemoving(true);
    createBackgroundRemovedPreview(imageUrl, {
      model: backgroundModel,
      device: backgroundDevice,
      onProgress: (percent) => setBackgroundRemovalProgress(percent)
    })
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setBackgroundRemovedPreviewUrl((previous) => {
          if (previous?.startsWith('blob:')) {
            URL.revokeObjectURL(previous);
          }
          return url;
        });
        setBackgroundRemovalProgress(100);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setBackgroundRemovedPreviewUrl((previous) => {
          if (previous?.startsWith('blob:')) {
            URL.revokeObjectURL(previous);
          }
          return null;
        });
        setStatus('IMG.LY background removal failed. Try CPU mode or another model.');
      })
      .finally(() => {
        if (!cancelled) {
          setBackgroundRemoving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [removeBackground, backgroundModel, backgroundDevice, imageUrl]);

  useEffect(() => {
    return () => {
      if (backgroundRemovedPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundRemovedPreviewUrl);
      }
    };
  }, [backgroundRemovedPreviewUrl]);

  const syncPaintCanvasSize = () => {
    const host = canvasRef.current;
    const canvas = paintCanvasRef.current;
    if (!host || !canvas) {
      return;
    }
    const bounds = host.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    if (canvas.width === nextWidth && canvas.height === nextHeight) {
      return;
    }
    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const snapshotCtx = snapshot.getContext('2d');
    if (snapshotCtx) {
      snapshotCtx.drawImage(canvas, 0, 0);
    }
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    canvas.style.width = `${nextWidth}px`;
    canvas.style.height = `${nextHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx && snapshot.width > 0 && snapshot.height > 0) {
      ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, nextWidth, nextHeight);
    }
    paintHistoryRef.current = [];
    paintHistoryIndexRef.current = -1;
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    syncPaintCanvasSize();
    const onResize = () => syncPaintCanvasSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, previewAspect]);

  const syncPaintHistoryFlags = () => {
    const index = paintHistoryIndexRef.current;
    const count = paintHistoryRef.current.length;
    setPaintCanUndo(index > 0);
    setPaintCanRedo(index >= 0 && index < count - 1);
  };

  const pushPaintSnapshot = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let history = paintHistoryRef.current;
    let index = paintHistoryIndexRef.current;
    if (index < history.length - 1) {
      history = history.slice(0, index + 1);
    }
    history.push(snapshot);
    if (history.length > 30) {
      history = history.slice(history.length - 30);
    }
    paintHistoryRef.current = history;
    paintHistoryIndexRef.current = history.length - 1;
    syncPaintHistoryFlags();
  };

  const ensurePaintHistory = () => {
    if (paintHistoryRef.current.length > 0) {
      return;
    }
    pushPaintSnapshot();
  };

  const clearPaintLayer = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushPaintSnapshot();
  };

  const undoPaint = () => {
    const canvas = paintCanvasRef.current;
    const history = paintHistoryRef.current;
    const index = paintHistoryIndexRef.current;
    if (!canvas || index <= 0 || !history[index - 1]) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const snapshot = history[index - 1];
    if (!snapshot) {
      return;
    }
    paintHistoryIndexRef.current = index - 1;
    ctx.putImageData(snapshot, 0, 0);
    syncPaintHistoryFlags();
  };

  const redoPaint = () => {
    const canvas = paintCanvasRef.current;
    const history = paintHistoryRef.current;
    const index = paintHistoryIndexRef.current;
    if (!canvas || index < 0 || index >= history.length - 1 || !history[index + 1]) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const snapshot = history[index + 1];
    if (!snapshot) {
      return;
    }
    paintHistoryIndexRef.current = index + 1;
    ctx.putImageData(snapshot, 0, 0);
    syncPaintHistoryFlags();
  };

  const drawPaintStroke = (point: Point) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const previous = paintLastPointRef.current;
    ctx.globalCompositeOperation = paintTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.globalAlpha = Math.max(0.05, Math.min(1, paintOpacity / 100));
    ctx.strokeStyle = paintColor;
    ctx.lineWidth = Math.max(1, paintBrushSize);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = Math.max(0, (paintSoftness / 100) * paintBrushSize * 1.8);
    ctx.shadowColor = paintTool === 'eraser' ? 'rgba(0,0,0,1)' : paintColor;
    if (previous) {
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.fillStyle = paintColor;
      ctx.arc(point.x, point.y, Math.max(1, paintBrushSize / 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    paintLastPointRef.current = point;
  };

  const getPaintPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = paintCanvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width,
      y: clamp01((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height
    };
  };

  useEffect(() => {
    if (!paintMode) {
      return;
    }
    syncPaintCanvasSize();
    ensurePaintHistory();
  }, [paintMode]);

  const generateSelectedPreset = async (nextPresets: Preset[]) => {
    if (!assetId || !selectedPreset) {
      return;
    }
    setGeneratingPreset(true);
    setStatus('');
    try {
      await sdk.upsertAssetRenditionPresets({
        assetId,
        presets: nextPresets,
        by: 'admin'
      });
      await sdk.generateAssetRendition({ assetId, presetId: selectedPreset.id });
      setPresetPreviewFailed(false);
      setPresetPreviewVersion((prev) => prev + 1);
      await refresh();
      setStatus(`Updated rendition for ${selectedPreset.name}`);
    } catch (error) {
      setStatus(formatErrorMessage(error));
    } finally {
      setGeneratingPreset(false);
    }
  };

  const saveAll = async () => {
    if (!assetId) {
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      await sdk.updateAssetMetadata({
        id: assetId,
        title: title || null,
        altText: altText || null,
        description: description || null,
        tags,
        folderId: null,
        by: 'admin'
      });
      await sdk.updateAssetFocalPoint({
        assetId,
        x: clamp01(focal.x),
        y: clamp01(focal.y),
        by: 'admin'
      });
      await sdk.upsertAssetPois({
        assetId,
        pois,
        by: 'admin'
      });
      await sdk.upsertAssetRenditionPresets({
        assetId,
        presets,
        by: 'admin'
      });
      await refresh();
      onSaved?.();
      setStatus('Saved');
    } catch (error) {
      setStatus(formatErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const addPoiAtEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!poiMode || !canvasRef.current || mainCropMode) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clamp01((event.clientX - rect.left) / rect.width);
    const y = clamp01((event.clientY - rect.top) / rect.height);
    setPois((prev) => [
      ...prev,
      {
        id: createClientId('poi'),
        x,
        y,
        label: 'POI',
        visible: true
      }
    ]);
  };

  const openCreatePreset = () => {
    setEditingPresetId(null);
    setPresetDraft({
      id: createClientId('preset'),
      name: '',
      mode: 'cover',
      width: 1200,
      height: 675,
      quality: 80,
      format: 'webp',
      useFocalPoint: true
    });
    setPresetDialogOpen(true);
  };

  const openEditPreset = (preset: Preset) => {
    setEditingPresetId(preset.id);
    setPresetDraft({ ...preset });
    setPresetDialogOpen(true);
  };

  const applyPresetDialog = (next: Preset) => {
    setPresets((prev) => {
      if (editingPresetId) {
        return prev.map((entry) => (entry.id === editingPresetId ? next : entry));
      }
      return [...prev, next];
    });
    setSelectedPresetId(next.id);
  };

  const applyCropToPreset = async () => {
    if (!selectedPreset) {
      return;
    }
    const normalized = clampCropRect(lockCropAspect ? fitCropToAspect(mainCrop, aspect) : mainCrop);
    const nextPresets = presets.map((entry) => (entry.id === selectedPreset.id ? { ...entry, crop: normalized } : entry));
    setPresets(nextPresets);
    setMainCrop(normalized);
    await generateSelectedPreset(nextPresets);
  };

  const generateMissing = async () => {
    if (!assetId) {
      return;
    }
    try {
      for (const preset of presets) {
        const already = renditions.some((entry) => entry.presetId === preset.id);
        if (!already) {
          await sdk.generateAssetRendition({ assetId, presetId: preset.id });
        }
      }
      await refresh();
    } catch (error) {
      setStatus(formatErrorMessage(error));
    }
  };

  const applyAdvancedJson = () => {
    try {
      const parsedPois = JSON.parse(poisJsonDraft) as Poi[];
      const parsedPresets = JSON.parse(presetsJsonDraft) as Preset[];
      setPois(Array.isArray(parsedPois) ? parsedPois : []);
      setPresets(Array.isArray(parsedPresets) ? parsedPresets : []);
      setStatus('');
    } catch {
      setStatus('Advanced JSON is invalid');
    }
  };

  return (
    <DialogPanel
      header={`Edit Image${asset?.originalName ? `: ${asset.originalName}` : ''}`}
      visible={visible}
      onHide={onHide}
      className="w-12"
      maximizable
    >
      {loading ? <p>Loading...</p> : null}
      {!assetId ? <p className="muted">Select an asset first.</p> : null}
      {assetId ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(420px, 1fr)',
            gap: '1rem',
            alignItems: 'start',
            minHeight: '70vh'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              ref={canvasRef}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: previewAspect,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-50)'
              }}
              onClick={addPoiAtEvent}
            >
              {blurBackground ? (
                <img
                  src={imageUrl}
                  alt=""
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: `blur(${blurStrength}px) saturate(1.12)`,
                    transform: 'scale(1.06)'
                  }}
                />
              ) : null}
              <img
                src={canvasImageUrl}
                alt={altText || title || asset?.originalName || 'asset'}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: imageAdjustmentsFilter,
                  opacity: imageOpacity / 100,
                  transform: imageAdjustmentsTransform
                }}
              />
              {showThirds ? (
                <>
                  <div style={{ position: 'absolute', top: '33.333%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.5)' }} />
                  <div style={{ position: 'absolute', top: '66.666%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.5)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.333%', borderLeft: '1px dashed rgba(255,255,255,0.5)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.666%', borderLeft: '1px dashed rgba(255,255,255,0.5)' }} />
                </>
              ) : null}
              {mainCropMode ? (
                <div
                  style={{
                    position: 'absolute',
                    left: `${mainCrop.x * 100}%`,
                    top: `${mainCrop.y * 100}%`,
                    width: `${mainCrop.w * 100}%`,
                    height: `${mainCrop.h * 100}%`,
                    border: '2px solid #38bdf8',
                    boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.45)',
                    zIndex: 6,
                    cursor: activeCropDrag ? 'grabbing' : 'move'
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveCropDrag({
                      handle: 'move',
                      startClient: { x: event.clientX, y: event.clientY },
                      startRect: mainCrop
                    });
                  }}
                >
                  {[
                    { key: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
                    { key: 'n', left: '50%', top: '0%', cursor: 'ns-resize' },
                    { key: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
                    { key: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
                    { key: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
                    { key: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
                    { key: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
                    { key: 'w', left: '0%', top: '50%', cursor: 'ew-resize' }
                  ].map((handle) => (
                    <button
                      key={`main-crop-${handle.key}`}
                      type="button"
                      aria-label={`Resize crop ${handle.key}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setActiveCropDrag({
                          handle: handle.key as CropHandle,
                          startClient: { x: event.clientX, y: event.clientY },
                          startRect: mainCrop
                        });
                      }}
                      style={{
                        position: 'absolute',
                        left: handle.left,
                        top: handle.top,
                        transform: 'translate(-50%, -50%)',
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        border: '1px solid #f8fafc',
                        background: '#0ea5e9',
                        cursor: handle.cursor,
                        zIndex: 2
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  const onMove = (moveEvent: MouseEvent) => {
                    if (!canvasRef.current) {
                      return;
                    }
                    const rect = canvasRef.current.getBoundingClientRect();
                    setFocal({
                      x: clamp01((moveEvent.clientX - rect.left) / rect.width),
                      y: clamp01((moveEvent.clientY - rect.top) / rect.height)
                    });
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
                style={{
                  position: 'absolute',
                  left: `${focal.x * 100}%`,
                  top: `${focal.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: '2px solid #0ea5e9',
                  background: 'rgba(14,165,233,0.2)',
                  cursor: 'move',
                  zIndex: 5,
                  pointerEvents: mainCropMode ? 'none' : 'auto',
                  opacity: mainCropMode ? 0.5 : 1
                }}
                aria-label="Focal point"
              />
              {pois.map((poi) => (
                <button
                  key={poi.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setDragPoiId(poi.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${poi.x * 100}%`,
                    top: `${poi.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    border: '2px solid #f97316',
                    background: poi.visible === false ? 'rgba(148,163,184,0.65)' : 'rgba(249,115,22,0.75)',
                    cursor: 'move',
                    zIndex: 5,
                    pointerEvents: mainCropMode ? 'none' : 'auto',
                    opacity: mainCropMode ? 0.5 : 1
                  }}
                  aria-label={poi.label ?? 'POI marker'}
                />
              ))}
              <canvas
                ref={paintCanvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: paintMode && !mainCropMode ? 'auto' : 'none',
                  cursor: paintMode && !mainCropMode ? 'crosshair' : 'default',
                  zIndex: 4
                }}
                onPointerDown={(event) => {
                  if (!paintMode) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  syncPaintCanvasSize();
                  ensurePaintHistory();
                  paintDrawingRef.current = true;
                  const point = getPaintPoint(event);
                  if (!point) {
                    return;
                  }
                  drawPaintStroke(point);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!paintMode || !paintDrawingRef.current) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  const point = getPaintPoint(event);
                  if (!point) {
                    return;
                  }
                  drawPaintStroke(point);
                }}
                onPointerUp={(event) => {
                  if (!paintMode) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  paintDrawingRef.current = false;
                  paintLastPointRef.current = null;
                  pushPaintSnapshot();
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
                onPointerLeave={() => {
                  if (paintDrawingRef.current) {
                    pushPaintSnapshot();
                  }
                  paintDrawingRef.current = false;
                  paintLastPointRef.current = null;
                }}
              />
              {paintMode && !mainCropMode ? (
                <div className="asset-image-editor__paint-toolbar" role="group" aria-label="Paint tools">
                  <div className="asset-image-editor__paint-toolbar-row">
                    <Button
                      size="small"
                      className={paintTool === 'brush' ? 'asset-image-editor__tool-btn is-active' : 'asset-image-editor__tool-btn'}
                      icon="pi pi-pencil"
                      label="Brush"
                      onClick={() => setPaintTool('brush')}
                    />
                    <Button
                      size="small"
                      className={paintTool === 'eraser' ? 'asset-image-editor__tool-btn is-active' : 'asset-image-editor__tool-btn'}
                      icon="pi pi-eraser"
                      label="Eraser"
                      onClick={() => setPaintTool('eraser')}
                    />
                    <Button size="small" text icon="pi pi-undo" onClick={undoPaint} disabled={!paintCanUndo} />
                    <Button size="small" text icon="pi pi-refresh" onClick={redoPaint} disabled={!paintCanRedo} />
                    <Button size="small" text icon="pi pi-trash" onClick={clearPaintLayer} />
                  </div>
                  <div className="asset-image-editor__paint-toolbar-row">
                    <small>Size {paintBrushSize}px</small>
                    <Slider min={1} max={120} step={1} value={paintBrushSize} onChange={(event) => setPaintBrushSize(Number(event.value ?? 18))} />
                  </div>
                  <div className="asset-image-editor__paint-toolbar-row">
                    <small>Opacity {paintOpacity}%</small>
                    <Slider min={5} max={100} step={1} value={paintOpacity} onChange={(event) => setPaintOpacity(Number(event.value ?? 85))} />
                  </div>
                  <div className="asset-image-editor__paint-toolbar-row">
                    <small>Softness {paintSoftness}%</small>
                    <Slider min={0} max={100} step={1} value={paintSoftness} onChange={(event) => setPaintSoftness(Number(event.value ?? 24))} />
                  </div>
                  <div className="asset-image-editor__paint-toolbar-row asset-image-editor__paint-colors">
                    {['#ffffff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#111827'].map((swatch) => (
                      <button
                        key={`swatch-${swatch}`}
                        type="button"
                        className={paintColor.toLowerCase() === swatch.toLowerCase() ? 'asset-image-editor__swatch is-active' : 'asset-image-editor__swatch'}
                        style={{ background: swatch }}
                        onClick={() => setPaintColor(swatch)}
                        aria-label={`Select color ${swatch}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={paintColor}
                      onChange={(event) => setPaintColor(event.target.value)}
                      aria-label="Custom brush color"
                      className="asset-image-editor__color-input"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ minWidth: 0, maxHeight: '72vh', overflow: 'auto', paddingRight: 4 }}>
            <Tabs activeIndex={activeTabIndex} onTabChange={(index) => setActiveTabIndex(index)}>
              <TabItem header="Crop & Focal">
                <div className="form-row">
                  <label>
                    <Checkbox checked={showThirds} onChange={(next) => setShowThirds(next)} /> Show rule-of-thirds
                  </label>
                  <small className="muted">
                    Focal: {(focal.x * 100).toFixed(1)}% / {(focal.y * 100).toFixed(1)}%
                  </small>
                  <label>
                    <Checkbox
                      checked={mainCropMode}
                      onChange={(next) => {
                        setMainCropMode(next);
                        if (next && mainCrop.w >= 0.995 && mainCrop.h >= 0.995) {
                          const inset = selectedPreset ? fitCropToAspect({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 }, aspect) : { x: 0.08, y: 0.08, w: 0.84, h: 0.84 };
                          setMainCrop(clampCropRect(inset));
                        }
                        setActiveCropDrag(null);
                      }}
                    />{' '}
                    Main crop handles on preview
                  </label>
                  <label>
                    <Checkbox
                      checked={lockCropAspect}
                      onChange={(next) => setLockCropAspect(next)}
                      disabled={!selectedPreset}
                    />{' '}
                    Lock to selected preset aspect ({selectedPreset ? `${selectedPreset.width}:${selectedPreset.height}` : 'n/a'})
                  </label>
                  <small className="muted">
                    Crop: x {mainCrop.x.toFixed(3)} y {mainCrop.y.toFixed(3)} w {mainCrop.w.toFixed(3)} h {mainCrop.h.toFixed(3)}
                  </small>
                  <div className="inline-actions">
                    <Button
                      text
                      label="Apply main crop to preset + regenerate"
                      onClick={() => applyCropToPreset().catch(() => undefined)}
                      loading={generatingPreset}
                      disabled={!selectedPreset}
                    />
                    <Button
                      text
                      label="Reset main crop"
                      onClick={() => setMainCrop({ x: 0, y: 0, w: 1, h: 1 })}
                      disabled={!selectedPreset}
                    />
                  </div>

                  <label>Image tools</label>
                  <label>
                    <Checkbox checked={blurBackground} onChange={(next) => setBlurBackground(next)} /> Blur background layer
                  </label>
                  {blurBackground ? (
                    <>
                      <small className="muted">Blur strength: {blurStrength}px</small>
                      <Slider min={0} max={28} step={1} value={blurStrength} onChange={(event) => setBlurStrength(Number(event.value ?? 0))} />
                    </>
                  ) : null}

                  <label>
                    <Checkbox checked={removeBackground} onChange={(next) => setRemoveBackground(next)} /> Remove background (preview)
                  </label>
                  {removeBackground ? (
                    <>
                      <small className="muted">{backgroundRemoving ? `IMG.LY processing... ${backgroundRemovalProgress}%` : 'IMG.LY model settings'}</small>
                      <Select
                        value={backgroundModel}
                        options={[
                          { label: 'Fast (isnet_quint8)', value: 'isnet_quint8' },
                          { label: 'Balanced (isnet_fp16)', value: 'isnet_fp16' },
                          { label: 'Quality (isnet)', value: 'isnet' }
                        ]}
                        onChange={(next) => next && setBackgroundModel(next as BgRemovalModel)}
                      />
                      <Select
                        value={backgroundDevice}
                        options={[
                          { label: 'GPU (if available)', value: 'gpu' },
                          { label: 'CPU', value: 'cpu' }
                        ]}
                        onChange={(next) => next && setBackgroundDevice(next as BgRemovalDevice)}
                      />
                    </>
                  ) : null}

                  <small className="muted">Brightness: {imageBrightness}%</small>
                  <Slider min={50} max={170} step={1} value={imageBrightness} onChange={(event) => setImageBrightness(Number(event.value ?? 100))} />
                  <small className="muted">Contrast: {imageContrast}%</small>
                  <Slider min={50} max={170} step={1} value={imageContrast} onChange={(event) => setImageContrast(Number(event.value ?? 100))} />
                  <small className="muted">Saturation: {imageSaturation}%</small>
                  <Slider min={0} max={220} step={1} value={imageSaturation} onChange={(event) => setImageSaturation(Number(event.value ?? 100))} />
                  <small className="muted">Hue rotate: {imageHueRotate}deg</small>
                  <Slider min={-180} max={180} step={1} value={imageHueRotate} onChange={(event) => setImageHueRotate(Number(event.value ?? 0))} />
                  <small className="muted">Grayscale: {imageGrayscale}%</small>
                  <Slider min={0} max={100} step={1} value={imageGrayscale} onChange={(event) => setImageGrayscale(Number(event.value ?? 0))} />
                  <small className="muted">Sepia: {imageSepia}%</small>
                  <Slider min={0} max={100} step={1} value={imageSepia} onChange={(event) => setImageSepia(Number(event.value ?? 0))} />
                  <small className="muted">Opacity: {imageOpacity}%</small>
                  <Slider min={20} max={100} step={1} value={imageOpacity} onChange={(event) => setImageOpacity(Number(event.value ?? 100))} />
                  <div className="inline-actions">
                    <Button text label="Rotate -90" onClick={() => setImageRotation((prev) => ((prev - 90) % 360 + 360) % 360)} />
                    <Button text label="Rotate +90" onClick={() => setImageRotation((prev) => ((prev + 90) % 360 + 360) % 360)} />
                    <label>
                      <Checkbox checked={imageFlipX} onChange={(next) => setImageFlipX(next)} /> Flip X
                    </label>
                    <label>
                      <Checkbox checked={imageFlipY} onChange={(next) => setImageFlipY(next)} /> Flip Y
                    </label>
                  </div>
                  <Button
                    text
                    label="Reset image adjustments"
                    onClick={() => {
                      setImageBrightness(100);
                      setImageContrast(100);
                      setImageSaturation(100);
                      setImageHueRotate(0);
                      setImageGrayscale(0);
                      setImageSepia(0);
                      setImageOpacity(100);
                      setImageRotation(0);
                      setImageFlipX(false);
                      setImageFlipY(false);
                    }}
                  />

                  <label>
                    <Checkbox checked={paintMode} onChange={(next) => setPaintMode(next)} /> Paint over
                  </label>
                  {paintMode ? (
                    <>
                      <small className="muted">Use the floating paint toolbar on the image, similar to the demo workflow.</small>
                      <div className="inline-actions">
                        <Button text icon="pi pi-pencil" label="Brush" onClick={() => setPaintTool('brush')} />
                        <Button text icon="pi pi-eraser" label="Eraser" onClick={() => setPaintTool('eraser')} />
                        <Button text icon="pi pi-undo" label="Undo" onClick={undoPaint} disabled={!paintCanUndo} />
                        <Button text icon="pi pi-refresh" label="Redo" onClick={redoPaint} disabled={!paintCanRedo} />
                      </div>
                    </>
                  ) : null}
                  <small className="muted">
                    Tools are non-destructive preview edits in DAM editor.
                  </small>
                </div>
              </TabItem>

              <TabItem header="Renditions">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
                    gap: '0.75rem',
                    alignItems: 'start'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="inline-actions mb-2">
                      <Button label="Add preset" onClick={openCreatePreset} />
                      <Button label="Generate missing renditions" onClick={generateMissing} text />
                    </div>
                    <DataGrid
                      data={presets}
                      rowKey="id"
                      scrollHeight="22rem"
                      selectedRow={selectedPreset ?? null}
                      onRowSelect={(row) => setSelectedPresetId(row?.id ?? null)}
                      columns={[
                        { key: 'name', header: 'Name' },
                        { key: '__size', header: 'Size', cell: (row) => `${row.width}x${row.height}` },
                        { key: 'mode', header: 'Mode' },
                        { key: 'format', header: 'Format' },
                        {
                          key: '__status',
                          header: 'Status',
                          cell: (row) => {
                            const hit = renditions.find((entry) => entry.presetId === row.id);
                            return hit ? `Generated (${formatBytes(hit.bytes)})` : 'Missing';
                          }
                        },
                        {
                          key: '__actions',
                          header: 'Actions',
                          cell: (row) => (
                            <div className="inline-actions">
                              <Button text label="Edit" onClick={() => openEditPreset(row)} />
                              <Button text severity="danger" label="Delete" onClick={() => setPresets((prev) => prev.filter((entry) => entry.id !== row.id))} />
                            </div>
                          )
                        }
                      ]}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    {selectedPreset ? (
                      <div className="form-row">
                        <label>Preset preview</label>
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: 220,
                            border: '1px solid var(--surface-border)',
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: 'var(--surface-50)'
                          }}
                        >
                          <img
                            src={presetPreviewUrl}
                            alt={selectedPreset.name}
                            style={{ width: '100%', height: '100%', objectFit: selectedPreset.mode === 'contain' ? 'contain' : 'cover' }}
                            onError={() => setPresetPreviewFailed(true)}
                          />
                        </div>
                        <small className="muted">
                          {selectedPresetRendition
                            ? `Generated ${selectedPresetRendition.width}x${selectedPresetRendition.height} (${formatBytes(selectedPresetRendition.bytes)})`
                            : 'Not generated yet. Use "Generate missing renditions".'}
                        </small>
                        <small className="muted">
                          Target size: {selectedPreset.width}x{selectedPreset.height} ({selectedPreset.mode})
                        </small>

                        <label>Crop editor</label>
                        <small className="muted">Use crop handles directly on the main image preview (left side).</small>
                        <small className="muted">
                          Draft crop: x {mainCrop.x.toFixed(3)} y {mainCrop.y.toFixed(3)} w {mainCrop.w.toFixed(3)} h {mainCrop.h.toFixed(3)}
                        </small>
                        <div className="inline-actions mt-2">
                          <Button label="Apply crop + regenerate" text onClick={() => applyCropToPreset().catch(() => undefined)} loading={generatingPreset} />
                          <Button
                            label="Regenerate preview"
                            text
                            onClick={() => generateSelectedPreset(presets).catch(() => undefined)}
                            loading={generatingPreset}
                          />
                          <Button
                            label="Clear crop"
                            text
                            onClick={() => {
                              setMainCrop({ x: 0, y: 0, w: 1, h: 1 });
                              const nextPresets = presets.map((entry) => {
                                if (entry.id !== selectedPreset.id) {
                                  return entry;
                                }
                                const next = { ...entry };
                                delete next.crop;
                                return next;
                              });
                              setPresets(nextPresets);
                              generateSelectedPreset(nextPresets).catch(() => undefined);
                            }}
                          />
                        </div>
                        {selectedPreset.crop ? (
                          <small className="muted">
                            Crop: x {selectedPreset.crop.x.toFixed(2)} y {selectedPreset.crop.y.toFixed(2)} w {selectedPreset.crop.w.toFixed(2)} h {selectedPreset.crop.h.toFixed(2)}
                          </small>
                        ) : null}
                      </div>
                    ) : (
                      <p className="muted">Select a preset to edit crop and preview.</p>
                    )}
                  </div>
                </div>
              </TabItem>

              <TabItem header="POIs">
                <div className="inline-actions mb-2">
                  <label>
                    <Checkbox checked={poiMode} onChange={(next) => setPoiMode(next)} /> POI mode (click image to add)
                  </label>
                </div>
                <DataGrid
                  data={pois}
                  columns={[
                    {
                      key: 'label',
                      header: 'Label',
                      cell: (row, index) => (
                        <TextInput
                          value={row.label ?? ''}
                          onChange={(next) => setPois((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, label: next } : entry)))}
                        />
                      )
                    },
                    {
                      key: '__link',
                      header: 'Link',
                      cell: (row, index) => (
                        <div className="inline-actions">
                          <LinkPickerButton
                            token={token}
                            siteId={siteId}
                            value={row.link ?? null}
                            onChange={(next) => setPois((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, link: next } : entry)))}
                            label="Set link"
                          />
                          <Button
                            text
                            label="Clear"
                            onClick={() =>
                              setPois((prev) =>
                                prev.map((entry, idx) => {
                                  if (idx !== index) {
                                    return entry;
                                  }
                                  const next = { ...entry };
                                  delete next.link;
                                  return next;
                                })
                              )
                            }
                          />
                        </div>
                      )
                    },
                    {
                      key: 'visible',
                      header: 'Visible',
                      cell: (row, index) => (
                        <Checkbox
                          checked={row.visible !== false}
                          onChange={(next) =>
                            setPois((prev) =>
                              prev.map((entry, idx) => (idx === index ? { ...entry, visible: next } : entry))
                            )
                          }
                        />
                      )
                    },
                    {
                      key: '__delete',
                      header: '',
                      cell: (_row, index) => (
                        <Button text severity="danger" label="Delete" onClick={() => setPois((prev) => prev.filter((_, idx) => idx !== index))} />
                      )
                    }
                  ]}
                />
              </TabItem>

              <TabItem header="Metadata">
                <div className="form-row">
                  <label>Title</label>
                  <TextInput value={title} onChange={(next) => setTitle(next)} />
                  <label>Alt text</label>
                  <TextInput value={altText} onChange={(next) => setAltText(next)} />
                  <label>Description</label>
                  <Textarea value={description} onChange={(next) => setDescription(next)} rows={4} />
                  <label>Tags (comma separated)</label>
                  <TextInput value={tags.join(', ')} onChange={(next) => setTags(next.split(',').map((entry) => entry.trim()).filter(Boolean))} />
                </div>
              </TabItem>

              <TabItem header="Advanced">
                <details>
                  <summary>JSON (advanced)</summary>
                  <div className="form-row mt-2">
                    <label>POIs JSON</label>
                    <Textarea value={poisJsonDraft} onChange={(next) => setPoisJsonDraft(next)} rows={6} />
                    <label>Rendition presets JSON</label>
                    <Textarea value={presetsJsonDraft} onChange={(next) => setPresetsJsonDraft(next)} rows={6} />
                    <Button label="Apply advanced JSON" text onClick={applyAdvancedJson} />
                  </div>
                </details>
              </TabItem>
            </Tabs>
          </div>
        </div>
      ) : null}

      <div className="inline-actions mt-3 justify-content-end">
        <Button label="Close" text onClick={onHide} />
        <Button label="Save" onClick={() => saveAll().catch(() => undefined)} loading={saving} />
      </div>
      {status ? <small className="muted">{status}</small> : null}

      <PresetDraftDialog visible={presetDialogOpen} value={presetDraft} onHide={() => setPresetDialogOpen(false)} onApply={applyPresetDialog} />
    </DialogPanel>
  );
}
