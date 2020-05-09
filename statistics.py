import os
import jieba
def listAllFile(path):
  result = []
  for item in os.listdir(path):
    if not path.startswith('./'):
      item = path + "/" + item
    if os.path.isdir(item) :
      result.extend(listAllFile(item))
    else:
      result.append(item)
  return result

def listAllMdFile():
  files = listAllFile("./")
  result = []
  for item in files:
    if (item.endswith(".md")):
      result.append(item)
  return result

def noteLineCount():
  files = listAllMdFile()
  count = 0
  for item in files:
    file = open(item,'rb')
    count = count + len(file.readlines())
  print("笔记行数:",count)

def noteWorldFrequency():
  files = listAllMdFile()
  map = {}
  for item in files:
    file = open(item,'rb')
    seg_list = jieba.cut_for_search(str(file.read(),encoding="utf-8"))  # 默认是精确模式
    for j in seg_list:
      if map.get(j) == None:
        map[j]=1
      else:
        map[j]=map[j]+1
  map=sorted(map.items(),key=lambda item:item[1],reverse=True)
  count=0
  for i,j in map:
    if count >=100:
      break
    print(i,j)
    count = count+1

noteWorldFrequency()