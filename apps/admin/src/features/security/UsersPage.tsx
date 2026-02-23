import { Card } from 'primereact/card';

import { PageHeader } from '../../components/common/PageHeader';

export function UsersPage() {
  return (
    <div>
      <PageHeader title="Users" subtitle="Security management" />
      <Card>
        <p>User management UI placeholder. Authentication currently uses InternalAuthProvider seeded admin user.</p>
      </Card>
    </div>
  );
}
