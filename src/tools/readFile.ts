import { readFileSync, statSync, existsSync } from "fs";
import { resolve } from "path";
import { getProjects } from "../store/projectStore.js";

const MAX_FILE_SIZE = 100 * 1024; // 100KB

export const readFileTool = {
  name: "read_file",
  description:
    "특정 파일의 내용을 읽어 반환합니다. 검색 결과에서 발견한 파일의 전체 내용을 확인할 때 사용합니다. 등록된 프로젝트 경로 내의 파일만 읽을 수 있습니다.",
  inputSchema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description: "읽을 파일의 절대 경로",
      },
    },
    required: ["path"],
  },
};

export async function handleReadFile(args: { path: string }) {
  const filePath = resolve(args.path);

  // Security check: file must be within a registered project
  const projects = getProjects();
  const isAllowed = projects.some((p) => filePath.startsWith(resolve(p.path)));

  if (!isAllowed) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 등록된 프로젝트 경로 밖의 파일은 읽을 수 없습니다: ${filePath}`,
        },
      ],
    };
  }

  if (!existsSync(filePath)) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 파일을 찾을 수 없습니다: ${filePath}`,
        },
      ],
    };
  }

  const stat = statSync(filePath);

  if (stat.size > MAX_FILE_SIZE) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 파일 크기가 100KB를 초과합니다 (${(stat.size / 1024).toFixed(1)}KB). 너무 큰 파일은 읽을 수 없습니다.`,
        },
      ],
    };
  }

  try {
    const content = readFileSync(filePath, "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: `📄 ${filePath}\n\n\`\`\`\n${content}\n\`\`\``,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 파일 읽기 실패: ${error.message}`,
        },
      ],
    };
  }
}
