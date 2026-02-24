export type CompositionArea = { name: string; components: string[] };
export type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };

export type BuilderState = {
  areas: CompositionArea[];
  componentMap: Record<string, ComponentRecord>;
};

const defaultAreas: CompositionArea[] = [
  { name: 'header', components: [] },
  { name: 'main', components: [] },
  { name: 'sidebar', components: [] },
  { name: 'footer', components: [] }
];

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseBuilderState(compositionJson: string, componentsJson: string): BuilderState {
  const parsedComposition = parseJson<{ areas?: CompositionArea[] }>(compositionJson, { areas: defaultAreas });
  const parsedAreas = Array.isArray(parsedComposition.areas) ? parsedComposition.areas : defaultAreas;
  const areas = parsedAreas.length > 0 ? parsedAreas : defaultAreas;

  const parsedComponents = parseJson<Record<string, { type?: string; props?: Record<string, unknown> }>>(componentsJson, {});
  const componentMap: Record<string, ComponentRecord> = {};
  for (const [id, value] of Object.entries(parsedComponents)) {
    componentMap[id] = {
      id,
      type: typeof value?.type === 'string' ? value.type : 'text_block',
      props: value?.props && typeof value.props === 'object' ? value.props : {}
    };
  }

  return { areas, componentMap };
}

export function serializeBuilderState(state: BuilderState): { compositionJson: string; componentsJson: string } {
  const compositionJson = JSON.stringify({ areas: state.areas.map((area) => ({ name: area.name, components: area.components })) });
  const componentsJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(state.componentMap).map(([id, component]) => [id, { type: component.type, props: component.props }])
    )
  );
  return { compositionJson, componentsJson };
}

export function moveComponentInAreas(areas: CompositionArea[], id: string, direction: -1 | 1): CompositionArea[] {
  return areas.map((area) => {
    const index = area.components.findIndex((entry) => entry === id);
    if (index < 0) {
      return area;
    }
    const target = index + direction;
    if (target < 0 || target >= area.components.length) {
      return area;
    }
    const nextComponents = [...area.components];
    const [current] = nextComponents.splice(index, 1);
    if (!current) {
      return area;
    }
    nextComponents.splice(target, 0, current);
    return { ...area, components: nextComponents };
  });
}

export function removeComponentFromAreas(areas: CompositionArea[], id: string): CompositionArea[] {
  return areas.map((area) => ({ ...area, components: area.components.filter((entry) => entry !== id) }));
}

export function duplicateComponentInAreas(areas: CompositionArea[], id: string, duplicateId: string): CompositionArea[] {
  return areas.map((area) => {
    const index = area.components.findIndex((entry) => entry === id);
    if (index < 0) {
      return area;
    }
    const nextComponents = [...area.components];
    nextComponents.splice(index + 1, 0, duplicateId);
    return { ...area, components: nextComponents };
  });
}

export function placeComponentInArea(areas: CompositionArea[], areaName: string, id: string): CompositionArea[] {
  const baseAreas = areas.length > 0 ? areas : defaultAreas;
  const hasArea = baseAreas.some((area) => area.name === areaName);
  const expanded = hasArea ? baseAreas : [...baseAreas, { name: areaName, components: [] }];
  return expanded.map((area) => (area.name === areaName ? { ...area, components: [...area.components, id] } : area));
}

export function cloneProps<T extends Record<string, unknown>>(props: T): T {
  return JSON.parse(JSON.stringify(props)) as T;
}
