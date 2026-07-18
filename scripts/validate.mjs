import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(root, "skills");
const ignoredDirectories = new Set([".git", "node_modules"]);
const errors = [];

function fail(message) {
  errors.push(message);
}

async function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return {};
  }
}

function parseFrontmatter(content, relativePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    fail(`${relativePath}: missing YAML frontmatter`);
    return {};
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    fields[key] = value;
  }
  return fields;
}

async function walk(directory, visit) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath).split(path.sep).join("/");
    const stats = await lstat(absolutePath);

    if (stats.isSymbolicLink()) {
      fail(`${relativePath}: symlinks are not allowed`);
      continue;
    }

    await visit({ absolutePath, relativePath, stats });
    if (stats.isDirectory()) await walk(absolutePath, visit);
  }
}

const claudeMarketplace = await readJson(".claude-plugin/marketplace.json");
const claudePlugin = await readJson(".claude-plugin/plugin.json");
const codexMarketplace = await readJson(".agents/plugins/marketplace.json");
const codexPlugin = await readJson(".codex-plugin/plugin.json");

const expectedName = "y-qwq-skills";
const expectedSource = "./";
const expectedVersionPattern = /^\d+\.\d+\.\d+$/;

if (claudeMarketplace.name !== expectedName) fail("Claude marketplace name must be y-qwq-skills");
if (claudeMarketplace.plugins?.length !== 1) fail("Claude marketplace must contain exactly one plugin");
if (claudeMarketplace.plugins?.[0]?.name !== expectedName) fail("Claude marketplace plugin name mismatch");
if (claudeMarketplace.plugins?.[0]?.source !== expectedSource) fail("Claude marketplace source must be ./");

if (codexMarketplace.name !== expectedName) fail("Codex marketplace name must be y-qwq-skills");
if (codexMarketplace.plugins?.length !== 1) fail("Codex marketplace must contain exactly one plugin");
if (codexMarketplace.plugins?.[0]?.name !== expectedName) fail("Codex marketplace plugin name mismatch");
if (codexMarketplace.plugins?.[0]?.source?.source !== "local") fail("Codex marketplace source type must be local");
if (codexMarketplace.plugins?.[0]?.source?.path !== expectedSource) fail("Codex marketplace source path must be ./");
if (codexMarketplace.plugins?.[0]?.policy?.installation !== "AVAILABLE") fail("Codex installation policy must be AVAILABLE");
if (codexMarketplace.plugins?.[0]?.policy?.authentication !== "ON_INSTALL") fail("Codex authentication policy must be ON_INSTALL");

for (const field of ["name", "version", "description"]) {
  if (claudePlugin[field] !== codexPlugin[field]) fail(`Plugin manifest ${field} values must match`);
}
if (claudePlugin.author?.name !== codexPlugin.author?.name) fail("Plugin manifest author names must match");
if (claudePlugin.name !== expectedName) fail("Plugin manifest name must be y-qwq-skills");
if (!expectedVersionPattern.test(claudePlugin.version ?? "")) fail("Plugin version must use strict MAJOR.MINOR.PATCH semver");
if (codexPlugin.skills !== "./skills/") fail("Codex plugin skills path must be ./skills/");

let skillEntries = [];
try {
  skillEntries = (await readdir(skillsRoot, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith("."),
  );
} catch (error) {
  fail(`skills/: ${error.message}`);
}

if (skillEntries.length === 0) fail("skills/ must contain at least one skill directory");

const expectedSkillManifests = new Set();
for (const entry of skillEntries) {
  const relativePath = `skills/${entry.name}/SKILL.md`;
  expectedSkillManifests.add(relativePath);

  try {
    const content = await readFile(path.join(skillsRoot, entry.name, "SKILL.md"), "utf8");
    const frontmatter = parseFrontmatter(content, relativePath);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name ?? "")) {
      fail(`${relativePath}: name must be lowercase kebab-case`);
    }
    if (frontmatter.name !== entry.name) {
      fail(`${relativePath}: frontmatter name must match directory name ${entry.name}`);
    }
    if (!frontmatter.description) fail(`${relativePath}: description is required`);
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
  }
}

const discoveredSkillManifests = new Set();
await walk(root, async ({ relativePath, stats }) => {
  if (stats.isFile() && path.basename(relativePath) === "SKILL.md") {
    discoveredSkillManifests.add(relativePath);
  }
});

for (const relativePath of discoveredSkillManifests) {
  if (!expectedSkillManifests.has(relativePath)) {
    fail(`${relativePath}: SKILL.md must be a direct child of skills/<name>/`);
  }
}
for (const relativePath of expectedSkillManifests) {
  if (!discoveredSkillManifests.has(relativePath)) fail(`${relativePath}: skill manifest was not discovered`);
}

if (errors.length > 0) {
  console.error("Repository validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Repository validation passed (${skillEntries.length} skill${skillEntries.length === 1 ? "" : "s"}).`);
}
