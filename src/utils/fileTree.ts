import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  "coverage",
  "__pycache__",
  ".turbo",
  ".cache",
  ".idea",
  ".vscode",
]);

const EXCLUDE_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
]);

export interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export function buildFileTree(
  dirPath: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): FileTreeNode[] {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    const nodes: FileTreeNode[] = [];

    // Sort: directories first, then files
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entry.name.startsWith(".") && EXCLUDE_DIRS.has(entry.name)) continue;
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      if (EXCLUDE_FILES.has(entry.name)) continue;

      if (entry.isDirectory()) {
        const children = buildFileTree(
          join(dirPath, entry.name),
          maxDepth,
          currentDepth + 1
        );
        nodes.push({
          name: entry.name,
          type: "directory",
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          type: "file",
        });
      }
    }

    return nodes;
  } catch (error) {
    return [];
  }
}

export function fileTreeToString(
  nodes: FileTreeNode[],
  prefix: string = ""
): string {
  let result = "";

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    result += `${prefix}${connector}${node.name}\n`;

    if (node.type === "directory" && node.children?.length) {
      result += fileTreeToString(node.children, prefix + childPrefix);
    }
  }

  return result;
}

export function countFiles(dirPath: string): number {
  let count = 0;

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (EXCLUDE_DIRS.has(entry.name)) continue;
        if (EXCLUDE_FILES.has(entry.name)) continue;

        if (entry.isDirectory()) {
          walk(join(dir, entry.name));
        } else {
          count++;
        }
      }
    } catch {
      // skip inaccessible directories
    }
  }

  walk(dirPath);
  return count;
}
