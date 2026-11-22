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
