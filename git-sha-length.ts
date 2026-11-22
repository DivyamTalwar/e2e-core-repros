import path from "node:path"
import { pathToFileURL } from "node:url"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import assert from "node:assert/strict"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to an e2e-inc/e2e source checkout")
const git = await import(pathToFileURL(path.resolve(repository, "packages/e2e/src/internal/git.ts")).href)
const { detectVcs } = await import(pathToFileURL(path.resolve(repository, "packages/e2e/src/internal/vcs.ts")).href)
for (const n of [40, 64]) assert.equal(git.COMMIT_HASH.test("a".repeat(n)), true)
for (const n of [39, 41, 60, 63, 65]) {
  const found = git.COMMIT_HASH.test("a".repeat(n))
  console.log(`Commit hash ${n} hex digits:`, found ? "accepted" : "rejected")
  assert.equal(found, false, `Git has full-length SHA-1 (40) or SHA-256 (64) commit IDs only; ${n} is invalid`)
}
const outside = mkdtempSync(path.join(tmpdir(), "e2e-vcs-sha-length-"))
try {
  const fake = await detectVcs(outside, { GITHUB_SHA: "a".repeat(41) })
  assert.equal(fake, undefined, "invalid CI commit hashes must not be reported as source provenance")
} finally {
  rmSync(outside, { recursive: true, force: true })
}
console.log("Full Git commit identity validation passed")
