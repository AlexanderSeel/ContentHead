import { Message as PrimeMessage } from 'primereact/message';
import type { MessageProps } from 'primereact/message';

export type { MessageProps };

export function Message(props: MessageProps) {
  return <PrimeMessage {...props} />;
}
