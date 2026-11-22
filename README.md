# E2E core minimal regressions

Small standalone reproducers for source-level bugs found while contributing to [e2e-inc/e2e](https://github.com/e2e-inc/e2e). Each script imports the **real upstream source**, not a copied implementation; it needs only [Bun](https://bun.sh) and a checkout of the public repository.

## Reproduce sparse-array canonical-JSON hash collision

```sh
git clone --depth 1 https://github.com/e2e-inc/e2e.git /tmp/e2e-repro-source
E2E_REPO=/tmp/e2e-repro-source bun canonical-sparse.ts
```

**Before the fix:** `canonicalJson([]) === canonicalJson(new Array(1)) === '[]'`, even though JSON serializes the sparse array as `[null]`, so `canonicalDigest` hashes two different values identically. The standalone assertion exits nonzero.

**Expected:** a sparse array serializes as `[null]`, like an explicit null or undefined array entry, and has a distinct digest from `[]`.

## Reproduce missing source locations under parentheses/colon paths

```sh
E2E_REPO=/tmp/e2e-repro-source bun source-frames-paths.ts
```

`sourceLocation()` parses JavaScript stack frames, but its file-path regexp excludes `)` and `:`. A project in a POSIX directory named `suite (legacy)` or `test:fixtures` loses the test's actual file/line location in failures and step reports. The script imports the real upstream parser and expects `tests/checkout.e2e.ts:12:7` for both valid paths. **Before the fix:** returns `undefined`; **expected:** returns the source location.

## Reproduce package manager selection stopping at unrelated nested workspace

```sh
E2E_REPO=/tmp/e2e-repro-source bun nested-workspace-manager.ts
```

The source-backed script uses `Bun.build()` to resolve two `@e2e-dev/core` internal imports to the **actual** upstream TypeScript files, so no E2E dependency installation or code copying is necessary. An outer pnpm monorepo includes `packages/**`; an intermediate package declares an unrelated inner workspace (`plugins/*`) that does *not* include the target `apps/client`. The detector stops at the unrelated inner workspace instead of continuing to the outer matching one, and incorrectly recommends `npm` at the nested package. **Expected:** `{ manager: "pnpm", root: outerProject }`.
