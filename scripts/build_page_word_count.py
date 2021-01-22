# -*- coding: utf-8 -*
from bs4 import BeautifulSoup
import httpx
import os

def get_word_count(file_name):
  html_file = open(file_name, 'rb')
  html = str(html_file.read(), encoding="utf-8")
  html_file.close()
  soup = BeautifulSoup(html, features="html.parser")
  if (len(soup.select('.markdown-section')) == 0): return 0
  text = soup.select('.markdown-section')[0].get_text()
  word_count = len(text)
  return word_count

def travel_html_file(path):
  result = []
  for item in os.listdir(path):
      if not path.startswith('./'):
          item = path + "/" + item
      if os.path.isdir(item):
          result.extend(travel_html_file(item))
      if item.endswith('.html'):
          result.append(item)
  return result

def write_count_to_html(html_file, count):
  result_file = open(html_file, 'rb')
  html = str(result_file.read(), encoding="utf-8")
  result_file.close()
  soup = BeautifulSoup(html, features="html.parser")
  if (len(soup.select('.markdown-section .page-footer')) == 0): 
    print(item + "跳过")
    return
  soup.select('.markdown-section .page-footer')[0].append(BeautifulSoup('<span class="footer-wordcount"> 总字数:%s</span>'%(count),'html.parser'))
  html = soup.prettify()
  result_file = open(html_file, 'w')
  result_file.write(html)
  result_file.close()

html_list = travel_html_file('./')
for item in html_list:
  write_count_to_html(item, get_word_count(item))
  print(item + '字数统计完成')