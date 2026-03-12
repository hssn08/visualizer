# Coding Conventions

**Analysis Date:** 2026-03-12

## Naming Patterns

**Files:**
- CommonJS modules: `.cjs` extension (e.g., `core.cjs`, `state.cjs`, `verify.cjs`)
- Functions exposed via `module.exports` at end of file
- Utility modules named after their domain: `core.cjs`, `config.cjs`, `state.cjs`, `phase.cjs`, `frontmatter.cjs`, `verify.cjs`
- Hook executables: `gsd-{name}.js` (e.g., `gsd-check-update.js`, `gsd-context-monitor.js`, `gsd-statusline.js`)

**Functions:**
- camelCase for all functions
- Command handlers: `cmd{FeatureName}` prefix (e.g., `cmdConfigEnsureSection`, `cmdStateLoad`, `cmdPhasesList`, `cmdVerifySummary`)
- Internal/utility functions: plain camelCase (e.g., `toPosixPath`, `escapeRegex`, `normalizePhaseName`, `searchPhaseInDir`)
- No function prefixes for private helpers; exported functions at module end

**Variables:**
- camelCase for all variables
- Constants in UPPER_SNAKE_CASE (e.g., `WARNING_THRESHOLD`, `CRITICAL_THRESHOLD`, `STALE_SECONDS`, `DEBOUNCE_CALLS`, `AUTO_COMPACT_BUFFER_PCT`)
- Object property names: camelCase (e.g., `model_profile`, `commit_docs`, `branching_strategy`)
- YAML/JSON keys: use snake_case for compatibility (e.g., `model_profile`, `phase_branch_template`)

**Types:**
- No TypeScript — pure JavaScript (Node.js CommonJS)
- JSDoc comments used minimally; inline comments preferred

## Code Style

**Formatting:**
- No `.prettierrc` or `.eslintrc` detected — code follows simple patterns
- 2-space indentation (observed throughout)
- No semicolon enforcement visible; mix of semicolons used pragmatically
- Lines generally kept reasonable length (< 100 chars, but no strict enforcement)

**Structure:**
- Modular organization: each `.cjs` file handles a single domain
- Shared exports: functions exported as an object at end of file
- Command routing: each command handler is a top-level function, often called by orchestrator scripts
- Guard clauses for early returns (e.g., error conditions, missing required args)

## File Organization

**Module Structure:**
- File header: JSDoc comment explaining module purpose (1-2 sentences)
- Imports at top: `require()` statements grouped by type (Node builtins, then local modules)
- Constants/helpers after imports
- Exported functions at end: `module.exports = { func1, func2, ... }`

**Example from `core.cjs`:**
```javascript
/**
 * Core — Shared utilities, constants, and internal helpers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Path helpers ────────────────────────────────────────────────────────────

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

// ─── Model Profile Table ─────────────────────────────────────────────────────
// [rest of file...]
```

**Section Headers:**
- ASCII dividers: `// ─── Section Name ────────────────────`
- Separates logical sections within a module
- Used in `core.cjs`, `frontmatter.cjs`, `state.cjs`

## Comments

**When to Comment:**
- Header JSDoc: required for each module explaining its purpose
- Section dividers: required to organize large files
- Complex logic: inline comments explain WHY, not WHAT (e.g., "Normalize: subtract buffer from remaining, scale to usable range")
- Guard clauses: sometimes commented (e.g., "If no metrics file, this is a subagent or fresh session -- exit silently")
- Workarounds: noted with explanation (e.g., "Respects CLAUDE_CONFIG_DIR for custom config directory setups (#870)")

**Comment Style:**
- Single-line: `// comment`
- No JSDoc tags (@param, @returns) used in this codebase
- Inline comments explain assumptions or non-obvious behavior

## Error Handling

**Patterns:**
- Explicit error function: `error(message)` in `core.cjs` writes to stderr and exits with code 1
- Try-catch for file I/O: catch block often silently fails with `catch (e) {}` or logs to stderr
- Guard clauses: early returns for invalid state
- Safe file reads: `safeReadFile(filePath)` returns null instead of throwing
- Default values: fallback to sensible defaults when config missing (e.g., `loadConfig()` merges user config with hardcoded defaults)

**Example from `gsd-context-monitor.js`:**
```javascript
try {
  const data = JSON.parse(input);
  // ... process
} catch (e) {
  // Silent fail -- never block tool execution
  process.exit(0);
}
```

**Exception Handling:**
- Timeouts: `setTimeout(() => process.exit(0), 3000)` prevents hanging on stdin
- Silent failures: used for non-critical operations (cache writes, file bridges)
- Explicit errors: used only when operation is critical (missing required args, file write failure)

## Function Design

**Size Guidelines:**
- Functions generally 20-80 lines
- Command handlers tend to be longer (50-120 lines) due to sequential processing
- Utility functions kept under 30 lines
- No explicit size limits enforced

**Parameters:**
- (cwd, ...args) pattern for most command handlers: working directory is almost always first param
- Optional parameters: passed as object (e.g., `options` in `cmdPhasesList(cwd, options, raw)`)
- Single responsibility: functions do one thing well (e.g., `toPosixPath` only converts paths)

**Return Values:**
- Command handlers: call `output(result, raw, rawValue)` to return (see Output Helpers below)
- Utility functions: return values directly (objects, strings, arrays, null)
- No Promise/async pattern used (Node.js synchronous)

**Output Helpers:**
- `output(result, raw, rawValue)`: writes to stdout and exits
  - Handles JSON serialization
  - Writes to temp file if > 50KB (outputs `@file:path` prefix)
  - `raw` flag: if true, outputs `rawValue` as-is instead of JSON
- `error(message)`: writes to stderr and exits with code 1

## Module Exports

**Pattern:**
```javascript
module.exports = {
  cmdConfigEnsureSection,
  cmdConfigSet,
  cmdConfigGet,
  // ... other exports
};
```

**Naming:**
- Command handlers: exported as `cmd*` functions
- Utility functions: exported as-is (used by other modules)
- No barrel files; each module exports multiple related functions
- No default exports

## Configuration & Constants

**Environment Variables:**
- Checked with `process.env.VAR_NAME` (e.g., `process.env.CLAUDE_CONFIG_DIR`)
- No `.env` file loading; values passed via environment
- Fallback paths: ~/.gsd/ directory for user-level config

**Config File Pattern:**
- Location: `.planning/config.json`
- Format: plain JSON (no YAML)
- Nested structure using dot notation: `config.workflow.research = true`
- Defaults: hardcoded defaults merged with user config

**Constants:**
- Model profiles: `MODEL_PROFILES` object in `core.cjs`
- Thresholds: UPPER_CASE (e.g., `WARNING_THRESHOLD`, `CRITICAL_THRESHOLD`)
- One-off constants inlined where appropriate

## String Handling

**Template Literals:**
- Backticks for multiline strings
- Template expressions used (e.g., `${variable}`)

**Path Construction:**
- `path.join()` for cross-platform paths
- `path.basename()`, `path.dirname()` for path operations
- Conversion to POSIX: `toPosixPath()` for consistency

## Testing & Verification Patterns

**Verification Helper:**
- `escapeRegex()`: safely escapes regex special chars
- `isGitIgnored()`: checks git ignore rules
- `execGit()`: runs git commands safely
- `safeReadFile()`: reads files without throwing

## Cross-Cutting Concerns

**Logging:**
- No logging framework; uses `console` implicitly (or stderr via `process.stderr.write`)
- Primary output: `process.stdout.write()` for data, `process.stderr.write()` for errors
- Silent failures: used for non-blocking operations (file bridges, cache writes)

**Git Integration:**
- `execGit(cwd, args)`: wrapper for `git` commands with error handling
- Result format: `{ exitCode, stdout, stderr }`
- No git config modifications; only read operations and commits

**File System:**
- All operations synchronous: `fs.readFileSync`, `fs.writeFileSync`, `fs.existsSync`
- Paths normalized using `path.join()` and `path.resolve()`
- Directory creation: `fs.mkdirSync(path, { recursive: true })`

---

*Convention analysis: 2026-03-12*
