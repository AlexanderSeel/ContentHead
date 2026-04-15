import { useState } from 'react';

export function Password({
  value,
  onChange,
  placeholder,
  toggleMask
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  toggleMask?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="p-password p-component p-inputwrapper">
      <input
        type={visible ? 'text' : 'password'}
        className="p-inputtext p-component p-password-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {toggleMask && (
        <button
          type="button"
          className="p-password-toggle-mask"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <span className={`pi ${visible ? 'pi-eye-slash' : 'pi-eye'}`} aria-hidden />
        </button>
      )}
    </span>
  );
}
