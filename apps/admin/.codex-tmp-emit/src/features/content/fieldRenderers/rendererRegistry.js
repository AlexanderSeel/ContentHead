export function validationMessage(field, value) {
    const validations = field.validations ?? {};
    if (field.required && (value == null || value === '' || (Array.isArray(value) && value.length === 0))) {
        return 'Required field';
    }
    if (typeof value === 'string') {
        if (typeof validations.minLength === 'number' && value.length < validations.minLength) {
            return `Min length: ${validations.minLength}`;
        }
        if (typeof validations.maxLength === 'number' && value.length > validations.maxLength) {
            return `Max length: ${validations.maxLength}`;
        }
        if (validations.regex) {
            try {
                if (!new RegExp(validations.regex).test(value)) {
                    return 'Invalid format';
                }
            }
            catch {
                return 'Invalid regex rule';
            }
        }
    }
    if (typeof value === 'number') {
        if (typeof validations.min === 'number' && value < validations.min) {
            return `Min: ${validations.min}`;
        }
        if (typeof validations.max === 'number' && value > validations.max) {
            return `Max: ${validations.max}`;
        }
    }
    return null;
}
