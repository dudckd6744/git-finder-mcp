import { getProjects, getProject } from "../store/projectStore.js";
import { searchWithRipgrep, SearchResult } from "../utils/ripgrep.js";

export const searchCodeTool = {
  name: "search_code",
  description:
    "등록된 프로젝트들에서 키워드로 코드를 검색합니다. ripgrep을 사용하며, 특정 프로젝트로 제한하거나 파일 패턴을 지정할 수 있습니다. 한국어 키워드는 영어 키워드로도 검색하면 더 정확한 결과를 얻을 수 있습니다.",
  inputSchema: {
    type: "object" as const,
    properties: {
      keyword: {
        type: "string",
        description: "검색할 키워드 (예: payment, createOrder, 결제)",
      },
      project: {
        type: "string",
        description: "특정 프로젝트로 검색 범위 제한 (선택, 미지정시 전체 프로젝트 검색)",
      },
      file_pattern: {
        type: "string",
        description: "파일 패턴 필터 (선택, 예: \"*.ts\", \"*.controller.ts\", \"*.service.ts\")",
      },
    },
    required: ["keyword"],
  },
};

export async function handleSearchCode(args: {
  keyword: string;
  project?: string;
  file_pattern?: string;
}) {
  const { keyword, project, file_pattern } = args;

  let searchPaths: { name: string; path: string }[];

  if (project) {
    const p = getProject(project);
    if (!p) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ '${project}' 프로젝트를 찾을 수 없습니다. list_projects로 등록된 프로젝트를 확인해주세요.`,
          },
        ],
      };
    }
    searchPaths = [{ name: p.name, path: p.path }];
  } else {
    const projects = getProjects();
    if (projects.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "등록된 프로젝트가 없습니다. add_project로 프로젝트를 먼저 등록해주세요.",
          },
        ],
      };
    }
    searchPaths = projects.map((p) => ({ name: p.name, path: p.path }));
  }

  const results = await searchWithRipgrep(keyword, searchPaths, {
    filePattern: file_pattern,
    maxResults: 50,
    contextLines: 3,
  });

  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `'${keyword}' 에 대한 검색 결과가 없습니다.${project ? ` (프로젝트: ${project})` : ""}`,
        },
      ],
    };
  }

  const formatted = formatResults(results);

  return {
    content: [
      {
        type: "text" as const,
        text: `'${keyword}' 검색 결과 (${results.length}건):\n\n${formatted}`,
      },
    ],
  };
}

function formatResults(results: SearchResult[]): string {
  // Group by project
  const grouped = new Map<string, SearchResult[]>();
  for (const r of results) {
    if (!grouped.has(r.project)) {
      grouped.set(r.project, []);
    }
    grouped.get(r.project)!.push(r);
  }

  const parts: string[] = [];

  for (const [project, matches] of grouped) {
    parts.push(`📦 ${project}`);
    for (const match of matches) {
      parts.push(`  📄 ${match.file}:${match.line}`);
      parts.push(`     ${match.content}`);
      if (match.context.length > 0) {
        for (const ctx of match.context) {
          parts.push(`     ${ctx}`);
        }
      }
      parts.push("");
    }
  }

  return parts.join("\n");
}
