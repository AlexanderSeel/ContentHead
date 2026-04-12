import { Children, forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonSeverity = 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label?: ReactNode;
  icon?: string;
  iconPos?: 'left' | 'right' | 'top' | 'bottom';
  loading?: boolean;
  severity?: ButtonSeverity;
  size?: 'small' | 'large';
  text?: boolean;
  rounded?: boolean;
  outlined?: boolean;
  children?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    label,
    icon,
    iconPos = 'left',
    disabled,
    loading,
    severity,
    size,
    text,
    rounded,
    outlined,
    type = 'button',
    className,
    children,
    ...props
  },
  ref
) {
  const hasContent = Boolean(label) || Children.count(children) > 0;
  const classes = [
    'p-button',
    'p-component',
    severity ? `p-button-${severity}` : '',
    text ? 'p-button-text' : '',
    outlined ? 'p-button-outlined' : '',
    rounded ? 'p-button-rounded' : '',
    size === 'small' ? 'p-button-sm' : size === 'large' ? 'p-button-lg' : '',
    !hasContent && icon ? 'p-button-icon-only' : '',
    loading ? 'p-disabled' : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ');

  const iconClass = [
    'p-button-icon',
    'pi',
    icon ?? '',
    hasContent ? (iconPos === 'right' ? 'p-button-icon-right' : 'p-button-icon-left') : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
    >
      {loading && <span className="p-button-loading-icon pi pi-spinner pi-spin" />}
      {!loading && icon && iconPos !== 'right' && <span className={iconClass} />}
      {label != null ? <span className="p-button-label">{label}</span> : children}
      {!loading && icon && iconPos === 'right' && <span className={iconClass} />}
    </button>
  );
});
