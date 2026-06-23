import path from 'path'
import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'

const ensureDirectoryExistence = (filePath: string):void => {
  const dirname = path.dirname(filePath);
  if (nodeFileSystem.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExistence(dirname);
  nodeFileSystem.mkdirSync(dirname);
}

export default {
  ensureDirectoryExistence
}