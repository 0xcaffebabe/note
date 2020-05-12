import os
import jieba
import re
from wordcloud import WordCloud

import time
from PIL import Image, ImageFont, ImageDraw
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
    text = str(file.read(),encoding="utf-8")
    text = filterSpecialSymbol(text)
    seg_list = jieba.cut_for_search(text.strip())  # 默认是精确模式
    for j in seg_list:
      if j == '' :
        continue
      if isStopWord(j):
        continue
      if map.get(j) == None:
        map[j]=1
      else:
        map[j]=map[j]+1
  map=sorted(map.items(),key=lambda item:item[1],reverse=True)
  return map

def filterSpecialSymbol(str):
  r = '[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]+'
  str = re.sub(r,'',str)
  r1 = "[\u0060|\u0021-\u002c|\u002e-\u002f|\u003a-\u003f|\u2200-\u22ff|\uFB00-\uFFFD|\u2E80-\u33FF]"
  str = re.sub(r1,'',str)
  str = re.sub(' ','',str)
  str = re.sub('\n','',str)
  str = re.sub('\t','',str)
  return str
def isStopWord(str):
  if len(str) <= 1:
    return True
  stopWords = ['的','是','在','一个','和','与']
  for item in stopWords:
    if item == str:
      return True
  return False
def generateWordCloud():
  list = noteWorldFrequency()
  #设置词云
  wc = WordCloud(background_color = "white", #设置背景颜色
               #mask = "图片",  #设置背景图片
               max_words = 200000, #设置最大显示的字数
               #stopwords = "", #设置停用词
               font_path = "font.ttf",
               width=1000, height=500, margin=2,
        #设置中文字体，使得词云可以显示（词云默认字体是“DroidSansMono.ttf字体库”，不支持中文）
               max_font_size = 120,  #设置字体最大值
               relative_scaling=.8,
               prefer_horizontal=90,
               random_state = 100, #设置有多少种随机生成状态，即有多少种配色方案
    )
  text = ''
  total = 0
  count=0
  map = {}
  for i,j in list:
    total = total+j
  for i,j in list:
    count = count + 1
    if count == 1:
      continue
    map[i]=j/total*1000.0
  myword = wc.generate_from_frequencies(map)#生成词云
  myword.to_file('./wordcloud.png')
  print(type(myword))

def statisticNote():
  text = ''
  totalLineCount = 0
  for item in listAllMdFile():
    file = open(item,'rb')
    text = text + str(file.read(),encoding="utf-8") + '\n'
    file.close()
  totalLineCount = len(text.split('\n'))
  return totalLineCount

def generateNoteInfo():
  totalLineCount = statisticNote()
  localtime = time.asctime( time.localtime(time.time()) )
  text = u"生成时间:" + localtime + "\n" + '笔记总行数:' + str(totalLineCount)
  im = Image.new("RGB", (300, 50), (255, 255, 255))
  dr = ImageDraw.Draw(im)
  font = ImageFont.truetype('font.ttf', 14)
  dr.text((10, 5), text, font=font, fill="#000000")
  im.save('info.png')

generateWordCloud()
generateNoteInfo()