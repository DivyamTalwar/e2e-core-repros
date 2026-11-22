import path from "node:path"
import { pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to a checkout of e2e-inc/e2e")
const module = path.resolve(repository, "packages/core/src/internal/ids.ts")
const { canonicalJson, canonicalDigest } = await import(pathToFileURL(module).href)

const empty = canonicalJson([])
const sparse = canonicalJson(new Array(1))
const explicitNull = canonicalJson([null])
console.log({ empty, sparse, explicitNull })
assert.equal(sparse, explicitNull, "an array hole must canonicalize like undefined/null")
assert.notEqual(sparse, empty, "different JSON values must not produce the same canonical bytes")
assert.notEqual(canonicalDigest(new Array(1)), canonicalDigest([]), "different arrays must not hash alike")
console.log("Canonical serialization of sparse arrays is collision-free")
