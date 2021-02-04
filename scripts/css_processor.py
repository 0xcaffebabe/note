# -*- coding: utf-8 -*
import re,sys,base

css_files=['./styles/website.css', './styles/code-hl-vsc.css', './styles/count.css']

css = ''
for item in css_files:
  css += base.read_text_from_file(item)

css = re.sub("\s*([{};,:])\s*", "\\1", re.sub("/\*.*?\*/", "", re.sub("\s+", " ", css)))

base.write_text_to_file('./styles/website.css', css)

base.log('css预处理成功')