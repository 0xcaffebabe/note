# -*- coding: utf-8 -*
import os
from bs4 import BeautifulSoup
import datetime,time
def listAllFile(path):
    if path.startswith(".git"): return []
    if path.startswith("node_modules"): return []
    result = []
    for item in os.listdir(path):
        if not path.startswith('./'):
            item = path + "/" + item
        if os.path.isdir(item):
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

# 将制定html的css选择器元素里的内容替换为content 并返回更新后的html
def replace_html_node(html, selector, content):
  soup = BeautifulSoup(html, features="html.parser")
  if (len(soup.select(selector)) == 0):
    print('soup select is 0')
    return ""
  soup.select(selector)[0].replaceWith(BeautifulSoup(content, features="html.parser"))
  return soup.prettify()

def write_text_to_file(file_name, text):
  try:
    result_file = open(file_name, 'w')
    result_file.write(text)
    result_file.close()
  except:
    print("写入文件 " + file_name + " 发生异常")

def read_text_from_file(file_name):
  try:
    html_file = open(file_name, 'rb')
    html = str(html_file.read(), encoding="utf-8")
    html_file.close()
    return html
  except:
    print("读取文件 " + file_name + " 发生异常")
    return "" 

def current_time():
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

def log(content):
  t = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
  print('[log]:%s---%s'%(t, str(content)))
