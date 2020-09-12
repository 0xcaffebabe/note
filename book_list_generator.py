import os
def getUnreadBook():
  return getBook('d:/学习/ebook/')

def getReadedBook():
  return getBook('d:/学习/ebook/已读/')

def getBook(path):
  result = set()
  for item in os.listdir(path):
    if '.' in item :
      item = removeBookSuffix(item)
      result.add(item)
  return result

def removeBookSuffix(name):
  i = name.rindex('.')
  return name[0:i]

def readTemplate():
  templateFile = open('./书单.md', 'r',encoding='utf8')
  result = templateFile.read()
  templateFile.close()
  return result

def renderTemplate(template, readedBook, unReadBook):
  i = -1

  try:
    i = template.index('## 未分类')
  except:
    print ('获取模板分隔符 "## 未分类" 下标失败')
    return
  i = i + len('## 未分类\n\n')
  template = generateUnCategorizedBook(template[0:i], unReadBook)
  return processReadedBook(template, readedBook)

def generateUnCategorizedBook(template, unReadBook):
  for item in unReadBook:
    if item not in template: # 跳过已经在书单中存在的书
      template += '- ' + item + '\n'
  return template

def processReadedBook(template, readedBook):
  for item in readedBook:
    template = template.replace('- ' + item, '- ~~' + item + '~~')
  return template

def generateBookList():
  template = readTemplate()
  readedBook = getReadedBook()
  unreadBook = getUnreadBook()
  result = renderTemplate(template, readedBook, unreadBook)
  bookListFile = open('./书单.md','w', encoding='utf8')
  bookListFile.write(result)
  bookListFile.close()
  print ('书单生成完毕!')

generateBookList()