export function Switch({
  value,
  onChange,
  disabled
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const classes = ['p-inputswitch', 'p-component', value ? 'p-inputswitch-checked' : '', disabled ? 'p-disabled' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      role="switch"
      aria-checked={value}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onChange(!value);
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onChange(!value);
        }
      }}
    >
      <input
        type="checkbox"
        checked={value}
        readOnly
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <span className="p-inputswitch-slider" />
    </div>
  );
}
