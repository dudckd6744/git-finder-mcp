import { execFile } from "child_process";
import { promisify } from "util";
import { rgPath } from "@vscode/ripgrep";

const execFileAsync = promisify(execFile);

export interface SearchResult {
  project: string;
  file: string;
  line: number;
  content: string;
  context: string[];
}

const EXCLUDE_GLOBS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  "coverage",
  "__pycache__",
  ".turbo",
  ".cache",
  "*.lock",
  "*.map",
  "*.min.js",
  "*.min.css",
];

export async function searchWithRipgrep(
  keyword: string,
  searchPaths: { name: string; path: string }[],
  options: {
    filePattern?: string;
    maxResults?: number;
    contextLines?: number;
  } = {}
): Promise<SearchResult[]> {
  const { filePattern, maxResults = 50, contextLines = 3 } = options;

  const results: SearchResult[] = [];

  for (const { name, path: searchPath } of searchPaths) {
    const args: string[] = [
      "--json",
      `--context=${contextLines}`,
      "--max-count=10", // max matches per file
      "--no-heading",
      "--smart-case",
    ];

    // Add exclude globs
    for (const glob of EXCLUDE_GLOBS) {
      args.push(`--glob=!${glob}`);
    }

    // Add file pattern filter
    if (filePattern) {
      args.push(`--glob=${filePattern}`);
    }

    args.push(keyword, searchPath);

    try {
      const { stdout } = await execFileAsync(rgPath, args, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 30000, // 30s
      });

      const parsed = parseRipgrepJson(stdout, name, searchPath);
      results.push(...parsed);

      if (results.length >= maxResults) {
        break;
      }
    } catch (error: any) {
      // rg returns exit code 1 when no matches found - that's OK
      if (error.code !== 1) {
        console.error(`ripgrep error for ${name}:`, error.message);
      }
    }
  }

  return results.slice(0, maxResults);
}

function parseRipgrepJson(
  output: string,
  projectName: string,
  basePath: string
): SearchResult[] {
  const results: SearchResult[] = [];
  const lines = output.trim().split("\n").filter(Boolean);

  let currentMatch: Partial<SearchResult> | null = null;
  let contextLines: string[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);

      if (parsed.type === "match") {
        if (currentMatch?.file) {
          results.push({
            project: projectName,
            file: currentMatch.file,
            line: currentMatch.line!,
            content: currentMatch.content!,
            context: [...contextLines],
          });
        }

        const filePath = parsed.data.path.text.replace(basePath + "/", "");
        currentMatch = {
          project: projectName,
          file: filePath,
          line: parsed.data.line_number,
          content: parsed.data.lines.text.trimEnd(),
        };
        contextLines = [];
      } else if (parsed.type === "context") {
        contextLines.push(parsed.data.lines.text.trimEnd());
      }
    } catch {
      // skip malformed JSON lines
    }
  }

  // Push last match
  if (currentMatch?.file) {
    results.push({
      project: projectName,
      file: currentMatch.file,
      line: currentMatch.line!,
      content: currentMatch.content!,
      context: [...contextLines],
    });
  }

  return results;
}
