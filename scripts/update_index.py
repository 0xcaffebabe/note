from algoliasearch.search_client import SearchClient, SearchConfig
import base,re,os
import hashlib

env = os.environ

config = SearchConfig(env["ALGOLIA_APP_ID"], env["ALGOLIA_API_KEY"])
config.connect_timeout = 120
config.read_timeout = 120
config.write_timeout =  120

client = SearchClient.create_with_config(config)
index = client.init_index(env['ALGOLIA_INDEX_NAME'])

md_files = base.listAllMdFile()
ignore_files = ['算法与数据结构/leetcode/leetcode.md', '中间件/数据库/数据库系统/leetcode.md', 'README.md', 'SUMMARY.md']

def filterSpecialSymbol(str):
    r = '[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]+'
    str = re.sub(r, '', str)
    r1 = "[\u0060|\u0021-\u002c|\u002e-\u002f|\u003a-\u003f|\u2200-\u22ff|\uFB00-\uFFFD|\u2E80-\u33FF]"
    str = re.sub(r1, '', str)
    str = re.sub(' ', '', str)
    str = re.sub('\n', '', str)
    str = re.sub('\t', '', str)
    return str

def txt_process(txt):
  txt = filterSpecialSymbol(txt)
  return txt

def total_amount_update():
  data_list = []
  for file in md_files:
    if file in ignore_files:
      continue
    data_list.append({
      "url": file,
      "objectID": file,
      "txt": txt_process(base.read_text_from_file(file))
    })
  index.save_objects(data_list)
  base.log("全量更新索引完成")

total_amount_update()