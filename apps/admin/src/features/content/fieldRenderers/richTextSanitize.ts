const DISALLOWED_BLOCKS = /<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi;
const EVENT_ATTRS = /\s+on[a-z-]+="[^"]*"/gi;
const JS_HREF = /\s(href|src)=["']\s*javascript:[^"']*["']/gi;

export function sanitizeRichTextHtml(input: string): string {
  return (input || '')
    .replace(DISALLOWED_BLOCKS, '')
    .replace(EVENT_ATTRS, '')
    .replace(JS_HREF, '');
}
