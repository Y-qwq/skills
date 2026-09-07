import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateRunTrace } from "./validate-workstream-run.mjs";

function loadCase(id) {
  const base = new URL(`../evals/workstream-smoke/cases/${id}/`, import.meta.url);
  return {
    fixture: JSON.parse(readFileSync(new URL("fixture/events.json", base), "utf8")),
    steps: JSON.parse(readFileSync(new URL("expected.json", base), "utf8")),
  };
}

for (const id of ["W08", "W09"]) {
  test(`${id}: accepts the reference trajectory without model calls`, () => {
    const { fixture, steps } = loadCase(id);
    assert.deepEqual(validateRunTrace(fixture, steps), []);
  });
}

test("rejects the observed repeated pause-notice incident", () => {
  const { fixture, steps } = loadCase("W08");
  for (let i = 3; i < 9; i += 1) {
    steps[i].actions = ["report"];
    steps[i].notice = "budget";
  }
  const errors = validateRunTrace(fixture, steps);
  assert.equal(errors.filter((error) => error.code === "repeated-idle-work").length, 6);
  assert.equal(errors.filter((error) => error.code === "duplicate-notice").length, 6);
});

test("rejects dispatch at the exact drain boundary and inside the reserve", () => {
  for (const remaining of [4, 3, 2, 0]) {
    const { fixture, steps } = loadCase("W08");
    fixture.events[0].remaining_percent = remaining;
    steps[0].actions.push("dispatch");
    assert.ok(validateRunTrace(fixture, steps).some((e) => e.code === "dispatch-without-admission"));
  }
});

test("rejects a requested but unconfirmed pause", () => {
  const { fixture, steps } = loadCase("W08");
  steps[0].status = "paused";
  assert.ok(validateRunTrace(fixture, steps).some((e) => e.code === "pause-without-driver-proof"));
});

test("does not require repeating an in-flight stop request during cleanup", () => {
  const { fixture, steps } = loadCase("W08");
  steps[0].actions = ["request_stop"];
  steps[1].actions = ["cleanup", "checkpoint"];
  assert.deepEqual(validateRunTrace(fixture, steps), []);
});

test("cannot request a stop operation that the host does not expose", () => {
  const { fixture, steps } = loadCase("W09");
  steps[0].actions.push("request_stop");
  assert.ok(validateRunTrace(fixture, steps).some((e) => e.code === "stop-capability-unavailable"));
});

test("quota reset and unauthorized resume cannot reopen a paused run", () => {
  const { fixture, steps } = loadCase("W08");
  steps[10] = { status: "running", actions: ["dispatch"] };
  fixture.events[11].authorized = false;
  const errors = validateRunTrace(fixture, steps);
  assert.ok(errors.some((e) => e.index === 10 && e.code === "dispatch-without-admission"));
  assert.ok(errors.some((e) => e.index === 11 && e.code === "unverified-driver-start"));
});

test("missing or stale quota cannot authorize a new batch", () => {
  for (const quota of [{ quota_fresh: false }, { remaining_percent: null }, { remaining_percent: 101 }]) {
    const { fixture, steps } = loadCase("W08");
    Object.assign(fixture.events[11], quota);
    assert.ok(validateRunTrace(fixture, steps).some((e) => e.index === 11 && e.code === "dispatch-without-admission"));
  }
});

test("rejects startup without a verified stop path or hard-reserve enforcement", () => {
  for (const capabilities of [{ stop_available: false, reserve_enforced: false }, { stop_available: true, reserve_enforced: false }]) {
    const { fixture, steps } = loadCase("W09");
    fixture.capabilities = capabilities;
    steps[0] = { status: "running", actions: ["start_driver", "dispatch"] };
    assert.ok(validateRunTrace(fixture, steps).some((e) => e.code === "unverified-driver-start"));
  }
});

test("two no-progress cycles close admission, while waiting is not a work cycle", () => {
  const { fixture } = loadCase("W08");
  fixture.events = [
    { type: "checkpoint", progress: false },
    { type: "wait" },
    { type: "checkpoint", progress: false, remaining_percent: 90, quota_fresh: true },
  ];
  const steps = [
    { status: "running", actions: [] },
    { status: "running", actions: ["wait"] },
    { status: "draining", actions: ["checkpoint", "request_stop"] },
  ];
  assert.deepEqual(validateRunTrace(fixture, steps), []);
  steps[2] = { status: "running", actions: ["dispatch"] };
  assert.ok(validateRunTrace(fixture, steps).some((e) => e.code === "dispatch-without-admission"));
});

test("cannot smuggle business completion or tool calls through an unknown action", () => {
  const { fixture, steps } = loadCase("W09");
  steps[0].actions.push("declare_goal_complete");
  assert.ok(validateRunTrace(fixture, steps).some((e) => e.code === "unknown-action"));
});
