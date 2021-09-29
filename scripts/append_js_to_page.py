# -*- coding: utf-8 -*
"""
add js to all html page
"""
import re,sys,base
from bs4 import BeautifulSoup


js_files = ['/scripts/js/page.js']

for html_file in base.list_files_by_suffix('html'):
  html = base.read_text_from_file(html_file)
  soup = BeautifulSoup(html, features='html.parser')
  for i in soup.select("body"):
    for file in js_files:
      i.append(BeautifulSoup("<script src='%s'></script>" % file, features='html.parser'))
  base.write_text_to_file(html_file, soup.prettify())
  base.log("页面 " + html_file + " 添加js成功")

base.log('添加js成功')