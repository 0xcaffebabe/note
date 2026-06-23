import { ResolvedConfig } from "vite";

export default function BuildTimeGenerator(){
  let config : ResolvedConfig;
  return {
    name: "build-time-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    transformIndexHtml(html: String) {
      return html.replace(`/*build-time*/const buildTime = "" /*build-time*/`, `const buildTime = '${new Date().toISOString()}'`)
    }
  }
}