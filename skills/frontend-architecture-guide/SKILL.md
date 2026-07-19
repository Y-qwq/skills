---
name: frontend-architecture-guide
description: >
  Use when designing, refactoring, or reviewing React frontend structure: component and custom Hook
  boundaries, state ownership or Provider scope, abstractions, feature/module organization, layered
  architecture, or where state, logic, and files should live. Not for Effect dependencies, refs,
  memoization, or stale closures; use react-best-practices.
---

# Frontend Architecture Guide

A decision framework for writing **Simple** (not just Easy) frontend code. Teaches architectural judgment — when to split, what granularity, how to structure.

## Principles

Guidelines, not rigid rules. Apply judgment based on context.

### Responsibility & Boundaries

**1. Single Responsibility Principle**
If a component/hook would be modified for two unrelated business requirements, split it.
> "If product changes feature X, does this file change? What about feature Y? If both, split."

**2. Consumers don't need to read the source**
Usage should be fully understandable from the interface (props / return values).
> "Do you need to read the source code to use this correctly?"

**3. A single prop shouldn't change component identity**
If a prop leads to entirely different render branches, it's multiple components pretending to be one.
> "Remove this prop — does the remaining code still make sense? If not, split."

**4. UI and logic are separable**
Swapping the UI library shouldn't require rewriting business logic.
> "Does the logic code import any UI library? If yes, they're coupled."

### Data Flow & State

**5. State lives where it's needed**
State belongs in the smallest scope that uses it. Don't lift "just in case".
> "Delete this state — how many components break? One = keep local. Two+ siblings = nearest common ancestor."

Choose state tools by scope and lifetime:

| | Who needs access | How it's passed | Typical tools |
|---|---|---|---|
| Component state | Self only | — | useState |
| Parent-child passing | Parent + direct children | Explicit props | Lift to parent |
| Scoped shared state | Any level within a subtree | Implicit subscription | Per project convention (Context, scoped store, etc.) |
| Global state | Across feature boundaries | Implicit subscription | Global state management |

Implicit subscription is acceptable when the Provider boundary is clearly visible in the component tree.

### Complexity Control

**6. Structural abstractions serve clarity, not repetition count**
Don't extract hooks/components/files just because code repeats. When you see it three times, ask: would an abstraction make each call site clearer? If not, keep the repetition.
> "After extraction, will each consumer be simpler? Or will they need to understand a more complex generic interface?"

**7. Deduplicate business decisions, allow duplicate code**
DRY applies to business decisions (validation rules, status mappings, calculation formulas), not to similar-looking code. Same business rule in multiple places → extract to a named constant or pure function. Two blocks that look alike but represent different business intents → keep separate.
> "Do these blocks represent the same business decision that should change together? Yes → extract. No → keep separate."

When 6 and 7 conflict: **7 wins for shared business invariants** — business decisions must live in one place, even if the shared interface is slightly more complex. In all other cases, 6 wins.

**8. Flat over nested**
Prefer flat structures in both component trees and code logic. Deep nesting signals complexity.
> "Is nesting making the flow hard to scan? Can you flatten with early returns or splitting?"

**9. Composition over configuration**
Prefer letting consumers compose small units over building one large component configured by many props. Composition describes internal architecture; the consumer-facing API should be flat — use a facade component when composition produces deep nesting.
> "Are many props controlling layout or behavior variants? Can the component be split into composable sub-units?"

### Readability & Intent

**10. Explicit over implicit**
Dependencies and data flow should be visible from the code surface. No magic.
> "Does this line depend on runtime context, global state, or module-level side effects not visible in the function signature or import list?"

**11. Semantic variables, code as documentation**
Use named variables to express business intent rather than inlining complex expressions. Variable names answer "why"; expressions only answer "how it's computed".
> "Without context, can a reader tell what business meaning this expression carries? If not, extract it into a named variable."

### Purity

**12. Prefer pure functions**
Pure components and functions are easier to understand and test. Isolate and centralize side effects.
> "Same inputs, always same output? If not, can the side effect be pushed to the caller?"

## Unit vs Feature Folder

A feature folder ≈ bounded context, may contain multiple **units** (each = state machine / independent flow). **Run the decision tree per unit, not per feature** — running on a multi-unit feature falsely promotes to complex page when units share substrate.

Cross-unit shared layer goes by each item's own SRP, not forced into `domain/`. The DDD 4-layer physical split is for inside a bounded context only when complexity warrants — most features fit small business component without a `domain/` directory.

### Boundary features (no Screen, no unit)

Some features have no Screen and no unit — they wrap a subtree with a lifecycle responsibility (data prefetch, connection setup, identity sync). The tier decision tree does not apply: there is no domain rule, no orchestration flow, no presentation layer to escalate through.

Treat them as a distinct category. The questions are: where to mount, what suspense / error contract to own, what context to expose to descendants.

## Architecture Decision Tree

**Core principle: Complexity determines structure depth.** Don't apply the same architecture to everything. The decision tree guides module-level structure — Principle 6 still applies: if the total logic is clear in one read, keep it simple.

```
Does this unit have business rules testable independently of components?
├─ No → Does it have self-contained operation flows (CRUD, modal flows)?
│   ├─ No → [Pure display] Component + utils
│   │   · Component only renders
│   │   · Pure computation in .utils files
│   │
│   └─ Yes → [Small business component] Component + hooks + utils
│       · UI shell has no business logic, receives everything via props
│       · Prefer one focused hook per operation flow; expose only the state and actions that flow needs
│       · Data transforms and validation are independent pure functions
│       · Start with a focused `*.rules.ts` / `*.model.ts` file; introduce `domain/` when
│         multiple concerns or one sufficiently complex invariant makes the boundary clearer
│
└─ Yes → Multiple data sources to orchestrate, or multiple consumers sharing domain data?
    ├─ No → [Medium module] Component + hooks + domain/
    │   · domain: Domain models, business rules, domain data definitions and shared carriers, zero UI deps
    │   · Content added as needed — not all categories (types, validators, contexts) are required
    │   · Components may import pure functions from domain/ directly, but orchestration (API calls, multi-step flows) goes through hooks
    │
    └─ Yes → [Complex page] domain / application / presentation (/ infrastructure)
        · domain: Domain models, business rules, domain data definitions and shared carriers, zero UI deps
        · application: Orchestrates domain + external services, data transforms
        · presentation: Composes Providers + components only, no business decisions; modal/drawer visibility and stacking belongs here, but the decision of whether to trigger a modal is a business rule and belongs in application
        · infrastructure: External service adapters (skip if project has unified query layer)
```

**Hard constraints for layered architecture:**
- domain NEVER imports from presentation or application
- application NEVER imports from presentation
- presentation NEVER calls APIs directly or contains business rules
- Source-code dependencies point inward: presentation → application → domain
- infrastructure implements ports owned by application or domain and depends inward on those contracts

### Migration Signals

**Structure escalation:**
- **Pure display → Small business component**: Component starts containing API calls, form submissions, multi-step flows
- **Small business component → Medium module**: Hooks start containing business rules testable independently of components
- **Medium module → Complex page**: Multiple components need to share domain data, or a second data source needs orchestration
- **Any tier → simpler tier**: domain/ contains only type aliases with no business logic, or application hooks are trivial pass-throughs — re-run the decision tree and simplify

The first three migrations are purely additive (add directories + move files). Medium module to complex page may require splitting hooks that mix orchestration and UI logic — this is a reasonable refactoring cost.

**State scope escalation:**
- **Component → Parent-child**: A second sibling starts needing the same data
- **Parent-child → Scoped shared**: Props start passing through intermediate components that don't use them
- **Scoped shared → Global**: Data starts being used across feature boundaries
- **Lifetime extension**: State needs to survive beyond its current scope (e.g., persist across page navigation)

## Companion

Pair with **react-best-practices** for React API-level patterns (Effects, Refs, Custom Hooks).
