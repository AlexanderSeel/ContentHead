import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { FormBuilderSection } from '../FormBuilderSection';

export function FormBuilderPage() {
  const { siteId } = useAdminContext();
  const { formId } = useParams<{ formId?: string }>();
  const [status, setStatus] = useState('');
  const initialFormId = formId ? Number(formId) : null;

  return (
    <div>
      <PageHeader title="Form Builder" subtitle="Steps, fields and conditional rules" />
      <FormBuilderSection siteId={siteId} initialFormId={Number.isFinite(initialFormId) ? initialFormId : null} onStatus={setStatus} />
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
