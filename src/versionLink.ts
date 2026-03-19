import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

export interface VersionLinkOptions {
  versionDir: string
  outDir?: string
}

export function versionLink(options: VersionLinkOptions): Plugin {
  const { versionDir, outDir = 'dist-prod' } = options

  if (!versionDir) {
    throw new Error('[version-link] versionDir is required')
  }

  return {
    name: 'version-link',
    apply: 'build',
    closeBundle() {
      try {
        const outDirPath = path.resolve(process.cwd(), outDir)
        const versionPath = path.join(outDirPath, versionDir, 'index.html')
        const copyPath = path.join(outDirPath, 'index.html')

        if (!fs.existsSync(versionPath)) {
          console.error(`[version-link] 文件不存在: ${versionPath}`)
          return
        }

        fs.copyFileSync(versionPath, copyPath)
        console.log(`[version-link] ✅ 复制成功: ${versionDir}/index.html -> index.html`)
      } catch (err: any) {
        console.error('[version-link] 操作失败:', err.message)
      }
    },
  }
}
