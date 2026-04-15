import {
  Fragment,
  useRef,
  useCallback,
  Children,
  isValidElement,
  type ReactNode,
  type CSSProperties
} from 'react';

export type SplitterResizeEndEvent = { sizes: number[] };

export type SplitterProps = {
  className?: string;
  style?: CSSProperties;
  layout?: 'horizontal' | 'vertical' | undefined;
  onResizeEnd?: (event: SplitterResizeEndEvent) => void;
  children?: ReactNode;
};

export type SplitterPanelProps = {
  size?: number;
  minSize?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** Inert container — Splitter reads its children's props, not rendered directly. */
export function SplitterPanel(_props: SplitterPanelProps) {
  return null;
}

export function Splitter({ className, style, layout = 'horizontal', onResizeEnd, children }: SplitterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Store panel elements in a map by index
  const panelEls = useRef<Map<number, HTMLDivElement>>(new Map());

  const isVertical = layout === 'vertical';
  const dirClass = isVertical ? 'p-splitter-vertical' : 'p-splitter-horizontal';

  // Collect panel specs from children
  const panels: Array<{ props: SplitterPanelProps; children: ReactNode }> = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === SplitterPanel) {
      panels.push({
        props: child.props as SplitterPanelProps,
        children: (child.props as SplitterPanelProps).children
      });
    }
  });

  const startDrag = useCallback(
    (handleIdx: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const topPanel = panelEls.current.get(handleIdx);
      const bottomPanel = panelEls.current.get(handleIdx + 1);
      if (!topPanel || !bottomPanel) return;

      const containerRect = container.getBoundingClientRect();
      const totalSize = isVertical ? containerRect.height : containerRect.width;
      const startPos = isVertical ? e.clientY : e.clientX;

      const topStart = isVertical
        ? topPanel.getBoundingClientRect().height
        : topPanel.getBoundingClientRect().width;
      const bottomStart = isVertical
        ? bottomPanel.getBoundingClientRect().height
        : bottomPanel.getBoundingClientRect().width;

      const topPanel_props = panels[handleIdx]?.props;
      const bottomPanel_props = panels[handleIdx + 1]?.props;
      const minTop = ((topPanel_props?.minSize ?? 0) / 100) * totalSize;
      const minBottom = ((bottomPanel_props?.minSize ?? 0) / 100) * totalSize;

      const onMove = (me: MouseEvent) => {
        const delta = isVertical ? me.clientY - startPos : me.clientX - startPos;
        let newTop = Math.max(minTop, topStart + delta);
        let newBottom = Math.max(minBottom, bottomStart - delta);

        if (newTop < minTop) { newTop = minTop; newBottom = topStart + bottomStart - minTop; }
        if (newBottom < minBottom) { newBottom = minBottom; newTop = topStart + bottomStart - minBottom; }

        if (isVertical) {
          topPanel.style.flexBasis = `${newTop}px`;
          topPanel.style.flexGrow = '0';
          bottomPanel.style.flexBasis = `${newBottom}px`;
          bottomPanel.style.flexGrow = '0';
        } else {
          topPanel.style.flexBasis = `${newTop}px`;
          topPanel.style.flexGrow = '0';
          bottomPanel.style.flexBasis = `${newBottom}px`;
          bottomPanel.style.flexGrow = '0';
        }
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const sizes = Array.from({ length: panels.length }, (_, i) => {
          const el = panelEls.current.get(i);
          const size = el
            ? isVertical
              ? el.getBoundingClientRect().height
              : el.getBoundingClientRect().width
            : 0;
          return Math.round((size / totalSize) * 100);
        });
        onResizeEnd?.({ sizes });
      };

      document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVertical, onResizeEnd]
  );

  const classes = ['p-splitter', dirClass, className].filter(Boolean).join(' ');
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    overflow: 'hidden',
    ...style
  };

  if (panels.length === 0) {
    return <div className={classes} style={containerStyle}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={classes} style={containerStyle}>
      {panels.map((panel, idx) => (
        <Fragment key={idx}>
          <div
            ref={(el) => {
              if (el) panelEls.current.set(idx, el);
              else panelEls.current.delete(idx);
            }}
            className={['p-splitter-panel', panel.props.className].filter(Boolean).join(' ')}
            style={{
              flexBasis: `${panel.props.size ?? 50}%`,
              [isVertical ? 'minHeight' : 'minWidth']: `${panel.props.minSize ?? 0}%`,
              flexShrink: 1,
              flexGrow: 1,
              overflow: 'hidden',
              ...panel.props.style
            }}
          >
            {panel.children}
          </div>
          {idx < panels.length - 1 ? (
            <div
              className="p-splitter-gutter"
              style={{ cursor: isVertical ? 'row-resize' : 'col-resize' }}
              onMouseDown={startDrag(idx)}
            >
              <div className="p-splitter-gutter-handle" />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
