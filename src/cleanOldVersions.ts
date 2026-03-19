import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

export interface CleanOldVersionsOptions {
  outDir?: string
  days?: number
  now?: number
}

export function cleanOldVersions(options: CleanOldVersionsOptions): Plugin {
  const { outDir = 'dist-prod', days = 2, now } = options

  return {
    name: 'clean-old-versions',
    apply: 'build',
    closeBundle() {
      if (process.env.NODE_ENV !== 'production') {
        return
      }

      try {
        const outDirPath = path.resolve(process.cwd(), outDir)

        if (!fs.existsSync(outDirPath)) {
          console.error(`[clean-old-versions] 目录不存在: ${outDirPath}`)
          return
        }

        const currentTime = now || Date.now()
        const msPerDay = 24 * 60 * 60 * 1000
        const threshold = currentTime - days * msPerDay

        const entries = fs.readdirSync(outDirPath, { withFileTypes: true })

        const oldVersions: { dirPath: string; timestamp: number; entryName: string }[] = []

        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          if (entry.name === 'index.html') continue

          const timestamp = Number(entry.name)
          if (isNaN(timestamp)) continue

          if (timestamp < threshold) {
            oldVersions.push({
              dirPath: path.join(outDirPath, entry.name),
              timestamp,
              entryName: entry.name,
            })
          }
        }

        let deletedCount = 0

        oldVersions.forEach(item => {
          const { dirPath, entryName } = item

          if (oldVersions.length - deletedCount <= 1) {
            console.log(`[clean-old-versions] 触发最少保留超过1天的一个旧历史: ${entryName}`)
            return
          }

          fs.rmSync(dirPath, { recursive: true, force: true })
          console.log(`[clean-old-versions] 已删除: ${entryName}`)
          deletedCount++
        })

        console.log(`[clean-old-versions] ✅ 清理完成，删除 ${deletedCount} 个目录`)
      } catch (err: any) {
        console.error('[clean-old-versions] 操作失败:', err.message)
      }
    },
  }
}
