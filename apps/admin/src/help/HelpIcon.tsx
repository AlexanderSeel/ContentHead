import { useId } from 'react';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';

export function HelpIcon({ tooltip, onClick }: { tooltip: string; onClick: () => void }) {
  const id = useId().replace(/:/g, '_');

  return (
    <>
      <Tooltip target={`#${id}`} content={tooltip} position="top" />
      <Button id={id} text rounded icon="pi pi-question-circle" aria-label="Help" onClick={onClick} />
    </>
  );
}
