import { useState } from 'react';

import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { WorkflowDesignerSection } from '../WorkflowDesignerSection';

export function WorkflowDesignerPage() {
  const { siteId, marketCode, localeCode } = useAdminContext();
  const [status, setStatus] = useState('');

  return (
    <div>
      <PageHeader title="Workflow Designer" subtitle="Design and configure workflow graphs" />
      <WorkflowDesignerSection
        siteId={siteId}
        selectedItemId={null}
        selectedVariantSetId={null}
        market={marketCode}
        locale={localeCode}
        onStatus={setStatus}
      />
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
