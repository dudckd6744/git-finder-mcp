import { getProjects } from "../store/projectStore.js";
import { countFiles } from "../utils/fileTree.js";

export const listProjectsTool = {
  name: "list_projects",
  description:
    "등록된 프로젝트 목록과 설명을 반환합니다. 검색 전에 호출하여 어떤 프로젝트가 있는지 파악하고, 설명을 기반으로 검색 범위를 좁힐 수 있습니다.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function handleListProjects() {
  const projects = getProjects();

  if (projects.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "등록된 프로젝트가 없습니다. add_project로 프로젝트를 등록해주세요.",
        },
      ],
    };
  }

  const lines = projects.map((p) => {
    const fileCount = countFiles(p.path);
    return `• ${p.name}\n  경로: ${p.path}\n  설명: ${p.description || "(없음)"}\n  파일: ${fileCount}개`;
  });

  return {
    content: [
      {
        type: "text" as const,
        text: `등록된 프로젝트 (${projects.length}개):\n\n${lines.join("\n\n")}`,
      },
    ],
  };
}
