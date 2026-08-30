import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evalRoot = path.join(root, "evals", "react-skill-boundaries");
const errors = [];

function fail(message) {
  errors.push(message);
}

async function parseJson(absolutePath, label) {
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    fail(`${label}: ${error.message}`);
    return {};
  }
}

function safePath(relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    fail(`${label}: path is required`);
    return null;
  }
  const normalized = path.normalize(relativePath);
  if (path.isAbsolute(relativePath) || normalized.startsWith(`..${path.sep}`) || normalized === "..") {
    fail(`${label}: path must stay inside the evaluation directory`);
    return null;
  }
  return path.join(evalRoot, normalized);
}

async function requireFile(relativePath, label) {
  const absolutePath = safePath(relativePath, label);
  if (!absolutePath) return null;
  try {
    const stats = await lstat(absolutePath);
    if (!stats.isFile() || stats.isSymbolicLink()) fail(`${label}: must be a regular file`);
    return absolutePath;
  } catch (error) {
    fail(`${label}: ${error.message}`);
    return null;
  }
}

async function requireFixtureDirectory(relativePath, label) {
  const absolutePath = safePath(relativePath, label);
  if (!absolutePath) return;
  try {
    const stats = await lstat(absolutePath);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      fail(`${label}: must be a regular directory`);
      return;
    }
    const entries = await readdir(absolutePath, { withFileTypes: true });
    if (!entries.some((entry) => entry.isFile())) fail(`${label}: must contain at least one fixture file`);
    if (entries.some((entry) => entry.isSymbolicLink())) fail(`${label}: symlinks are not allowed`);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

const routingPath = path.join(evalRoot, "routing", "cases.jsonl");
let routingCases = [];
try {
  const lines = (await readFile(routingPath, "utf8")).trim().split(/\r?\n/);
  routingCases = lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`routing/cases.jsonl:${index + 1}: ${error.message}`);
      return {};
    }
  });
} catch (error) {
  fail(`routing/cases.jsonl: ${error.message}`);
}

const routingLabels = new Set(["architecture-only", "react-runtime-only", "both", "neither"]);
const routingIds = new Set();
for (const entry of routingCases) {
  if (!/^T\d{2}$/.test(entry.id ?? "")) fail(`routing ${entry.id ?? "<missing>"}: invalid id`);
  if (routingIds.has(entry.id)) fail(`routing ${entry.id}: duplicate id`);
  routingIds.add(entry.id);
  const unknownKeys = Object.keys(entry).filter((key) => !["id", "request"].includes(key));
  if (unknownKeys.length > 0) fail(`routing ${entry.id}: executor input contains unexpected keys ${unknownKeys.join(", ")}`);
  if (typeof entry.request !== "string" || entry.request.trim().length === 0) fail(`routing ${entry.id}: request is required`);
}
if (routingCases.length !== 20) fail(`routing/cases.jsonl: expected 20 cases, found ${routingCases.length}`);

const routingExpected = await parseJson(path.join(evalRoot, "routing", "expected.json"), "routing/expected.json");
if (routingExpected.version !== 1) fail("routing/expected.json: version must be 1");
const routingExpectedIds = Object.keys(routingExpected.labels ?? {});
const routingCriticalIds = routingExpected.critical_ids ?? [];
if (!Array.isArray(routingCriticalIds) || new Set(routingCriticalIds).size !== routingCriticalIds.length) {
  fail("routing/expected.json: critical_ids must be a unique array");
}
for (const id of routingCriticalIds) {
  if (!routingIds.has(id)) fail(`routing/expected.json: unknown critical id ${id}`);
}
for (const id of routingIds) {
  if (!routingLabels.has(routingExpected.labels?.[id])) fail(`routing/expected.json: missing or invalid label for ${id}`);
}
for (const id of routingExpectedIds) {
  if (!routingIds.has(id)) fail(`routing/expected.json: unexpected id ${id}`);
}
const expectedRoutingCounts = { "architecture-only": 6, "react-runtime-only": 6, both: 4, neither: 4 };
for (const [label, expectedCount] of Object.entries(expectedRoutingCounts)) {
  const actual = routingExpectedIds.filter((id) => routingExpected.labels[id] === label).length;
  if (actual !== expectedCount) fail(`routing/expected.json: ${label} expected ${expectedCount}, found ${actual}`);
}

const manifest = await parseJson(path.join(evalRoot, "manifest.json"), "manifest.json");
if (manifest.version !== 1) fail("manifest.json: version must be 1");
if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) fail("manifest.json: cases must be a non-empty array");

const families = new Set(["architecture-only", "react-runtime-only", "architecture-and-react-runtime"]);
const referencePolicies = new Set(["must-read", "must-not-read"]);
const evaluationTracks = new Set(["target", "preservation"]);
const manifestIds = new Set();
for (const entry of manifest.cases ?? []) {
  const label = `manifest ${entry.id ?? "<missing>"}`;
  if (!/^C\d{2}$/.test(entry.id ?? "")) fail(`${label}: invalid id`);
  if (manifestIds.has(entry.id)) fail(`${label}: duplicate id`);
  manifestIds.add(entry.id);

  const expectedPrompt = `behavioral/cases/${entry.id}/prompt.md`;
  const expectedFixtures = `behavioral/cases/${entry.id}/fixture`;
  const expectedContract = `behavioral/contracts/${entry.id}.json`;
  if (entry.prompt !== expectedPrompt) fail(`${label}: prompt must be ${expectedPrompt}`);
  if (entry.fixtures !== expectedFixtures) fail(`${label}: fixtures must be ${expectedFixtures}`);
  if (entry.contract !== expectedContract) fail(`${label}: contract must be ${expectedContract}`);

  const promptPath = await requireFile(entry.prompt, `${label} prompt`);
  await requireFixtureDirectory(entry.fixtures, `${label} fixtures`);
  const contractPath = await requireFile(entry.contract, `${label} contract`);
  if (promptPath) {
    const prompt = await readFile(promptPath, "utf8");
    if (prompt.trim().length === 0) fail(`${label}: prompt is empty`);
  }
  if (!contractPath) continue;

  const contract = await parseJson(contractPath, `${label} contract`);
  if (contract.id !== entry.id) fail(`${label}: contract id mismatch`);
  if (!families.has(contract.family)) fail(`${label}: invalid family`);
  if (typeof contract.critical !== "boolean") fail(`${label}: critical must be boolean`);
  const expectedSkills = contract.family === "architecture-only"
    ? ["frontend-architecture-guide"]
    : contract.family === "react-runtime-only"
      ? ["react-best-practices"]
      : ["frontend-architecture-guide", "react-best-practices"];
  if (JSON.stringify(contract.expected_skills) !== JSON.stringify(expectedSkills)) {
    fail(`${label}: expected_skills do not match family`);
  }
  const expectedTracks = contract.family === "architecture-only"
    ? ["target"]
    : contract.family === "react-runtime-only"
      ? ["preservation"]
      : ["target", "preservation"];
  if (JSON.stringify(contract.evaluation_tracks) !== JSON.stringify(expectedTracks)
    || contract.evaluation_tracks.some((track) => !evaluationTracks.has(track))) {
    fail(`${label}: evaluation_tracks do not match family`);
  }
  for (const key of ["architecture_levels", "react_patterns"]) {
    if (!referencePolicies.has(contract.reference_policy?.[key])) fail(`${label}: invalid ${key} policy`);
  }
  const expectsArchitecture = expectedSkills.includes("frontend-architecture-guide");
  const expectsReact = expectedSkills.includes("react-best-practices");
  if (!expectsArchitecture && contract.reference_policy?.architecture_levels !== "must-not-read") {
    fail(`${label}: architecture_levels must be must-not-read without the Architecture skill`);
  }
  if (!expectsReact && contract.reference_policy?.react_patterns !== "must-not-read") {
    fail(`${label}: react_patterns must be must-not-read without the React skill`);
  }
  for (const key of ["must_identify", "acceptable", "must_not"]) {
    if (!Array.isArray(contract[key]) || contract[key].length === 0 || contract[key].some((value) => typeof value !== "string" || value.trim().length === 0)) {
      fail(`${label}: ${key} must be a non-empty string array`);
    }
  }
}

try {
  const caseDirectories = (await readdir(path.join(evalRoot, "behavioral", "cases"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const contractIds = (await readdir(path.join(evalRoot, "behavioral", "contracts"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -5))
    .sort();
  const expectedIds = [...manifestIds].sort();
  if (JSON.stringify(caseDirectories) !== JSON.stringify(expectedIds)) fail("behavioral/cases: directories must exactly match manifest ids");
  if (JSON.stringify(contractIds) !== JSON.stringify(expectedIds)) fail("behavioral/contracts: files must exactly match manifest ids");
} catch (error) {
  fail(`behavioral corpus inventory: ${error.message}`);
}

if (errors.length > 0) {
  console.error("React skill evaluation corpus validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`React skill evaluation corpus passed (${routingCases.length} routing, ${manifest.cases.length} behavioral).`);
}
