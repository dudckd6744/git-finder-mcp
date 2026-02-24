#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { addProjectTool, handleAddProject } from "./tools/addProject.js";
import { removeProjectTool, handleRemoveProject } from "./tools/removeProject.js";
import { listProjectsTool, handleListProjects } from "./tools/listProjects.js";
import { searchCodeTool, handleSearchCode } from "./tools/searchCode.js";
import { getFileTreeTool, handleGetFileTree } from "./tools/getFileTree.js";
import { readFileTool, handleReadFile } from "./tools/readFile.js";

const server = new Server(
  {
    name: "git-finder-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      addProjectTool,
      removeProjectTool,
      listProjectsTool,
      searchCodeTool,
      getFileTreeTool,
      readFileTool,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "add_project":
      return handleAddProject(args as any);
    case "remove_project":
      return handleRemoveProject(args as any);
    case "list_projects":
      return handleListProjects();
    case "search_code":
      return handleSearchCode(args as any);
    case "get_file_tree":
      return handleGetFileTree(args as any);
    case "read_file":
      return handleReadFile(args as any);
    default:
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${name}`,
          },
        ],
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("git-finder-mcp server started");
}

main().catch(console.error);
