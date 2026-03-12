# Architecture

**Analysis Date:** 2026-03-12

## Pattern Overview

**Overall:** Modular orchestrator-agent system with multi-phase project execution, command-driven workflows, and state-driven progression.

**Key Characteristics:**
- Polyglot architecture: Node.js CLI tools + Markdown-based agent definitions + JSON state management
- Event-driven phase execution with checkpoint handling and auto-advance chains
- Single-developer project planning with Claude subagents as executors
- Planning → Execution → Verification loop with gap closure feedback
- Tool-centralized design: all state mutations go through `gsd-tools.cjs` CLI

## Layers

**CLI Tools Layer:**
- Purpose: Centralized state machine for all GSD operations, config management, phase lifecycle
- Location: `.claude/get-shit-done/bin/lib/*.cjs`
- Contains: Phase operations, state progression, template generation, frontmatter CRUD, verification, milestone tracking
- Depends on: fs, path, child_process (git)
- Used by: Orchestrator workflows, agents via `node gsd-tools.cjs` calls

**Orchestrator Workflows:**
- Purpose: Multi-agent coordination, parallel wave execution, checkpoint handling, result aggregation
- Location: `.claude/get-shit-done/workflows/*.md`
- Contains: Bash/CLI scripts that load context, spawn agents, monitor progress, handle failures
- Depends on: gsd-tools CLI, agent specs
- Used by: Claude Code command system (spawned by `/gsd:*` commands)

**Agent Definitions:**
- Purpose: Stateless execution templates for planning, execution, verification, research, debugging
- Location: `.claude/agents/*.md`
- Contains: Role definition, tool access, workflow instructions, context loading patterns
- Depends on: Planning/execution references, tools (Read, Write, Bash, Grep, Glob, WebFetch)
- Used by: Orchestrator workflows via Task spawn

**Command Definitions:**
- Purpose: User-facing command specifications and routing
- Location: `.claude/commands/gsd/*.md`
- Contains: Command description, arguments, linked workflow
- Depends on: Workflows
- Used by: Claude Code CLI system

**Project State & Config:**
- Purpose: Persistent project context and user preferences
- Location: `.planning/*.md` (STATE.md, ROADMAP.md, REQUIREMENTS.md), `.planning/config.json`
- Contains: Phases, requirements, project decisions, execution metrics, user preferences
- Depends on: Nothing (files, not code)
- Used by: All layers via CLI reads/writes

**Templates:**
- Purpose: Pre-formatted scaffolds for phase plans, summaries, context, verification
- Location: `.claude/get-shit-done/templates/*.md`
- Contains: Frontmatter schemas, markdown structure, placeholder fields
- Depends on: Nothing
- Used by: Template CLI commands during phase/task creation

## Data Flow

**Phase Execution Flow:**

1. User invokes `/gsd:execute-phase {N}`
2. Orchestrator calls `gsd-tools init execute-phase {N}` → loads state, phase details, plan inventory
3. Orchestrator discovers plans, groups by wave, detects dependencies
4. For each wave in sequence:
   - Report what will be built
   - Spawn executor agents (parallel if configured) with plan paths and context refs
   - Agents load PLAN.md, read requirements from codebase, execute tasks atomically
   - Each agent commits per-task, creates SUMMARY.md, updates STATE.md
   - Orchestrator spot-checks results (SUMMARY exists, git commits present)
   - If checkpoint (autonomous: false): pause and present to user, spawn continuation agent
5. After all waves: Spawn verifier agent to check phase goal achievement
6. Verifier returns: passed | gaps_found | human_needed
7. If gaps_found: offer `/gsd:plan-phase {N} --gaps` for gap closure
8. If passed: `gsd-tools phase complete {N}` updates ROADMAP, STATE, REQUIREMENTS
9. If auto-advance enabled: spawn transition workflow → next phase planning

**Planning Flow:**

1. User invokes `/gsd:plan-phase {N}`
2. Orchestrator loads CONTEXT.md (user decisions), ROADMAP.md (phase goals), codebase analysis
3. Planner decomposes goals into tasks, builds dependency graph, assigns waves
4. For each wave group: creates PLAN.md with frontmatter (phase, wave, tasks, must-haves, artifacts)
5. Planner returns: plan files, wave assignments
6. Orchestrator commits planning docs, offers `/gsd:execute-phase {N}`

**State Progression:**

1. Initial: user creates project with `/gsd:new-project`
2. STATE.md created with frontmatter: current_phase, position, started_at
3. Each execution: STATE.md updated with completed plans, decisions, metrics
4. ROADMAP.md tracks: phase checkboxes, progress table, phase completion dates
5. REQUIREMENTS.md tracks: requirement IDs, traceability to plan artifacts

**State Management:**
- File-based: STATE.md (markdown with frontmatter), config.json (JSON)
- State queried via: `gsd-tools state load`, `gsd-tools state get`, `gsd-tools config-get`
- State mutated via: `gsd-tools state update`, `gsd-tools state patch`, `gsd-tools config-set`
- All mutations append to history (STATE.md keeps decision log)

## Key Abstractions

**Phase:**
- Purpose: Discrete unit of work with goal, requirements, plans, and verification
- Examples: `1`, `1.2` (gap closure), `02` (decimal phases)
- Pattern: Decimal system — integer for major phases, `.Y` for gap-closure subphases
- Operations: create via `phase add`, complete via `phase complete`, renumber via `phase remove`
- Files: `.planning/phases/{N}/*.md` (PLAN, SUMMARY, VERIFICATION, UAT, DEBUG)

**Plan:**
- Purpose: Executable specification for one iteration of work with 2-3 tasks
- Examples: `01-01.md` (phase 1, plan 1), `02-03.md` (phase 2, plan 3)
- Pattern: Markdown with YAML frontmatter (phase, plan, wave, type, must-haves, artifacts) + objectives + context + tasks + success criteria
- Pattern: Can be type: execute (normal) or type: tdd (test-driven)
- Used by: Executor agents; read fresh with full context at execution start

**Task:**
- Purpose: Atomic unit of implementation work within a plan
- Examples: "Build component X", "Write tests for Y", "Integrate with API Z"
- Pattern: Each task has action (what to do), verification criteria (how to verify completion)
- Commitment: One git commit per task

**Wave:**
- Purpose: Grouping of plans with shared timing and dependencies
- Examples: Wave 1 (foundational), Wave 2 (builds on Wave 1), Wave 3 (integration)
- Pattern: Plans in same wave execute in parallel; waves execute sequentially
- Used by: Executor to batch spawn agents, planner to structure dependencies

**Checkpoint:**
- Purpose: Planned interruption for human decision or verification
- Examples: Code review checkpoint, manual UI testing, decision between two approaches
- Pattern: Task with `autonomous: false` in PLAN; executor pauses, returns state to orchestrator
- Used by: Checkpoint handling in execute-phase workflow

**Milestone:**
- Purpose: Collection of phases representing significant feature or release
- Examples: `v0.5`, `v1.0-alpha`, `MVP`
- Pattern: Archive old phases into milestone directory, create MILESTONES.md entry
- Files: `.planning/milestones/v{X}.{Y}-phases/` contains completed phase directories

## Entry Points

**User Commands (CLI):**
- Location: `.claude/commands/gsd/*.md`
- Triggers: `/gsd:{command}` invoked by user in Claude Code
- Responsibilities: Define command arguments, parse user intent, invoke workflow

**Workflow Orchestrators:**
- Location: `.claude/get-shit-done/workflows/*.md`
- Triggers: Command → workflow invocation
- Responsibilities: Load init context, spawn subagents, aggregate results, handle errors

**Agents:**
- Location: `.claude/agents/*.md`
- Triggers: Workflow Task() spawn
- Responsibilities: Execute specialized role (planner, executor, verifier, researcher, debugger)

**CLI Entrypoint:**
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`
- Triggers: `node gsd-tools.cjs {command} {args}`
- Responsibilities: Parse arguments, route to lib module, execute operation, output JSON

## Error Handling

**Strategy:** Multi-layered with rollback and user decision points

**Patterns:**
- **State consistency checks:** Before major operations, verify phase numbering, disk/roadmap sync via `validate consistency`
- **Agent failures:** Spot-check SUMMARY.md existence + git commits; if pass, treat as success despite agent reporting "failed" (known Claude Code bug)
- **Incomplete plans:** Skip on resume — run `/gsd:execute-phase {N}` again, orchestrator detects completed SUMMARYs, continues from first incomplete
- **Verification gaps:** Offer gap closure via `plan-phase --gaps` or manual verification via `/gsd:verify-work`
- **Checkpoint timeouts:** Pause execution, ask user to approve or skip plan
- **Validation failures:** `validate health --repair` can auto-fix .planning/ structure issues

## Cross-Cutting Concerns

**Logging:** Console output from orchestrators and agents; STATE.md decision log for audit trail; git commits for implementation history

**Validation:** Frontmatter schema validation (plan, summary, verification), path existence checks, reference resolution (file paths, requirement IDs), git commit verification

**Authentication:** None — assumes user is sole developer and has local git setup. Brave Search API optional for research phase.

---

*Architecture analysis: 2026-03-12*
