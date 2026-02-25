import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';

import { useUi } from '../../app/UiContext';
import { WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

export function PreferencesPage() {
  const { theme, themes, setTheme, scale, setScale } = useUi();

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Preferences" subtitle="Theme and UI scale settings for your admin workspace." />
      <WorkspaceBody>
        <section className="content-card pane w-full lg:w-8">
        <div className="form-grid">
          <div className="form-row">
            <label>Theme</label>
            <Dropdown
              value={theme}
              options={themes}
              optionLabel="label"
              optionValue="value"
              onChange={(event) => setTheme(String(event.value))}
              placeholder="Theme"
              filter
            />
          </div>
          <div className="form-row">
            <label>Scale: {scale}px</label>
            <Slider value={scale} min={12} max={16} step={1} onChange={(event) => setScale(Number(event.value ?? 14))} />
          </div>
        </div>
        </section>
      </WorkspaceBody>
    </WorkspacePage>
  );
}

