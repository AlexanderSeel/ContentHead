export function extractGraphqlErrorCode(error: unknown): string {
  const candidate = error as
    | {
        response?: {
          errors?: Array<{ extensions?: { code?: string } }>;
        };
      }
    | undefined;
  return candidate?.response?.errors?.[0]?.extensions?.code ?? '';
}

export function isForbiddenError(error: unknown): boolean {
  const code = extractGraphqlErrorCode(error);
  if (code === 'FORBIDDEN' || code === 'UNAUTHORIZED') {
    return true;
  }

  const text = String(error).toLowerCase();
  return text.includes('forbidden') || text.includes('unauthorized');
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return String(error);
}
