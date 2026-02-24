export type ContentEventType =
  | 'content.published'
  | 'content.draftSaved'
  | 'routes.updated'
  | 'types.updated'
  | 'assets.updated'
  | 'variants.updated';

type Listener = (event: { type: ContentEventType; at: string }) => void;

class ContentEventBus {
  private readonly listeners = new Set<Listener>();

  emit(type: ContentEventType): void {
    const event = { type, at: new Date().toISOString() };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const contentEventBus = new ContentEventBus();
