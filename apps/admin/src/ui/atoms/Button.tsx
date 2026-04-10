import { Button as PrimeButton } from 'primereact/button';

export type ButtonSeverity = 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast';

export type ButtonProps = {
  label?: string;
  icon?: string;
  iconPos?: 'left' | 'right' | 'top' | 'bottom';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  severity?: ButtonSeverity;
  size?: 'small' | 'large';
  text?: boolean;
  rounded?: boolean;
  outlined?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  className?: string;
};

export function Button({ onClick, ...props }: ButtonProps) {
  return <PrimeButton {...props} onClick={onClick ? () => onClick() : undefined} />;
}
