import path from "node:path"
import { pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to an e2e-inc/e2e source checkout")
const urls = await import(pathToFileURL(path.resolve(repository, "packages/core/src/internal/urls.ts")).href)
for (const host of ["localhost.", "api.localhost."]) {
  console.log("loopback:", host, urls.isLoopbackHost(host))
  assert.equal(urls.isLoopbackHost(host), true, `${host} is a canonical localhost domain ending at the DNS root`)
  assert.equal(urls.normalizeBaseUrl(`${host}:3000`).origin, `http://${host}:3000`)
  assert.equal(urls.normalizeBaseUrl(`http://${host}:3000`).origin, `http://${host}:3000`)
}
assert.equal(urls.isImplicitTestHost("api.test."), true)
assert.equal(urls.isLoopbackHost("example.org."), false)
console.log("Root-terminated localhost/test host checks passed")
