import DocService from "../build/DocService";

async function main() {
  console.log(await DocService.getDocCluster())
}
main()