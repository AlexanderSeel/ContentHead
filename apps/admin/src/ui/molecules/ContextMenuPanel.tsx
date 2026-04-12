import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ContextMenu } from 'primereact/contextmenu';
import type { MenuItem } from 'primereact/menuitem';

export interface ContextMenuHandle {
  show(event: React.SyntheticEvent | React.MouseEvent | { originalEvent?: React.SyntheticEvent | MouseEvent }): void;
  hide(event?: React.SyntheticEvent | React.MouseEvent): void;
}

export const ContextMenuPanel = forwardRef<ContextMenuHandle, { model: MenuItem[] }>(
  ({ model }, ref) => {
    const innerRef = useRef<ContextMenu>(null);

    useImperativeHandle(ref, () => ({
      show: (event) => innerRef.current?.show(event as React.SyntheticEvent),
      hide: (event) => innerRef.current?.hide(event as React.SyntheticEvent)
    }));

    return <ContextMenu ref={innerRef} model={model} />;
  }
);

ContextMenuPanel.displayName = 'ContextMenuPanel';
