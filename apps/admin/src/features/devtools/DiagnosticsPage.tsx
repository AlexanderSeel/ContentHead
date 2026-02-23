import { Card } from 'primereact/card';

import { PageHeader } from '../../components/common/PageHeader';

export function DiagnosticsPage() {
  return (
    <div>
      <PageHeader title="Diagnostics" subtitle="Build and environment info" />
      <Card>
        <pre>{JSON.stringify({
          mode: import.meta.env.MODE,
          dev: import.meta.env.DEV,
          apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'
        }, null, 2)}</pre>
      </Card>
    </div>
  );
}
