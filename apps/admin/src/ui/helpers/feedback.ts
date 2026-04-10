import { useUi } from '../../app/UiContext';

export function useToast() {
  const { toast } = useUi();
  return toast;
}

export function useConfirm() {
  const { confirm } = useUi();
  return confirm;
}
