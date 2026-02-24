import { removeProject } from "../store/projectStore.js";

export const removeProjectTool = {
  name: "remove_project",
  description: "등록된 프로젝트를 제거합니다.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "제거할 프로젝트 이름",
      },
    },
    required: ["name"],
  },
};

export async function handleRemoveProject(args: { name: string }) {
  const removed = removeProject(args.name);

  if (removed) {
    return {
      content: [
        {
          type: "text" as const,
          text: `✅ '${args.name}' 프로젝트가 제거되었습니다.`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `❌ '${args.name}' 프로젝트를 찾을 수 없습니다.`,
      },
    ],
  };
}
