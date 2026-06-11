import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { Argv } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"

type AssetFile = {
  sourceDir: string
  file: FilePath
}

const filesToCopy = async (argv: Argv, cfg: QuartzConfig): Promise<AssetFile[]> => {
  // glob all non MD files in content folder and copy it over
  const contentFiles = await glob("**", argv.directory, [
    "**/*.md",
    ...cfg.configuration.ignorePatterns,
  ])

  const attachmentDir = path.resolve(argv.directory, "..", "attachments") as FilePath
  const attachmentFiles = fs.existsSync(attachmentDir)
    ? await glob("**", attachmentDir, ["**/*.md"])
    : []

  return [
    ...contentFiles.map((file) => ({ sourceDir: argv.directory, file })),
    ...attachmentFiles.map((file) => ({ sourceDir: attachmentDir, file })),
  ]
}

const copyFile = async (argv: Argv, sourceDir: string, fp: FilePath) => {
  const src = joinSegments(sourceDir, fp) as FilePath

  const name = slugifyFilePath(fp)
  const dest = joinSegments(argv.output, name) as FilePath

  // ensure dir exists
  const dir = path.dirname(dest) as FilePath
  await fs.promises.mkdir(dir, { recursive: true })

  await fs.promises.copyFile(src, dest)
  return dest
}

export const Assets: QuartzEmitterPlugin = () => {
  return {
    name: "Assets",
    async *emit({ argv, cfg }) {
      const fps = await filesToCopy(argv, cfg)
      for (const { sourceDir, file } of fps) {
        yield copyFile(argv, sourceDir, file)
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      for (const changeEvent of changeEvents) {
        const ext = path.extname(changeEvent.path)
        if (ext === ".md") continue

        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield copyFile(ctx.argv, ctx.argv.directory, changeEvent.path as FilePath)
        } else if (changeEvent.type === "delete") {
          const name = slugifyFilePath(changeEvent.path)
          const dest = joinSegments(ctx.argv.output, name) as FilePath
          await fs.promises.unlink(dest)
        }
      }
    },
  }
}
