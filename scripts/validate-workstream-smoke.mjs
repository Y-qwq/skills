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
if (manifest.version !== 2) fail("manifest.json: version must be 2");
if (!Array.isArray(manifest.cases) || manifest.cases.length < 7) {
  fail("manifest.json: schema v2 smoke corpus must contain at least seven cases");
}

const caseIds = new Set();
const coveredBehaviors = new Set();
const requiredSchemaVersion = 2;
const stableIdPrefixes = {
  acceptance: "AC-",
  attempt: "AT-",
  review: "RV-",
};
const verificationDepths = new Set(["receipt-only", "targeted", "independent"]);
const wipCountedLifecycles = ["scheduled", "in_progress", "reported"];
const wipExcludedLifecycles = ["backlog", "verified", "cancelled", "superseded"];
const requiredEvidenceSpecFields = [
  "kind",
  "subject",
  "required_environment",
  "command_or_source",
  "freshness_or_ref_requirement",
];
const requiredObservedEvidenceFields = [
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
const requiredLeadVerificationFields = [
  "outcome",
  "effective_depth",
  "decided_at",
  "verified_at",
  "escalation_trigger",
  "additional_checks",
];
const verificationBehaviors = new Set([
  "evidence-first-verification",
  "verification-depths",
  "verification-escalation",
]);
let verificationSchemaContracts = 0;
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
  "schema-v2",
  "stable-acceptance-ids",
  "typed-dependencies-and-blockers",
  "capture-default",
  "one-shot-schedule-request",
  "readiness-lifecycle-separation",
  "pre-ready-explicit-override",
  "blocked-ready-not-runnable",
  "mode-does-not-relax-constraints",
  "verified-compaction",
  "project-declared-owner",
  "legacy-status-migration",
  "idempotent-schema-migration",
  "default-wip-limit",
  "wip-lifecycle-calculation",
  "evidence-first-verification",
  "verification-depths",
  "verification-escalation",
  "attempt-receipts",
  "task-lifecycle-source-of-truth",
  "retry-requeue",
  "failure-disposition",
  "owner-attention-queue",
  "review-nonblocking-default",
  "explicit-review-blocker",
  "blocking-scope-derived",
  "review-compaction",
  "lead-closeout-view",
  "review-content-sizing",
  "no-persisted-session-status",
]);
for (const entry of manifest.cases ?? []) {
  const label = `manifest ${entry.id ?? "<missing>"}`;
  if (!/^W\d{2}$/.test(entry.id ?? "")) fail(`${label}: invalid id`);
  if (caseIds.has(entry.id)) fail(`${label}: duplicate id`);
  caseIds.add(entry.id);

  const expectedPrompt = `cases/${entry.id}/prompt.md`;
  const expectedFixtures = `cases/${entry.id}/fixture`;
  const expectedContract = `contracts/${entry.id}.json`;
  const expectedResult = `cases/${entry.id}/expected.json`;
  if (entry.prompt !== expectedPrompt) fail(`${label}: prompt must be ${expectedPrompt}`);
  if (entry.fixtures !== expectedFixtures) fail(`${label}: fixtures must be ${expectedFixtures}`);
  if (entry.contract !== expectedContract) fail(`${label}: contract must be ${expectedContract}`);
  if (["W06", "W07"].includes(entry.id) && entry.expected !== expectedResult) {
    fail(`${label}: expected result must be ${expectedResult}`);
  }

  const promptPath = await requireFile(evalRoot, entry.prompt, `${label} prompt`);
  const contractPath = await requireFile(evalRoot, entry.contract, `${label} contract`);
  const fixturePath = resolveInside(evalRoot, entry.fixtures, `${label} fixtures`);
  const expectedResultPath = entry.expected
    ? await requireFile(evalRoot, entry.expected, `${label} expected result`)
    : null;
  const expectedState = expectedResultPath
    ? await parseJson(expectedResultPath, `${label} expected result`)
    : null;

  if (promptPath && (await readFile(promptPath, "utf8")).trim().length === 0) {
    fail(`${label}: prompt is empty`);
  }
  let fixtureFiles = [];
  if (fixturePath) {
    try {
      const stats = await lstat(fixturePath);
      if (!stats.isDirectory() || stats.isSymbolicLink()) fail(`${label}: fixtures must be a regular directory`);
      fixtureFiles = await collectFiles(fixturePath);
      if (fixtureFiles.length === 0) fail(`${label}: fixtures must contain at least one file`);
    } catch (error) {
      fail(`${label} fixtures: ${error.message}`);
    }
  }

  if (!contractPath) continue;
  const contract = await parseJson(contractPath, `${label} contract`);
  if (contract.id !== entry.id) fail(`${label}: contract id mismatch`);
  if (contract.critical !== true) fail(`${label}: smoke cases must be critical`);
  const schema = contract.schema;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    fail(`${label}: schema must declare the v2 ID namespaces`);
  } else {
    if (schema.version !== requiredSchemaVersion) fail(`${label}: schema.version must be 2`);
    for (const [namespace, prefix] of Object.entries(stableIdPrefixes)) {
      if (schema[`${namespace}_id_prefix`] !== prefix) {
        fail(`${label}: schema.${namespace}_id_prefix must be ${prefix}`);
      }
    }
  }
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

  if ((contract.behaviors ?? []).includes("attempt-receipts")) {
    const attempts = contract.attempts;
    if (!attempts || typeof attempts !== "object" || Array.isArray(attempts)) {
      fail(`${label}: attempts must be a structured schema for attempt-receipts`);
    } else {
      if (attempts.receipt_path !== "receipts/<task-id>/<attempt-id>.md") {
        fail(`${label}: attempts.receipt_path must use one directory per Task and one file per attempt`);
      }
      if (attempts.attempt_id_pattern !== "^AT-[0-9]{3}$") {
        fail(`${label}: attempts.attempt_id_pattern must use AT-* IDs`);
      }
      if (attempts.acceptance_ref_pattern !== "^AC-[0-9]{3}$") {
        fail(`${label}: attempts.acceptance_ref_pattern must use AC-* refs`);
      }
      if (!Array.isArray(attempts.required_lead_fields)
        || requiredLeadVerificationFields.some((field) => !attempts.required_lead_fields.includes(field))) {
        fail(`${label}: attempts.required_lead_fields is missing Lead decision fields`);
      }
    }
  }

  if ((contract.behaviors ?? []).some((behavior) => [
    "owner-attention-queue",
    "review-nonblocking-default",
    "explicit-review-blocker",
    "blocking-scope-derived",
    "lead-closeout-view",
    "review-content-sizing",
    "no-persisted-session-status",
    "review-compaction",
  ].includes(behavior))) {
    const review = contract.review;
    if (!review || typeof review !== "object" || Array.isArray(review)) {
      fail(`${label}: review must be a structured schema for owner-attention behaviors`);
    } else {
      if (review.id_pattern !== "^RV-[0-9]{3}$") fail(`${label}: review.id_pattern must use RV-* IDs`);
      if (JSON.stringify(review.intents) !== JSON.stringify(["inspect", "advise", "decide"])) {
        fail(`${label}: review.intents must enumerate inspect, advise, decide`);
      }
      if (JSON.stringify(review.statuses) !== JSON.stringify(["queued", "presented", "resolved", "waived", "superseded"])) {
        fail(`${label}: review.statuses must enumerate the v2 attention lifecycle`);
      }
      if (review.canonical_blocking_source !== "task.blockers[].ref") {
        fail(`${label}: review.canonical_blocking_source must be task.blockers[].ref`);
      }
      if (review.blocker_eligible_intent !== "decide") {
        fail(`${label}: only decide reviews may be blocker targets`);
      }
      if (JSON.stringify(review.blocker_eligible_statuses) !== JSON.stringify(["queued", "presented"])) {
        fail(`${label}: only queued or presented reviews may be blocker targets`);
      }
      if (review.wip_counted !== false) fail(`${label}: reviews must not count toward WIP`);
    }
  }

  if (entry.id === "W05") {
    for (const required of [
      "receipts/R-01/AT-001.md",
      "receipts/R-02/AT-001.md",
      "receipts/SEC-01/AT-001.md",
    ]) {
      if (!fixtureFiles.includes(required)) fail(`${label}: missing canonical attempt fixture ${required}`);
    }
  }

  if (entry.id === "W02") {
    if (!fixtureFiles.includes("migration-interruption.json")) {
      fail(`${label}: missing interrupted migration fixture`);
    } else {
      const migration = await parseJson(
        path.join(fixturePath, "migration-interruption.json"),
        `${label} interrupted migration fixture`,
      );
      if (migration.migration_state?.target_version !== 2
        || migration.migration_state?.status !== "in_progress"
        || migration.migration_state?.schema_version_committed !== false) {
        fail(`${label}: migration must remain in progress before the final schema marker`);
      }
      if (migration.receipt_move?.source !== "receipts/BE-01.md"
        || migration.receipt_move?.destination !== "receipts/BE-01/AT-001.md"
        || migration.receipt_move?.comparison !== "equivalent") {
        fail(`${label}: migration fixture must represent an equivalent receipt collision`);
      }
      if (migration.resume_policy?.equivalent_destination !== "retain-destination-and-continue"
        || migration.resume_policy?.divergent_destination !== "block-without-overwrite"
        || migration.resume_policy?.schema_version_commit_order !== "last"
        || migration.resume_policy?.successful_status !== "completed"
        || migration.resume_policy?.conflict_status !== "blocked") {
        fail(`${label}: migration resume policy must be idempotent and collision-safe`);
      }
    }
  }

  if (entry.id === "W06") {
    for (const required of [
      "receipts/T-101/AT-001.md",
      "receipts/T-102/AT-001.md",
      "receipts/T-103/AT-001.md",
    ]) {
      if (!fixtureFiles.includes(required)) fail(`${label}: missing ${required}`);
    }
    if (expectedState?.schema_version !== 2) fail(`${label}: expected schema_version must be 2`);
    const taskMap = new Map((expectedState?.tasks ?? []).map((task) => [task.id, task]));
    const attemptMap = new Map();
    for (const attempt of expectedState?.attempts ?? []) {
      const key = `${attempt.task_id}/${attempt.attempt_id}`;
      if (attemptMap.has(key)) fail(`${label}: duplicate expected attempt ${key}`);
      attemptMap.set(key, attempt);
      if (!/^AT-[0-9]{3}$/.test(attempt.attempt_id ?? "")) fail(`${label}: invalid expected attempt id ${attempt.attempt_id}`);
      if (!Array.isArray(attempt.acceptance_refs)
        || attempt.acceptance_refs.some((ref) => !/^AC-[0-9]{3}$/.test(ref))) {
        fail(`${label}: ${key} must use Task-local AC-* refs`);
      }
      if (typeof attempt.decided_at !== "string" || attempt.decided_at.length === 0) {
        fail(`${label}: ${key} must record decided_at`);
      }
      if (!verificationDepths.has(attempt.effective_depth)) {
        fail(`${label}: ${key} must record a valid effective_depth`);
      }
      if (!(attempt.escalation_trigger === null || typeof attempt.escalation_trigger === "string")) {
        fail(`${label}: ${key} must record escalation_trigger as null or a string`);
      }
      if (!Array.isArray(attempt.additional_checks)) {
        fail(`${label}: ${key} must record additional_checks`);
      }
      if (attempt.lead_outcome === "accepted") {
        if (typeof attempt.verified_at !== "string" || attempt.verified_at.length === 0) {
          fail(`${label}: accepted ${key} must record verified_at`);
        }
        if (!attempt.evidence_binding?.ref_or_version || !attempt.evidence_binding?.environment
          || attempt.evidence_binding?.result !== "passed") {
          fail(`${label}: accepted ${key} must bind passing evidence to a ref and environment`);
        }
        if (!Array.isArray(attempt.acceptance_coverage)
          || attempt.acceptance_refs.some((ref) => !attempt.acceptance_coverage.includes(ref))) {
          fail(`${label}: accepted ${key} must cover every acceptance ref`);
        }
        if (!Array.isArray(attempt.integration_coverage)
          || attempt.integration_coverage.some((gate) => !gate.gate || !gate.ref_or_version || gate.result !== "passed")) {
          fail(`${label}: accepted ${key} must record passing integration coverage`);
        }
      } else if (attempt.verified_at !== null) {
        fail(`${label}: non-accepted ${key} must keep verified_at null`);
      }
    }
    const t101 = taskMap.get("T-101");
    const t102 = taskMap.get("T-102");
    const t103 = taskMap.get("T-103");
    if (t101?.lifecycle !== "verified" || t101?.current_attempt_id !== "AT-002") {
      fail(`${label}: T-101 must be verified from AT-002`);
    }
    if (attemptMap.get("T-101/AT-001")?.lead_outcome !== "retry"
      || attemptMap.get("T-101/AT-002")?.lead_outcome !== "accepted") {
      fail(`${label}: T-101 must preserve retry AT-001 and accepted AT-002`);
    }
    if (attemptMap.get("T-102/AT-001")?.lead_outcome !== "blocked") {
      fail(`${label}: T-102 AT-001 must record the blocked Lead outcome`);
    }
    if (attemptMap.get("T-103/AT-001")?.lead_outcome !== "superseded") {
      fail(`${label}: T-103 AT-001 must record the superseded Lead outcome`);
    }
    if (t102?.lifecycle !== "backlog" || !Array.isArray(t102?.blockers) || t102.blockers.length === 0
      || t102.blockers.some((blocker) => !blocker.ref || !blocker.kind || !blocker.reason)) {
      fail(`${label}: T-102 must return to backlog with a typed blocker`);
    }
    if (t103?.lifecycle !== "superseded" || t103?.replacement_task !== "T-104") {
      fail(`${label}: T-103 must be superseded by T-104`);
    }
    const calculatedWip = [...taskMap.values()]
      .filter((task) => wipCountedLifecycles.includes(task.lifecycle)).length;
    if (expectedState?.wip_count !== calculatedWip) fail(`${label}: expected WIP must derive from Task lifecycle`);
    if (JSON.stringify(expectedState?.closeout_sections) !== JSON.stringify([
      "mode/WIP", "backlog counts", "hot tasks", "this-turn changes", "blockers", "owner attention",
    ])) fail(`${label}: expected closeout must contain all six sections`);
    if (expectedState?.session_record_created !== false) fail(`${label}: closeout must not create a session record`);
  }

  if (entry.id === "W07") {
    for (const required of [
      "receipts/T-201/AT-001.md",
      "reviews/RV-001.md",
      "reviews/RV-002.md",
      "reviews/RV-003.md",
      "invalid-review-blockers.md",
    ]) {
      if (!fixtureFiles.includes(required)) fail(`${label}: missing ${required}`);
    }
    const reviewFiles = fixtureFiles.filter((relativePath) => relativePath.startsWith("reviews/") && relativePath.endsWith(".md"));
    for (const relativePath of reviewFiles) {
      const reviewContent = await readFile(path.join(fixturePath, relativePath), "utf8");
      if (/^blocks:\s*/m.test(reviewContent)) fail(`${label}: ${relativePath} must not own canonical blocks`);
    }

    if (expectedState?.schema_version !== 2) fail(`${label}: expected schema_version must be 2`);
    const taskMap = new Map((expectedState?.tasks ?? []).map((task) => [task.id, task]));
    const reviewMap = new Map((expectedState?.active_reviews ?? []).map((review) => [review.id, review]));
    const reviewHistoryMap = new Map((expectedState?.review_history ?? []).map((review) => [review.id, review]));
    const attentionProjectionMap = new Map(
      (expectedState?.owner_attention_projection ?? []).map((review) => [review.id, review]),
    );
    if (taskMap.get("T-201")?.lifecycle !== "verified"
      || taskMap.get("T-202")?.lifecycle !== "backlog"
      || taskMap.get("T-203")?.lifecycle !== "in_progress") {
      fail(`${label}: expected Task lifecycles must preserve unrelated Lead progress`);
    }
    for (const [id, intent, status] of [
      ["RV-002", "advise", "presented"],
      ["RV-003", "decide", "queued"],
    ]) {
      const review = reviewMap.get(id);
      if (review?.intent !== intent || review?.status !== status) {
        fail(`${label}: ${id} must be ${intent}/${status}`);
      }
    }
    const resolvedInspect = reviewHistoryMap.get("RV-001");
    if (reviewMap.has("RV-001") || resolvedInspect?.intent !== "inspect"
      || resolvedInspect?.terminal_status !== "resolved"
      || resolvedInspect?.presentation !== "inline-full"
      || !resolvedInspect?.artifact_ref) {
      fail(`${label}: RV-001 must be fully presented, resolved into history, and removed from active reviews`);
    }
    for (const review of reviewHistoryMap.values()) {
      if (reviewMap.has(review.id) || !["resolved", "waived", "superseded"].includes(review.terminal_status)) {
        fail(`${label}: terminal review ${review.id} must exist only in review history`);
      }
    }
    const derivedBlockingTasks = new Map([...reviewMap.keys()].map((id) => [id, []]));
    for (const task of taskMap.values()) {
      for (const blocker of task.blockers ?? []) {
        const match = /^review:(RV-[0-9]{3})$/.exec(blocker.ref ?? "");
        if (!match) continue;
        const review = reviewMap.get(match[1]);
        if (!review || review.intent !== "decide" || !["queued", "presented"].includes(review.status)) {
          fail(`${label}: Task ${task.id} references a review that is not an active decide item`);
          continue;
        }
        derivedBlockingTasks.get(review.id).push(task.id);
      }
    }
    for (const review of reviewMap.values()) {
      const projection = attentionProjectionMap.get(review.id);
      const actual = [...(projection?.derived_blocking_tasks ?? [])].sort();
      const derived = [...(derivedBlockingTasks.get(review.id) ?? [])].sort();
      if (JSON.stringify(actual) !== JSON.stringify(derived)) {
        fail(`${label}: ${review.id} projection must reverse-derive blocking Tasks`);
      }
      if (review.intent !== "decide" && actual.length > 0) {
        fail(`${label}: ${review.id} cannot block because its intent is ${review.intent}`);
      }
    }
    const rv003Projection = attentionProjectionMap.get("RV-003");
    if (rv003Projection?.presentation !== "indexed"
      || !Number.isFinite(rv003Projection?.reading_cost_minutes)
      || rv003Projection.reading_cost_minutes <= 0
      || !Number.isInteger(rv003Projection?.recommendation_order)
      || rv003Projection.recommendation_order <= 0
      || rv003Projection?.owner_selection_supported !== true) {
      fail(`${label}: large RV-003 must have an index, reading cost, recommendation order, and owner selection path`);
    }
    const calculatedWip = [...taskMap.values()]
      .filter((task) => wipCountedLifecycles.includes(task.lifecycle)).length;
    if (expectedState?.wip_count !== calculatedWip) fail(`${label}: reviews must not contribute to expected WIP`);
    if (JSON.stringify(expectedState?.closeout_sections) !== JSON.stringify([
      "mode/WIP", "backlog counts", "hot tasks", "this-turn changes", "blockers", "owner attention",
    ])) fail(`${label}: expected closeout must contain all six sections`);
    if (expectedState?.session_record_created !== false) fail(`${label}: closeout must not create a session record`);
  }

  const requiresVerificationSchema = (contract.behaviors ?? []).some((behavior) => verificationBehaviors.has(behavior));
  if (requiresVerificationSchema) {
    verificationSchemaContracts += 1;
    const verification = contract.verification;
    if (!verification || typeof verification !== "object" || Array.isArray(verification)) {
      fail(`${label}: verification must be a structured object for its declared behaviors`);
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
        ["required_evidence_spec_fields", requiredEvidenceSpecFields],
        ["receipt_fields", requiredObservedEvidenceFields],
        ["lead_verification_fields", requiredLeadVerificationFields],
        ["lead_checks", requiredLeadChecks],
        ["escalation_triggers", requiredEscalationTriggers],
      ]) {
        if (!Array.isArray(verification[field])
          || requiredValues.some((value) => !verification[field].includes(value))) {
          fail(`${label}: verification.${field} is missing required coverage`);
        }
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
if (verificationSchemaContracts === 0) {
  fail("smoke corpus must declare at least one contract with the verification behavior schema");
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
const expectedTemplates = ["context.md", "decisions.md", "history.md", "receipt.md", "review.md", "state.md", "task.md"];
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
  "context.md": ["# Outcome", "# Scope", "# Workstream acceptance", "# Workspace map", "# Ownership and interfaces", "# User policies"],
  "decisions.md": ["# Decisions"],
  "history.md": ["# History", "# Owner attention history", "# Retained evidence", "# Compaction notes"],
  "receipt.md": ["# Outcome", "# Changes", "# Validation", "# Claim-evidence mapping", "# Integration gate results", "# Observed state", "# Task handoff", "# Limitations and unverified gaps", "# Open issues", "# Recovery"],
  "review.md": ["# Attention item", "# Intent and autonomy", "# Blocking scope (derived)", "# Reading guide", "# Resolution"],
  "state.md": ["# Current status", "# Scheduling projection", "# Backlog counts", "# Scheduled/in-progress/reported hot tasks", "# Next dispatch candidates", "# Integration checkpoints", "# Live references", "# Recovery points", "# Key blockers", "# Owner attention (derived)", "# Lead closeout view", "# Next actions"],
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

const requiredTemplateSchemaTokens = {
  "context.md": ["schema_version: 2", "context_owner:", "active_context_root:", "active_branch_or_ref:", "default_execution_mode: capture", "default_wip_limit: 4", "default_verification_depth: targeted", "pre_ready_policy: explicit_only", "WAC-001"],
  "history.md": ["schema_version: 2", "workstream_id:", "updated_at:"],
  "receipt.md": ["schema_version: 2", "task_id:", "attempt_id: \"{{attempt_id}}\"", "result:", "readiness_at_execution:", "requested_verification_depth:", "lead_verification:", "outcome: pending", "effective_depth: null", "decided_at: null", "verified_at: null", "escalation_trigger: null", "additional_checks: []"],
  "review.md": ["schema_version: 2", "id: \"{{review_id}}\"", "intent: inspect", "status: queued", "related_tasks: []", "context_refs: []", "estimated_minutes:", "content_size:"],
  "state.md": ["schema_version: 2", "execution_mode: capture", "wip_limit: 4", "pre_ready_policy: explicit_only", "default_verification_depth: targeted"],
  "task.md": ["schema_version: 2", "readiness:", "lifecycle: backlog", "dependencies: []", "blockers: []", "execution_target: null", "one_shot_schedule_request: null", "execution_override: null", "verification_depth: targeted", "current_attempt_id: null", "verification:", "required_evidence:", "subject:", "required_environment:", "freshness_or_ref_requirement:", "integration_gates:", "AC-001"],
};
for (const [file, fields] of Object.entries(requiredTemplateSchemaTokens)) {
  try {
    const content = await readFile(path.join(templateRoot, file), "utf8");
    for (const field of fields) {
      if (!content.includes(field)) fail(`assets/context/${file}: missing schema token ${field}`);
    }
  } catch (error) {
    fail(`assets/context/${file}: ${error.message}`);
  }
}

try {
  const taskTemplate = await readFile(path.join(templateRoot, "task.md"), "utf8");
  if (/^(?:depends_on|blocked_by):/m.test(taskTemplate)) {
    fail("assets/context/task.md: legacy dependency fields must not be canonical schema fields");
  }
  if (/^runnable:/m.test(taskTemplate)) fail("assets/context/task.md: runnable must remain derived");
  if (!/^dependencies:\s*\[\]|^dependencies:/m.test(taskTemplate)) {
    fail("assets/context/task.md: typed dependencies field is required");
  }
  if (!/^blockers:\s*\[\]|^blockers:/m.test(taskTemplate)) {
    fail("assets/context/task.md: typed blockers field is required");
  }

  const receiptTemplate = await readFile(path.join(templateRoot, "receipt.md"), "utf8");
  if (/lead_verification:\n\s+status:/m.test(receiptTemplate)) {
    fail("assets/context/receipt.md: lead_verification must use outcome, not status");
  }
  if (!/lead_verification:\n\s+outcome:\s+pending/m.test(receiptTemplate)) {
    fail("assets/context/receipt.md: pending Lead decision must use outcome");
  }
  if (!/attempt_id:\s+\"\{\{attempt_id\}\}\"/.test(receiptTemplate)) {
    fail("assets/context/receipt.md: attempt_id must use the runtime placeholder");
  }

  const reviewTemplate = await readFile(path.join(templateRoot, "review.md"), "utf8");
  if (/^blocks:\s*/m.test(reviewTemplate)) fail("assets/context/review.md: review must not own canonical blocks");
} catch (error) {
  fail(`schema v2 template checks: ${error.message}`);
}

const delegationProtocol = await readFile(path.join(
  skillRoot,
  "references",
  "delegation-and-coordination.md",
), "utf8");
for (const heading of [
  "## Verification contract",
  "## Worker validation",
  "## Lead verification and lifecycle decision",
  "## Owner attention and closeout",
]) {
  if (!delegationProtocol.includes(heading)) {
    fail(`delegation-and-coordination.md: missing protocol section ${heading}`);
  }
}

const requiredSchemaTokens = [
  "schema_version: 2",
  "tasks/<task-id>.md",
  "receipts/<task-id>/<attempt-id>.md",
  "reviews/<review-id>.md",
  "AC-001",
  "AT-001",
  "RV-001",
];
for (const requiredToken of requiredSchemaTokens) {
  const found = await (async () => {
    for (const relativePath of await collectFiles(skillRoot)) {
      if ((await readFile(path.join(skillRoot, relativePath), "utf8")).includes(requiredToken)) return true;
    }
    return false;
  })();
  if (!found) fail(`skills/workstream: missing schema token ${requiredToken}`);
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
  const receiptTemplate = await readFile(path.join(activeFolder, "receipt.md"), "utf8");
  const renderedRetryReceipt = receiptTemplate.replaceAll("{{attempt_id}}", "AT-002");
  const renderedAttempt = /^attempt_id:\s+"(AT-[0-9]{3})"$/m.exec(renderedRetryReceipt)?.[1];
  if (renderedAttempt !== "AT-002") {
    fail("receipt template did not render an AT-002 retry identity correctly");
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
