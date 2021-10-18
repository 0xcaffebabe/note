from algoliasearch.search_client import SearchClient, SearchConfig
import base,re,sys,markdown,json
from bs4 import BeautifulSoup

args = sys.argv

app_id = args[1]
api_key = args[2]
index_name = args[3]
mode = args[4]

config = SearchConfig(app_id, api_key)
config.connect_timeout = 120
config.read_timeout = 120
config.write_timeout =  120

client = SearchClient.create_with_config(config)
index = client.init_index(index_name)

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

def markdown_2_text(text):
  html = markdown.markdown(text)
  text = BeautifulSoup(html, features="html.parser").text
  # text = re.sub('\n', '', text)
  text = re.sub('\t', '', text)
  return "\n".join(list(filter(lambda v : not '```' in v, text.split('\n'))))

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
      "txt": markdown_2_text(base.read_text_from_file(file))
    })
  index.replace_all_objects(data_list)
  base.log("全量更新索引完成")

def list_all_index():
  return index.get_objects(base.listAllMdFile())

def list_all_index_map():
  data = list_all_index()
  index_map = {}
  for item in data['results']:
    if item is None:
      continue
    index_map[item['objectID']] = item['txt']
  return index_map

def increment_update():
  data_list = []
  for file in md_files:
    if file in ignore_files:
      continue
    data_list.append({
      "url": file,
      "objectID": file,
      "txt": markdown_2_text(base.read_text_from_file(file))
    })
  index_map = list_all_index_map()
  skip_num = 0
  for item in data_list:
    mapping = index_map[item['objectID']]
    if (mapping == item['txt']):
      base.log("增量索引更新 %s 跳过" % item['objectID'])
      skip_num += 1
    else:
      index.save_object(item)
  base.log("增量索引更新 原 %s 现 %s 不更新数 %s"%(len(index_map), len(data_list), skip_num))

if mode == 'total':
  total_amount_update()
if mode == 'increment':
  increment_update()
