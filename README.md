# Y-qwq Skills

A personal collection of reusable [Agent Skills](https://agentskills.io/) packaged as one plugin for Claude Code, Codex, `npx skills`, and CC Switch.

## Compatibility

| Consumer | Entry point | Status |
| --- | --- | --- |
| Claude Code | `.claude-plugin/marketplace.json` | Ready; private repositories require Git authentication |
| Codex | `.agents/plugins/marketplace.json` | Ready; private repositories require Git authentication |
| `npx skills` | `skills/*/SKILL.md` | Ready |
| CC Switch | Recursive `SKILL.md` discovery | Format ready; GitHub repository access requires the repository to be public |

## Architecture

The repository root is both the marketplace root and the single plugin root. Every consumer reads the same `skills/` directory, so there are no generated copies or symlinks.

```text
.
├── .agents/plugins/marketplace.json
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── .codex-plugin/plugin.json
└── skills/
    ├── frontend-architecture-guide/
    │   └── SKILL.md
    ├── react-best-practices/
    │   ├── SKILL.md
    │   └── react-patterns.md
    └── workstream/
        ├── SKILL.md
        ├── assets/context/
        └── references/
```

## Included skills

| Skill | Purpose |
| --- | --- |
| `frontend-architecture-guide` | Make component, state, abstraction boundary, and module organization decisions |
| `react-best-practices` | Implement and review Effects, refs, memoization, custom Hooks, and component data flow |
| `workstream` | Lead persistent, coordinated work across tasks, specialties, or repositories |

## Install

### Claude Code

Use the SSH URL while the repository is private:

```bash
claude plugin marketplace add git@github.com:Y-qwq/skills.git
claude plugin install y-qwq-skills@y-qwq-skills
```

### Codex

```bash
codex plugin marketplace add git@github.com:Y-qwq/skills.git
codex plugin add y-qwq-skills@y-qwq-skills
```

### npx skills

Install interactively from the private repository:

```bash
npx skills add git@github.com:Y-qwq/skills.git
```

Install only `react-best-practices` for Claude Code and Codex:

```bash
npx skills add git@github.com:Y-qwq/skills.git \
  --skill react-best-practices \
  --agent claude-code \
  --agent codex
```

### CC Switch

Once the repository is public, open **Skills → Repository Management → Add Repository** and enter:

```text
Owner: Y-qwq
Name: skills
Branch: main
```

CC Switch recursively discovers each `skills/*/SKILL.md`. Its current GitHub ZIP download flow does not authenticate to private repositories.

## Add a skill

Create each skill directly under `skills/`:

```text
skills/<skill-name>/SKILL.md
```

Keep the folder name equal to the `name` in the skill frontmatter. Do not add mirrored skill directories or symlinks: CC Switch scans the whole repository and would discover duplicates.

Run all checks before committing:

```bash
npm test
```

## Versioning

Claude Code and Codex plugin versions live in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`. Keep the two versions equal and bump both whenever installed plugin content should update. Marketplace entries and individual skills intentionally do not duplicate the plugin version.
