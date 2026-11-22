import path from "node:path"
import { pathToFileURL } from "node:url"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import assert from "node:assert/strict"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to an e2e-inc/e2e source checkout")
const root = mkdtempSync(path.join(tmpdir(), "e2e-workspace-manager-repro-"))
try {
  // Bundle upstream source using upstream core helpers, without installing packages.
  const built = await Bun.build({
    entrypoints: [path.join(repository, "packages/e2e/src/internal/package-manager.ts")],
    target: "bun",
    outdir: path.join(root, "bundle"),
    plugins: [{
      name: "upstream-core-source-aliases",
      setup(builder) {
        builder.onResolve({ filter: /^@e2e-dev\/core\/lib\/internal\/(?:globs|options)$/ }, (args) => ({
          path: path.join(repository!, "packages/core/src/internal", path.basename(args.path) + ".ts"),
        }))
      },
    }],
  })
  assert.equal(built.success, true, built.logs.map((log) => String(log)).join("\n"))
  const module = await import(pathToFileURL(built.outputs[0]!.path).href)
  const projectRoot = path.join(root, "project")
  const intermediate = path.join(projectRoot, "packages", "sdk")
  const member = path.join(intermediate, "apps", "client")
  mkdirSync(member, { recursive: true })
  writeFileSync(path.join(projectRoot, "package.json"), JSON.stringify({ packageManager: "pnpm@10.4.1", workspaces: ["packages/**"] }))
  writeFileSync(path.join(intermediate, "package.json"), JSON.stringify({ workspaces: ["plugins/*"] }))
  writeFileSync(path.join(member, "package.json"), JSON.stringify({ name: "test-client" }))
  const actual = module.detectWorkspacePackageManager(member, {})
  console.log("Detected manager:", actual.manager)
  console.log("Detected root:", actual.root)
  assert.deepEqual(actual, { manager: "pnpm", root: projectRoot }, "the nearest matching ancestor workspace must win")
  console.log("Nested workspace selection passes")
} finally {
  rmSync(root, { recursive: true, force: true })
}
