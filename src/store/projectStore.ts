import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface Project {
  name: string;
  path: string;
  description: string;
  addedAt: string;
}

interface ProjectsData {
  projects: Project[];
}

const DATA_DIR = join(homedir(), ".git-finder-mcp");
const DATA_PATH = join(DATA_DIR, "projects.json");

function loadData(): ProjectsData {
  if (!existsSync(DATA_PATH)) {
    return { projects: [] };
  }
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function saveData(data: ProjectsData): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getProjects(): Project[] {
  return loadData().projects;
}

export function getProject(name: string): Project | undefined {
  return loadData().projects.find((p) => p.name === name);
}

export function addProject(project: Omit<Project, "addedAt">): Project {
  const data = loadData();

  const existing = data.projects.find((p) => p.name === project.name);
  if (existing) {
    throw new Error(`Project '${project.name}' already exists`);
  }

  const newProject: Project = {
    ...project,
    addedAt: new Date().toISOString(),
  };

  data.projects.push(newProject);
  saveData(data);
  return newProject;
}

export function removeProject(name: string): boolean {
  const data = loadData();
  const index = data.projects.findIndex((p) => p.name === name);

  if (index === -1) {
    return false;
  }

  data.projects.splice(index, 1);
  saveData(data);
  return true;
}
