import DocService from "@/build/DocService";

async function main() {
  const st = new Date().getTime()
  const data = await DocService.generateDocQualityData()
  console.log(data)
  console.log(new Date().getTime() - st)
}
main()