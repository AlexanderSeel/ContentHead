import type { ToastMessage } from 'primereact/toast';

import { useUi } from '../../app/UiContext';

export function useToast() {
  const { toast } = useUi();
  return (message: ToastMessage) => toast(message);
}

export function useConfirm() {
  const { confirm } = useUi();
  return confirm;
}
