import {
  Children,
  isValidElement,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TreeNode = {
  key?: string | number;
  data?: unknown;
  children?: TreeNode[];
  leaf?: boolean;
  selectable?: boolean;
  className?: string;
  icon?: string;
  label?: string;
  [key: string]: unknown;
};

export type ColumnProps = {
  field?: string;
  header?: ReactNode;
  expander?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: (node: any, options?: unknown) => ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  headerStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  selectionMode?: 'single' | 'multiple' | 'checkbox';
  sortable?: boolean;
  style?: CSSProperties;
};

export type TreeTableProps = {
  value?: TreeNode[];
  expandedKeys?: Record<string, boolean>;
  onToggle?: (event: { value: Record<string, boolean> }) => void;
  selectionMode?: 'single' | 'multiple' | 'checkbox';
  selectionKeys?: string | string[] | Record<string, boolean> | null | undefined;
  onSelectionChange?: (event: { value: unknown }) => void;
  contextMenuSelectionKey?: string | null | undefined;
  onContextMenuSelectionChange?: (event: { value: unknown }) => void;
  onContextMenu?: (event: { node: TreeNode; originalEvent: MouseEvent }) => void;
  globalFilter?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

// ── Column shim ───────────────────────────────────────────────────────────────

/** Inert shim — TreeTable reads its props, not rendered directly. */
export function Column(_props: ColumnProps) {
  return null;
}

// ── TreeTable ─────────────────────────────────────────────────────────────────

export function TreeTable({
  value = [],
  expandedKeys,
  onToggle,
  selectionMode,
  selectionKeys,
  onSelectionChange,
  contextMenuSelectionKey,
  onContextMenuSelectionChange,
  onContextMenu,
  globalFilter,
  className,
  style,
  children
}: TreeTableProps) {
  const [internalExpanded, setInternalExpanded] = useState<Record<string, boolean>>({});

  const expanded = expandedKeys ?? internalExpanded;
  const setExpanded = onToggle
    ? (next: Record<string, boolean>) => onToggle({ value: next })
    : setInternalExpanded;

  // Collect column defs from Column children
  const columns: ColumnProps[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Column) {
      columns.push(child.props as ColumnProps);
    }
  });

  const selectedKey =
    typeof selectionKeys === 'string'
      ? selectionKeys
      : typeof contextMenuSelectionKey === 'string'
      ? contextMenuSelectionKey
      : null;

  const toggle = (key: string) => {
    setExpanded({ ...expanded, [key]: !expanded[key] });
  };

  const select = (node: TreeNode) => {
    const key = String(node.key ?? '');
    onSelectionChange?.({ value: key });
  };

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    const key = String(node.key ?? '');
    onContextMenuSelectionChange?.({ value: key });
    onContextMenu?.({ node, originalEvent: e.nativeEvent });
  };

  // Filter: walk tree and return nodes whose data matches globalFilter
  const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
    if (!globalFilter) return nodes;
    const q = globalFilter.toLowerCase();
    const filterOne = (node: TreeNode): TreeNode | null => {
      const text = JSON.stringify(node.data ?? node.label ?? '').toLowerCase();
      const filteredChildren = (node.children ?? []).map(filterOne).filter(Boolean) as TreeNode[];
      if (text.includes(q) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };
    return nodes.map(filterOne).filter(Boolean) as TreeNode[];
  };

  const renderRow = (node: TreeNode, depth: number): ReactNode => {
    const key = String(node.key ?? depth);
    const isExpanded = Boolean(expanded[key]);
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isSelected = selectedKey === key;

    return [
      <tr
        key={key}
        className={[
          'p-treetable-row',
          node.className,
          isSelected ? 'p-highlight' : '',
          contextMenuSelectionKey === key ? 'p-highlight-contextmenu' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => select(node)}
        onContextMenu={(e) => handleContextMenu(e, node)}
      >
        {columns.map((col, colIdx) => {
          const isExpander = col.expander;
          return (
            <td
              key={colIdx}
              className={col.bodyClassName}
              style={{ ...col.bodyStyle, ...col.style }}
            >
              {isExpander ? (
                <span className="p-treetable-toggler-row" style={{ paddingLeft: depth * 16 }}>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="p-treetable-toggler p-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(key);
                      }}
                      aria-expanded={isExpanded}
                    >
                      <span
                        className={`pi ${isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'}`}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <span className="p-treetable-toggler-spacer" />
                  )}
                  {col.body ? col.body(node) : String((node.data as Record<string, unknown>)?.[col.field ?? ''] ?? '')}
                </span>
              ) : col.body ? (
                col.body(node)
              ) : (
                String((node.data as Record<string, unknown>)?.[col.field ?? ''] ?? '')
              )}
            </td>
          );
        })}
      </tr>,
      ...(isExpanded && hasChildren
        ? (node.children ?? []).flatMap((child) => renderRow(child, depth + 1))
        : [])
    ];
  };

  const filtered = filterNodes(value);
  const classes = ['p-treetable', 'p-component', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      <div className="p-treetable-wrapper">
        <table className="p-treetable-table">
          <thead className="p-treetable-thead">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={col.headerClassName}
                  style={{ ...col.headerStyle, ...col.style }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="p-treetable-tbody">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-treetable-emptymessage">
                  No records
                </td>
              </tr>
            ) : (
              filtered.flatMap((node) => renderRow(node, 0))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
