import type { Plugin, ResolvedConfig } from "vite"
import fs from "fs";
import apiMappings from "./ApiMappings";

export default function DataGenerator(): Plugin {
  let config : ResolvedConfig;
  return {
    name: "data-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart() {
      fs.mkdirSync(config.build.outDir, { recursive: true })
      // 构建必须等 JSON 全部落盘；生成失败时阻止发布缺少聚类等数据的站点。
      const results = await Promise.allSettled(apiMappings.filter(api => api.type?.includes("build")).map(async api => {
        const st = new Date().getTime()
        console.log(`${api.name}构建开始`)
        try {
          const data = await api.method()
          fs.writeFileSync(config.build.outDir + api.path, JSON.stringify(data))
          console.log(`${api.name}构建结束, 耗时: ${new Date().getTime() - st}ms`)
        } catch (err) {
          throw new Error(`${api.name}构建异常 (${api.path}): ${err}`, { cause: err })
        }
      }))
      const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : [])
      if (errors.length) {
        throw new AggregateError(errors, errors.map(err => err.message).join('\n'))
      }
    }
  }
}
