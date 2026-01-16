import { cn } from '@/lib/utils';
import { Folder, File, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

interface FolderTreeProps {
  paths: string[];
  projectName: string;
}

interface TreeNode {
  name: string;
  isFolder: boolean;
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFolder = i < parts.length - 1 || path.endsWith('/');
      
      let node = current.find(n => n.name === part);
      if (!node) {
        node = { name: part, isFolder, children: [] };
        current.push(node);
      }
      current = node.children;
    }
  }

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .map(n => ({ ...n, children: sortNodes(n.children) }))
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
  };

  return sortNodes(root);
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const Icon = node.isFolder ? Folder : File;
  
  return (
    <div>
      <div 
        className={cn(
          'folder-tree-item',
          node.isFolder ? 'folder-tree-folder' : 'folder-tree-file'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.isFolder && node.children.length > 0 && (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
        <Icon className={cn(
          'w-4 h-4 flex-shrink-0',
          node.isFolder ? 'text-primary' : 'text-muted-foreground'
        )} />
        <span className="truncate">{node.name}</span>
      </div>
      {node.children.map((child, i) => (
        <TreeItem key={`${child.name}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FolderTree({ paths, projectName }: FolderTreeProps) {
  const tree = useMemo(() => buildTree(paths), [paths]);

  return (
    <div className="preview-panel h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Folder className="w-4 h-4 text-primary" />
        <span className="text-sm font-mono font-medium text-foreground">{projectName || 'project'}/</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {tree.length > 0 ? (
          tree.map((node, i) => (
            <TreeItem key={`${node.name}-${i}`} node={node} depth={0} />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            Configure your project to see the folder structure
          </div>
        )}
      </div>
      <div className="px-4 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {paths.filter(p => !p.endsWith('/')).length} files
        </p>
      </div>
    </div>
  );
}
