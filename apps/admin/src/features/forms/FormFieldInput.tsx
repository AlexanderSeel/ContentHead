import { Checkbox, Textarea, TextInput } from '../../ui/atoms';
import { parseUiConfigJson } from './layoutModel';
import type { FormField } from './formBuilderTypes';

type Props = {
  field: FormField;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled: boolean;
  required: boolean;
  errors: Record<string, string>;
};

export function FormFieldInput({ field, answers, onChange, disabled, required, errors }: Props) {
  const uiConfig = parseUiConfigJson(field.uiConfigJson);
  const placeholder = typeof uiConfig.placeholder === 'string' ? uiConfig.placeholder : '';
  const value = answers[field.key];

  if (field.fieldType === 'divider') {
    return <hr />;
  }
  if (field.fieldType === 'section') {
    return <h4>{field.label}</h4>;
  }
  if (field.fieldType === 'help_text') {
    return <small>{typeof uiConfig.helpText === 'string' ? uiConfig.helpText : field.label}</small>;
  }
  if (field.fieldType === 'spacer') {
    return <div className="h-1rem" />;
  }

  if (field.fieldType === 'checkbox' || field.fieldType === 'consent') {
    return (
      <div>
        <label>
          <Checkbox checked={Boolean(value)} onChange={(next) => onChange(field.key, next)} disabled={disabled} />
          <span className="ml-2">{field.label}{required ? ' *' : ''}</span>
        </label>
        {errors[field.key] ? <small className="error-text">{errors[field.key]}</small> : null}
      </div>
    );
  }

  if (field.fieldType === 'textarea') {
    return (
      <div className="form-row">
        <label>{field.label}{required ? ' *' : ''}</label>
        <Textarea
          rows={3}
          value={String(value ?? '')}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(next) => onChange(field.key, next)}
        />
        {errors[field.key] ? <small className="error-text">{errors[field.key]}</small> : null}
      </div>
    );
  }

  return (
    <div className="form-row">
      <label>{field.label}{required ? ' *' : ''}</label>
      <TextInput
        value={String(value ?? '')}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(next) => onChange(field.key, next)}
      />
      {errors[field.key] ? <small className="error-text">{errors[field.key]}</small> : null}
    </div>
  );
}
