import { useState } from 'react';

import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { FormBuilderSection } from '../FormBuilderSection';

export function FormBuilderPage() {
  const { siteId } = useAdminContext();
  const [status, setStatus] = useState('');

  return (
    <div>
      <PageHeader title="Form Builder" subtitle="Steps, fields and conditional rules" />
      <FormBuilderSection siteId={siteId} onStatus={setStatus} />
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
