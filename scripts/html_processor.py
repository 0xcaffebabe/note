# -*- coding: utf-8 -*
import htmlmin
import base

html_files = filter(lambda x: x.endswith(".html"), base.listAllFile('./'))

for item in html_files:
    html = base.read_text_from_file(item)
    html = htmlmin.minify(html)
    base.write_text_to_file(item, html)
    base.log("html处理 " + item + " 压缩完成")
