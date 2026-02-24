import { getProject } from "../store/projectStore.js";
import { buildFileTree, fileTreeToString } from "../utils/fileTree.js";

export const getFileTreeTool = {
  name: "get_file_tree",
  description:
    "프로젝트의 파일/폴더 구조를 반환합니다. 프로젝트 구조를 파악하거나 검색 범위를 좁힐 때 사용합니다.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "프로젝트 이름",
      },
      depth: {
        type: "number",
        description: "트리 깊이 (기본: 3)",
      },
    },
    required: ["project"],
  },
};

export async function handleGetFileTree(args: {
  project: string;
  depth?: number;
}) {
  const { project, depth = 3 } = args;

  const p = getProject(project);
  if (!p) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ '${project}' 프로젝트를 찾을 수 없습니다.`,
        },
      ],
    };
  }

  const tree = buildFileTree(p.path, depth);
  const treeString = fileTreeToString(tree);

  return {
    content: [
      {
        type: "text" as const,
        text: `📂 ${p.name} (${p.path})\n\n${treeString}`,
      },
    ],
  };
}
