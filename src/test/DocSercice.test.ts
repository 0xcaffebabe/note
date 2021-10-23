import DocService from "../build/DocService"
import fs from 'fs'

main()
async function main(){
  const fileList = DocService.listFilesBySuffix('md', 'doc')
  for(let file of fileList) {
    DocService.getKnowledgeNode(file)
            .then(node => {
              if (node.links?.length != 0) {
                console.log(node)
              }
            })
  }
  
}