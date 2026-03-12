# Testing Patterns

**Analysis Date:** 2026-03-12

## Testing Status

**Framework:**
- No test framework detected
- No test configuration files (`jest.config.js`, `vitest.config.js`, `mocha.opts`, etc.)
- No test files present (no `.test.js`, `.spec.js`, `.test.cjs`, `.spec.cjs` files)
- No test commands in package.json

**Current State:**
- **No automated testing** — codebase relies on manual verification and integration testing
- **Code quality assurance:** Manual review, linting rules enforced implicitly through conventions

## Testing Approach (Current)

**Verification & Validation:**
- Explicit verification module: `/root/visualizer/.claude/get-shit-done/bin/lib/verify.cjs`
  - Command handlers: `cmdVerifySummary()`, `cmdVerifyFiles()`, `cmdVerifyCommits()`
  - Verifies output of phases (e.g., checking that files mentioned in summaries actually exist)
  - Validates git commits by checking commit hash existence with `git cat-file`
  - Checks self-check sections in SUMMARY.md files

**Pattern Validation:**
- `extractFrontmatter()` in `/root/visualizer/.claude/get-shit-done/bin/lib/frontmatter.cjs` parses and validates YAML structure
- Error detection: malformed YAML caught in try-catch blocks
- Regex-based validation: patterns used to extract fields from markdown (e.g., field extraction in `stateExtractField()`)

**Runtime Checks:**
- File existence checks: `fs.existsSync()`
- Git integration checks: `execGit()` wraps commands and returns `{ exitCode, stdout, stderr }`
- Config validation: `loadConfig()` merges provided config with hardcoded defaults; missing keys fall back to defaults
- Guard clauses: early returns on invalid inputs (e.g., `if (!summaryPath) error('summary-path required')`)

## Test File Organization

**Not Applicable:**
- No test files exist
- No testing directory structure
- No test fixtures or factories

## If Testing Were to Be Added

**Recommended Structure:**
```
/root/visualizer/.claude/get-shit-done/bin/__tests__/
├── lib/
│   ├── core.test.cjs
│   ├── state.test.cjs
│   ├── config.test.cjs
│   ├── phase.test.cjs
│   ├── frontmatter.test.cjs
│   └── verify.test.cjs
└── integration/
    ├── end-to-end.test.cjs
    └── git-operations.test.cjs
```

**Suggested Framework:**
- **Jest** (recommended for Node.js projects, CommonJS compatible)
- **Vitest** (modern alternative, ESM/CommonJS hybrid)
- **Mocha + Chai** (if minimal dependencies preferred)

## Mocking Strategy (Not Currently Implemented)

**What Would Require Mocking:**
- File system operations (`fs` module)
- Git commands (`execSync` in `execGit()`)
- Environment variables
- Process operations (exit codes, stdin/stdout)

**Patterns to Mock:**
- `fs.readFileSync()` / `fs.writeFileSync()`: mock file contents
- `fs.existsSync()`: mock file/directory existence
- `execSync()` from `child_process`: mock git command outputs
- `process.env`: mock environment variables
- `process.stdin` / `process.stdout`: mock I/O for hook scripts

**Example Mock Pattern (if implemented):**
```javascript
jest.mock('fs');
jest.mock('child_process', () => ({
  execSync: jest.fn(() => '0.1.0'),
  spawn: jest.fn(() => ({
    unref: jest.fn(),
    stdio: 'ignore'
  }))
}));
```

## Test Coverage Gaps (Current Risk Areas)

**High Priority (Fragile, Frequently Used):**

1. **Frontmatter Parser:** `extractFrontmatter()` in `/root/visualizer/.claude/get-shit-done/bin/lib/frontmatter.cjs`
   - Complex YAML parsing logic (lines 11-84)
   - Nested object/array handling
   - Missing tests for edge cases: malformed YAML, deep nesting, special characters
   - Risk: incorrect parsing corrupts planning documents

2. **Phase Navigation:** `findPhaseInternal()`, `comparePhaseNum()` in `/root/visualizer/.claude/get-shit-done/bin/lib/core.cjs`
   - Numeric/decimal phase comparison logic
   - Complex regex patterns for matching phases
   - Missing tests for edge cases: phase names with letters (e.g., "1a", "2.1.b")
   - Risk: phase lookups fail silently or return wrong phase

3. **Config Merging:** `loadConfig()` in `/root/visualizer/.claude/get-shit-done/bin/lib/core.cjs`
   - Nested object merging (user defaults override hardcoded defaults)
   - Deprecation migration logic (depth → granularity)
   - Missing tests for config structure changes
   - Risk: configuration inconsistencies between versions

4. **Git Operations:** `execGit()` in `/root/visualizer/.claude/get-shit-done/bin/lib/core.cjs`
   - All git commands wrapped here
   - Escape/quoting logic for shell safety
   - Missing tests for special characters in filenames
   - Risk: git commands fail on certain paths

**Medium Priority (Important, Less Frequently Used):**

5. **Verification Logic:** `cmdVerifySummary()` in `/root/visualizer/.claude/get-shit-done/bin/lib/verify.cjs`
   - File existence checking
   - Git commit hash validation
   - Self-check section parsing
   - Missing tests for various summary formats
   - Risk: false positives/negatives on verification

6. **Path Normalization:** `toPosixPath()` in `/root/visualizer/.claude/get-shit-done/bin/lib/core.cjs`
   - Cross-platform path handling
   - Missing tests on Windows vs. Unix paths
   - Risk: platform-specific failures

**Low Priority (Error Handling, Rare Cases):**

7. **Error Recovery:** Silent catch blocks throughout
   - Many operations fail silently (e.g., `catch (e) {}`)
   - Missing error logging
   - Risk: bugs hidden by silence

## Current Validation Points

**Observed Manual Testing Approach:**
- Command-line tools expect JSON output that can be parsed by downstream tools
- File system changes validated by checking file existence post-operation
- Git history validated by checking commit hashes exist
- Config validation: defaults used when values missing

**Example from `verify.cjs`:**
```javascript
// Check 2: Spot-check files mentioned in summary
const mentionedFiles = new Set();
const patterns = [
  /`([^`]+\.[a-zA-Z]+)`/g,
  /(?:Created|Modified|Added|Updated|Edited):\s*`?([^\s`]+\.[a-zA-Z]+)`?/gi,
];

for (const pattern of patterns) {
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const filePath = m[1];
    if (filePath && !filePath.startsWith('http') && filePath.includes('/')) {
      mentionedFiles.add(filePath);
    }
  }
}

// Then check each file exists
const missing = [];
for (const file of filesToCheck) {
  if (!fs.existsSync(path.join(cwd, file))) {
    missing.push(file);
  }
}
```

## Recommended Testing Strategy

**Phase 1: Unit Tests (High-Impact Core Functions)**
- `extractFrontmatter()` parsing with various YAML structures
- `comparePhaseNum()` with all phase naming formats
- `loadConfig()` with different config override scenarios
- `escapeRegex()` with special characters

**Phase 2: Integration Tests (Command-Level)**
- Each `cmd*` function with mocked file system
- Config loading and merging workflows
- Phase lookup and iteration workflows
- Frontmatter modifications

**Phase 3: End-to-End Tests**
- Full verify workflow on sample summaries
- Git integration with mocked commands
- Hook script execution (gsd-*.js files)

---

*Testing analysis: 2026-03-12*
