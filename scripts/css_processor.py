# -*- coding: utf-8 -*
import re,sys,base

css_files=['./_book/styles/website.css', './_book/styles/code-hl-vsc.css', './_book/styles/count.css']

css = ''
for item in css_files:
  css += base.read_text_from_file(item)

css = re.sub("\s*([{};,:])\s*", "\\1", re.sub("/\*.*?\*/", "", re.sub("\s+", " ", css)))

base.write_text_to_file('./_book/styles/website.css', css)

base.log('css预处理成功')