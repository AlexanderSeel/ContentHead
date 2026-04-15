export type MessageSeverity = 'success' | 'info' | 'warn' | 'error';

export type MessageProps = {
  severity?: MessageSeverity;
  text?: string;
  className?: string;
};

const ICON_MAP: Record<MessageSeverity, string> = {
  success: 'pi-check-circle',
  info: 'pi-info-circle',
  warn: 'pi-exclamation-triangle',
  error: 'pi-times-circle'
};

export function Message({ severity = 'info', text, className }: MessageProps) {
  const icon = ICON_MAP[severity];
  const classes = ['p-message', `p-message-${severity}`, className].filter(Boolean).join(' ');
  return (
    <div className={classes} role="alert">
      <span className={`p-message-icon pi ${icon}`} aria-hidden />
      {text ? <span className="p-message-text">{text}</span> : null}
    </div>
  );
}
