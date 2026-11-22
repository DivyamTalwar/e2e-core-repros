import path from "node:path"
import { pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to an e2e-inc/e2e source checkout")
const { sourceLocation } = await import(pathToFileURL(path.resolve(repository, "packages/core/src/internal/source.ts")).href)

for (const directory of ["suite (legacy)", "test:fixtures"]) {
  const root = `/tmp/e2e-source-example/${directory}`
  const stack = `Error: failure\n    at run (${root}/tests/checkout.e2e.ts:12:7)`
  const actual = sourceLocation(stack, root)
  console.log(directory, actual)
  assert.deepEqual(actual, { file: "tests/checkout.e2e.ts", line: 12, column: 7 })
}
console.log("Both parenthesized and colon-containing source paths resolve correctly")
