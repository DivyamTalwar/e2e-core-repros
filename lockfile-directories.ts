import path from "node:path"
import { pathToFileURL } from "node:url"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import assert from "node:assert/strict"

const repository = process.env.E2E_REPO
if (!repository) throw new Error("Set E2E_REPO to an e2e-inc/e2e source checkout")
const root = mkdtempSync(path.join(tmpdir(), "e2e-lockfile-directory-"))
try {
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
  assert.equal(built.success, true, built.logs.map(String).join("\n"))
  const module = await import(pathToFileURL(built.outputs[0]!.path).href)
  const project = path.join(root, "project")
  mkdirSync(project)
  mkdirSync(path.join(project, "pnpm-lock.yaml")) // directory, not a lockfile
  writeFileSync(path.join(project, "package-lock.json"), "{}") // only real lockfile
  const manager = module.detectPackageManager(project, undefined, {})
  console.log("manager with pnpm-lock.yaml directory and npm file:", manager)
  assert.equal(manager, "npm")
  console.log("Lockfile type check passed")
} finally {
  rmSync(root, { recursive: true, force: true })
}
