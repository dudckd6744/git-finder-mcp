import { existsSync, statSync } from "fs";
import { addProject } from "../store/projectStore.js";
import { countFiles } from "../utils/fileTree.js";

export const addProjectTool = {
  name: "add_project",
  description:
    "로컬 경로의 Git 프로젝트를 등록합니다. 등록된 프로젝트는 search_code, get_file_tree, read_file로 검색할 수 있습니다.",
  inputSchema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description: "프로젝트의 로컬 절대 경로 (예: /Users/box/work/my-monorepo/packages/payment)",
      },
      name: {
        type: "string",
        description: "프로젝트 이름 (예: payment-service)",
      },
      description: {
        type: "string",
        description: "프로젝트 설명 (예: 결제/주문 처리 서비스)",
      },
    },
    required: ["path", "name"],
  },
};

export async function handleAddProject(args: {
  path: string;
  name: string;
  description?: string;
}) {
  const { path, name, description = "" } = args;

  // Validate path exists
  if (!existsSync(path)) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 경로를 찾을 수 없습니다: ${path}`,
        },
      ],
    };
  }

  // Validate it's a directory
  if (!statSync(path).isDirectory()) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 경로가 디렉토리가 아닙니다: ${path}`,
        },
      ],
    };
  }

  try {
    const project = addProject({ name, path, description });
    const fileCount = countFiles(path);

    return {
      content: [
        {
          type: "text" as const,
          text: `✅ '${name}' 프로젝트가 등록되었습니다.\n📁 경로: ${path}\n📝 설명: ${description || "(없음)"}\n📄 파일 수: ${fileCount}개`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ ${error.message}`,
        },
      ],
    };
  }
}
