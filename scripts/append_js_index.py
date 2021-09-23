# -*- coding: utf-8 -*
"""
js 处理脚本
"""
import re,sys,base
from bs4 import BeautifulSoup

html = base.read_text_from_file("./_book/index.html")
soup = BeautifulSoup(html, features='html.parser')

js_files = ['scripts/js/main.js']

for i in soup.select("body"):
  for file in js_files:
    i.append(BeautifulSoup("<script src='%s'></script>" % file, features='html.parser'))
base.write_text_to_file('./_book/index.html', soup.prettify())

base.log('添加js成功')