import { cp, lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills", "workstream");
const evalRoot = path.join(root, "evals", "workstream-smoke");
const errors = [];

function fail(message) {
  errors.push(message);
}

function resolveInside(base, relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    fail(`${label}: path is required`);
    return null;
  }
  const absolutePath = path.resolve(base, relativePath);
  const relative = path.relative(base, absolutePath);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail(`${label}: path must stay inside ${path.relative(root, base)}`);
    return null;
  }
  return absolutePath;
}

async function parseJson(absolutePath, label) {
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    fail(`${label}: ${error.message}`);
    return {};
  }
}

async function requireFile(base, relativePath, label) {
  const absolutePath = resolveInside(base, relativePath, label);
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

async function collectFiles(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(base, absolutePath).split(path.sep).join("/");
    const stats = await lstat(absolutePath);
    if (stats.isSymbolicLink()) {
      fail(`${path.relative(root, absolutePath)}: symlinks are not allowed`);
    } else if (stats.isDirectory()) {
      files.push(...await collectFiles(absolutePath, base));
    } else if (stats.isFile()) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

const manifest = await parseJson(path.join(evalRoot, "manifest.json"), "manifest.json");
if (manifest.version !== 1) fail("manifest.json: version must be 1");
if (!Array.isArray(manifest.cases) || manifest.cases.length < 4) {
  fail("manifest.json: backlog smoke corpus must contain at least four cases");
}

const caseIds = new Set();
const coveredBehaviors = new Set();
const verificationDepths = new Set(["receipt-only", "targeted", "independent"]);
const wipCountedLifecycles = ["scheduled", "in_progress", "reported"];
const wipExcludedLifecycles = ["backlog", "verified", "cancelled", "superseded"];
const requiredEvidenceFields = [
  "claim",
  "acceptance_refs",
  "evidence_kind",
  "ref_or_version",
  "environment",
  "command_or_source",
  "result",
  "observed_at",
  "limitations_or_unverified_gaps",
  "recovery_pointer",
];
const requiredLeadChecks = ["evidence-binding", "acceptance-coverage", "integration-coverage"];
const requiredEscalationTriggers = [
  "evidence-missing",
  "evidence-stale",
  "evidence-contradictory",
  "acceptance-or-integration-gap",
  "live-state-drift",
  "flaky-signal",
  "high-risk-or-irreversible",
  "worker-unverified-gap",
  "owner-requests-independent",
];
const requiredBehaviors = new Set([
  "capture-default",
  "one-shot-schedule-request",
  "readiness-lifecycle-separation",
  "pre-ready-explicit-override",
  "blocked-ready-not-runnable",
  "mode-does-not-relax-constraints",
  "verified-compaction",
  "project-declared-owner",
  "legacy-status-migration",
  "default-wip-limit",
  "wip-lifecycle-calculation",
  "evidence-first-verification",
  "verification-depths",
  "verification-escalation",
]);
for (const entry of manifest.cases ?? []) {
  const label = `manifest ${entry.id ?? "<missing>"}`;
  if (!/^W\d{2}$/.test(entry.id ?? "")) fail(`${label}: invalid id`);
  if (caseIds.has(entry.id)) fail(`${label}: duplicate id`);
  caseIds.add(entry.id);

  const expectedPrompt = `cases/${entry.id}/prompt.md`;
  const expectedFixtures = `cases/${entry.id}/fixture`;
  const expectedContract = `contracts/${entry.id}.json`;
  if (entry.prompt !== expectedPrompt) fail(`${label}: prompt must be ${expectedPrompt}`);
  if (entry.fixtures !== expectedFixtures) fail(`${label}: fixtures must be ${expectedFixtures}`);
  if (entry.contract !== expectedContract) fail(`${label}: contract must be ${expectedContract}`);

  const promptPath = await requireFile(evalRoot, entry.prompt, `${label} prompt`);
  const contractPath = await requireFile(evalRoot, entry.contract, `${label} contract`);
  const fixturePath = resolveInside(evalRoot, entry.fixtures, `${label} fixtures`);

  if (promptPath && (await readFile(promptPath, "utf8")).trim().length === 0) {
    fail(`${label}: prompt is empty`);
  }
  if (fixturePath) {
    try {
      const stats = await lstat(fixturePath);
      if (!stats.isDirectory() || stats.isSymbolicLink()) fail(`${label}: fixtures must be a regular directory`);
      const fixtureFiles = await collectFiles(fixturePath);
      if (fixtureFiles.length === 0) fail(`${label}: fixtures must contain at least one file`);
    } catch (error) {
      fail(`${label} fixtures: ${error.message}`);
    }
  }

  if (!contractPath) continue;
  const contract = await parseJson(contractPath, `${label} contract`);
  if (contract.id !== entry.id) fail(`${label}: contract id mismatch`);
  if (contract.critical !== true) fail(`${label}: smoke cases must be critical`);
  if (!Array.isArray(contract.behaviors) || contract.behaviors.length === 0) {
    fail(`${label}: behaviors must be a non-empty array`);
  } else if (contract.behaviors.some((value) => typeof value !== "string" || value.trim().length === 0)) {
    fail(`${label}: behaviors must contain non-empty strings`);
  } else {
    for (const behavior of contract.behaviors) coveredBehaviors.add(behavior);
  }
  for (const key of ["focus", "must_observe", "must_not_observe", "evidence"]) {
    if (!Array.isArray(contract[key]) || contract[key].length === 0) {
      fail(`${label}: ${key} must be a non-empty array`);
    } else if (contract[key].some((value) => typeof value !== "string" || value.trim().length === 0)) {
      fail(`${label}: ${key} must contain non-empty strings`);
    }
  }

  const verification = contract.verification;
  if (!verification || typeof verification !== "object" || Array.isArray(verification)) {
    fail(`${label}: verification must be a structured object`);
  } else {
    if (verification.default_depth !== "targeted") {
      fail(`${label}: verification.default_depth must be targeted`);
    }
    if (!Array.isArray(verification.depths) || verification.depths.length !== verificationDepths.size
      || new Set(verification.depths).size !== verification.depths.length
      || verification.depths.some((depth) => !verificationDepths.has(depth))) {
      fail(`${label}: verification.depths must enumerate receipt-only, targeted, independent`);
    }
    for (const [field, requiredValues] of [
      ["receipt_fields", requiredEvidenceFields],
      ["lead_checks", requiredLeadChecks],
      ["escalation_triggers", requiredEscalationTriggers],
    ]) {
      if (!Array.isArray(verification[field])
        || requiredValues.some((value) => !verification[field].includes(value))) {
        fail(`${label}: verification.${field} is missing required coverage`);
      }
    }
  }

  if (contract.wip !== undefined) {
    if (!contract.wip || typeof contract.wip !== "object" || Array.isArray(contract.wip)) {
      fail(`${label}: wip must be a structured object`);
    } else {
      if (contract.wip.default_limit !== 4) fail(`${label}: wip.default_limit must be 4`);
      if (JSON.stringify(contract.wip.counted_lifecycles) !== JSON.stringify(wipCountedLifecycles)) {
        fail(`${label}: wip.counted_lifecycles must be scheduled, in_progress, reported`);
      }
      if (JSON.stringify(contract.wip.excluded_lifecycles) !== JSON.stringify(wipExcludedLifecycles)) {
        fail(`${label}: wip.excluded_lifecycles must be backlog, verified, cancelled, superseded`);
      }
      if (contract.wip.formula !== "count(lifecycle in counted_lifecycles)") {
        fail(`${label}: wip.formula must define lifecycle-based counting`);
      }
    }
  }
}

for (const behavior of requiredBehaviors) {
  if (!coveredBehaviors.has(behavior)) fail(`smoke corpus missing behavior coverage: ${behavior}`);
}

try {
  const actualCaseIds = (await readdir(path.join(evalRoot, "cases"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const actualContractIds = (await readdir(path.join(evalRoot, "contracts"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -5))
    .sort();
  const expectedIds = [...caseIds].sort();
  if (JSON.stringify(actualCaseIds) !== JSON.stringify(expectedIds)) fail("cases/: inventory must match manifest ids");
  if (JSON.stringify(actualContractIds) !== JSON.stringify(expectedIds)) fail("contracts/: inventory must match manifest ids");
} catch (error) {
  fail(`evaluation inventory: ${error.message}`);
}

const skillFiles = await collectFiles(skillRoot);
for (const relativePath of skillFiles) {
  const content = await readFile(path.join(skillRoot, relativePath), "utf8");
  for (const forbidden of [
    { pattern: /\bcodex\b/i, label: "platform-specific Codex wording" },
    { pattern: /\bclaude\b/i, label: "platform-specific Claude wording" },
    { pattern: /\bexecutor\b/i, label: "private worker configuration wording" },
    { pattern: /\/Users\//, label: "user-specific absolute path" },
    { pattern: /Documents\/agents/, label: "physical agents storage path" },
  ]) {
    if (forbidden.pattern.test(content)) fail(`skills/workstream/${relativePath}: contains ${forbidden.label}`);
  }
}

const templateRoot = path.join(skillRoot, "assets", "context");
const expectedTemplates = ["context.md", "decisions.md", "history.md", "receipt.md", "state.md", "task.md"];
try {
  const actualTemplates = (await readdir(templateRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(actualTemplates) !== JSON.stringify(expectedTemplates)) {
    fail(`context templates must be exactly: ${expectedTemplates.join(", ")}`);
  }
} catch (error) {
  fail(`context templates: ${error.message}`);
}

const requiredHeadings = {
  "context.md": ["# Outcome", "# Scope", "# Acceptance", "# Workspace map", "# Ownership and interfaces", "# User policies"],
  "decisions.md": ["# Decisions"],
  "history.md": ["# History", "# Retained evidence", "# Compaction notes"],
  "receipt.md": ["# Outcome", "# Changes", "# Validation", "# Claim-evidence mapping", "# Integration gate results", "# Observed state", "# Task handoff", "# Limitations and unverified gaps", "# Open issues", "# Recovery"],
  "state.md": ["# Current status", "# Scheduling policy", "# Backlog counts", "# Scheduled/in-progress/reported hot tasks", "# Next dispatch candidates", "# Integration checkpoints", "# Live references", "# Recovery points", "# Key blockers", "# Next actions"],
  "task.md": ["# Objective", "# Scope", "# Dependencies", "# Authority and stopping conditions", "# Acceptance", "# Verification", "# Expected receipt"],
};
for (const [file, headings] of Object.entries(requiredHeadings)) {
  try {
    const content = await readFile(path.join(templateRoot, file), "utf8");
    for (const heading of headings) {
      if (!content.includes(heading)) fail(`assets/context/${file}: missing ${heading}`);
    }
  } catch (error) {
    fail(`assets/context/${file}: ${error.message}`);
  }
}

const requiredTemplateFields = {
  "context.md": ["context_owner:", "active_context_root:", "active_branch_or_ref:", "default_execution_mode:", "default_wip_limit: 4", "default_verification_depth: targeted", "pre_ready_policy:"],
  "history.md": ["closed_at", "Evidence or recovery pointer", "active/hot", "Verification depth"],
  "receipt.md": ["result:", "reported", "readiness", "verification_depth:", "lead_verification:", "Claim-evidence mapping", "Evidence kind", "Exact ref/version", "Environment", "Command or source", "Observed at", "Limitations or unverified gaps", "Recovery pointer", "Integration gate results", "Expected version or contract"],
  "state.md": ["Readiness", "Lifecycle", "Blocked by", "Execution target", "Runnable is derived", "Backlog count", "One-shot request", "wip_limit: 4", "WIP count:", "scheduled` + `in_progress` + `reported", "WIP excludes", "Default verification depth"],
  "task.md": ["readiness:", "lifecycle:", "blocked_by:", "execution_target: null", "one_shot_schedule_request:", "execution_override:", "verification_depth: targeted", "verification:", "required_evidence", "integration_gates", "Verification contract"],
};
for (const [file, fields] of Object.entries(requiredTemplateFields)) {
  try {
    const content = await readFile(path.join(templateRoot, file), "utf8");
    for (const field of fields) {
      if (!content.includes(field)) fail(`assets/context/${file}: missing scheduling field ${field}`);
    }
  } catch (error) {
    fail(`assets/context/${file}: ${error.message}`);
  }
}

const delegationProtocol = await readFile(
  path.join(skillRoot, "references", "delegation-and-coordination.md"),
  "utf8",
);
for (const requiredToken of [
  "Worker validation",
  "Lead verification",
  "Evidence binding",
  "acceptance coverage",
  "integration coverage",
  "receipt-only",
  "targeted",
  "independent",
  "evidence 缺失",
  "ref、version、environment",
  "高风险、不可逆",
]) {
  if (!delegationProtocol.includes(requiredToken)) {
    fail(`delegation-and-coordination.md: missing verification protocol coverage for ${requiredToken}`);
  }
}

let temporaryRoot;
try {
  temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "workstream-smoke-"));
  const activeFolder = path.join(temporaryRoot, "sample-workstream");
  await cp(templateRoot, activeFolder, { recursive: true, errorOnExist: true });
  const copied = await collectFiles(activeFolder);
  if (JSON.stringify(copied) !== JSON.stringify(expectedTemplates)) {
    fail("context templates did not copy cleanly into an isolated workstream folder");
  }
} catch (error) {
  fail(`isolated template smoke: ${error.message}`);
} finally {
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error("Workstream smoke validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Workstream smoke validation passed (${manifest.cases.length} cases, ${expectedTemplates.length} templates).`);
}
