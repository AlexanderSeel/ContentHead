import { AutoComplete as PrimeAutoComplete } from 'primereact/autocomplete';
import type { AutoCompleteProps, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

export type { AutoCompleteProps, AutoCompleteChangeEvent, AutoCompleteCompleteEvent };

export function AutoComplete(props: AutoCompleteProps) {
  return <PrimeAutoComplete {...props} />;
}
