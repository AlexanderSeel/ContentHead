import { useAdminContext } from '../app/AdminContext';
import { Card } from '../ui/atoms';
import { WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../ui/molecules';

export function DashboardPage() {
  const { siteId, marketCode, localeCode, combos } = useAdminContext();

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Dashboard" subtitle="ContentHead Studio backend overview" />
      <WorkspaceBody>
        <div className="pane paneScroll card-grid">
        <Card title="Active Context">
          <p>Site: {siteId}</p>
          <p>Market/Locale: {marketCode}/{localeCode}</p>
          <p>Active combinations: {combos.filter((entry) => entry.active).length}</p>
        </Card>
        <Card title="Quick Links">
          <p>Use sidebar to navigate to Pages, Matrix, Workflows, and Dev Tools.</p>
        </Card>
        </div>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
