import { Button } from 'primereact/button';
import { useLocation } from 'react-router-dom';

export function Sidebar({ onClose }: { onClose: () => void }) {
  const location = useLocation();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <strong>Secondary Panel</strong>
        <Button icon="pi pi-times" text rounded size="small" aria-label="Close panel" onClick={onClose} />
      </div>
      <div className="status-panel">
        <div>Use this panel for page-specific context trees or filters.</div>
        <small>Current route: {location.pathname}</small>
      </div>
    </aside>
  );
}
