import { useState, type CSSProperties, type ReactNode } from 'react';
import type { TreeNode } from './TreeTablePanel';

export type { TreeNode };

export type TreeSelectionEvent = { value: string | string[] | Record<string, boolean> | null };
export type TreeExpandedEvent = { value: Record<string, boolean> };

export type TreeProps = {
  value?: TreeNode[];
  selectionMode?: 'single' | 'multiple' | 'checkbox';
  selectionKeys?: string | string[] | Record<string, boolean> | null;
  onSelectionChange?: (event: TreeSelectionEvent) => void;
  expandedKeys?: Record<string, boolean>;
  onToggle?: (event: TreeExpandedEvent) => void;
  filter?: boolean;
  filterMode?: 'strict' | 'lenient';
  className?: string;
  style?: CSSProperties;
  nodeTemplate?: ((node: TreeNode) => ReactNode) | undefined;
};

function nodeMatches(node: TreeNode, q: string): boolean {
  const text = String(node.label ?? node.key ?? '').toLowerCase();
  return text.includes(q);
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  return nodes
    .map((node) => {
      const childMatches = filterTree(node.children ?? [], q);
      if (nodeMatches(node, q) || childMatches.length > 0) {
        return { ...node, children: childMatches };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

function TreeNodeRow({
  node,
  depth,
  expanded,
  setExpanded,
  selectedKey,
  onSelect,
  nodeTemplate
}: {
  node: TreeNode;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: (next: Record<string, boolean>) => void;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  nodeTemplate?: ((node: TreeNode) => ReactNode) | undefined;
}) {
  const key = String(node.key ?? node.label ?? depth);
  const isExpanded = Boolean(expanded[key]);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = selectedKey === key;

  const toggle = () => {
    setExpanded({ ...expanded, [key]: !isExpanded });
  };

  return (
    <>
      <li
        className={['p-treenode', isSelected ? 'p-highlight' : ''].filter(Boolean).join(' ')}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
      >
        <div
          className="p-treenode-content"
          style={{ paddingLeft: depth * 16 }}
          onClick={() => onSelect(key)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="p-tree-toggler p-link"
              onClick={(e) => { e.stopPropagation(); toggle(); }}
            >
              <span className={`pi ${isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'}`} aria-hidden />
            </button>
          ) : (
            <span className="p-tree-toggler-spacer" />
          )}
          <span className="p-treenode-label">
            {nodeTemplate ? nodeTemplate(node) : (node.label ?? String(node.key ?? ''))}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <ul className="p-treenode-children" role="group">
            {(node.children ?? []).map((child, idx) => (
              <TreeNodeRow
                key={String(child.key ?? idx)}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                setExpanded={setExpanded}
                selectedKey={selectedKey}
                onSelect={onSelect}
                nodeTemplate={nodeTemplate}
              />
            ))}
          </ul>
        )}
      </li>
    </>
  );
}

export function Tree({
  value = [],
  selectionMode,
  selectionKeys,
  onSelectionChange,
  expandedKeys,
  onToggle,
  filter,
  className,
  style,
  nodeTemplate
}: TreeProps) {
  const [internalExpanded, setInternalExpanded] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState('');

  const expanded = expandedKeys ?? internalExpanded;
  const setExpanded = onToggle
    ? (next: Record<string, boolean>) => onToggle({ value: next })
    : setInternalExpanded;

  const selectedKey =
    typeof selectionKeys === 'string' ? selectionKeys : null;

  const onSelect = (key: string) => {
    if (selectionMode === 'single') {
      onSelectionChange?.({ value: key });
    }
  };

  const displayed = filterQuery ? filterTree(value, filterQuery.toLowerCase()) : value;
  const classes = ['p-tree', 'p-component', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      {filter ? (
        <div className="p-tree-filter-container">
          <input
            className="p-tree-filter p-inputtext p-component"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search..."
          />
          <span className="p-tree-filter-icon pi pi-search" aria-hidden />
        </div>
      ) : null}
      <ul className="p-tree-container" role="tree">
        {displayed.map((node, idx) => (
          <TreeNodeRow
            key={String(node.key ?? idx)}
            node={node}
            depth={0}
            expanded={expanded}
            setExpanded={setExpanded}
            selectedKey={selectedKey}
            onSelect={onSelect}
            nodeTemplate={nodeTemplate}
          />
        ))}
      </ul>
    </div>
  );
}
