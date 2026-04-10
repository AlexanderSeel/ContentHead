export type ButtonSeverity = 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast';

export type ButtonProps = {
  id?: string;
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

export function Button({
  id,
  label,
  icon,
  iconPos = 'left',
  onClick,
  disabled,
  loading,
  severity,
  size,
  text,
  rounded,
  outlined,
  type = 'button',
  'aria-label': ariaLabel,
  className
}: ButtonProps) {
  const classes = [
    'p-button',
    'p-component',
    severity ? `p-button-${severity}` : '',
    text ? 'p-button-text' : '',
    outlined ? 'p-button-outlined' : '',
    rounded ? 'p-button-rounded' : '',
    size === 'small' ? 'p-button-sm' : size === 'large' ? 'p-button-lg' : '',
    !label && icon ? 'p-button-icon-only' : '',
    loading ? 'p-disabled' : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ');

  const iconClass = [
    'p-button-icon',
    'pi',
    icon ?? '',
    label ? (iconPos === 'right' ? 'p-button-icon-right' : 'p-button-icon-left') : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button id={id} type={type} className={classes} onClick={onClick} disabled={disabled || loading} aria-label={ariaLabel}>
      {loading && <span className="p-button-loading-icon pi pi-spinner pi-spin" />}
      {!loading && icon && iconPos !== 'right' && <span className={iconClass} />}
      {label && <span className="p-button-label">{label}</span>}
      {!loading && icon && iconPos === 'right' && <span className={iconClass} />}
    </button>
  );
}
