import assert from "node:assert/strict"
import path from "node:path"
import { pathToFileURL } from "node:url"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to the e2e-inc/e2e source checkout")
const { unsupportedRuntimeMessage, SUPPORTED_NODE_RANGE, SUPPORTED_BUN_RANGE } =
  await import(pathToFileURL(path.resolve(repository, "packages/e2e/src/internal/runtime.ts")).href)

assert.equal(SUPPORTED_NODE_RANGE, "^22.22.3 || >=24.8.0")
assert.equal(SUPPORTED_BUN_RANGE, ">=1.4.3")
for (const node of ["24.8.0-rc.1", "22.22.3-rc.1", "24.8.0garbage", "24.8.x", "v24.8.0-rc.1"]) {
  const result = unsupportedRuntimeMessage({ node })
  console.log(`Node ${node}:`, result === undefined ? "ACCEPTED (BUG)" : "rejected")
  assert.notEqual(result, undefined, `Node ${node} does not meet the published stable engine range`)
}
for (const bun of ["1.4.3-canary.1", "1.4.3garbage", "1.4.x"]) {
  const result = unsupportedRuntimeMessage({ node: "26.4.0", bun })
  console.log(`Bun ${bun}:`, result === undefined ? "ACCEPTED (BUG)" : "rejected")
  assert.notEqual(result, undefined, `Bun ${bun} is not a stable numeric version meeting the advertised floor`)
}
for (const node of ["22.22.3", "24.8.0", "v24.8.0", "26.4.0"]) {
  assert.equal(unsupportedRuntimeMessage({ node }), undefined)
}
assert.equal(unsupportedRuntimeMessage({ node: "26.4.0", bun: "1.4.3" }), undefined)
console.log("Runtime version gate matches the supported release versions")
