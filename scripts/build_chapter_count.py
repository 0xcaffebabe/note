# -*- coding: utf-8 -*
"""
构建左侧章节栏子节点数量脚本
"""
from bs4 import BeautifulSoup
import httpx,base

class ChapterNode:
    def __init__(self):
        self.name = ""
        self.data_level = ""
        self.children = []

    def size(self):
        size = len(self.children)
        for i in self.children:
            size = size + i.size()
        return size


def process(nodes):
    result = []
    for node in nodes:
        n = ChapterNode()
        n.data_level = node['data-level']
        if (node.a is None):
            continue
        n.name = node.a.contents[0].strip()
        n.children = process(node.select(".articles > li[data-level]"))
        result.append(n)
    return result


def print_chapter_tree(chapters, level):
    for chapter in chapters:
        size = chapter.size()
        if size > 0:
            print("--" * level + chapter.name + ", size:" + str(size))
        else:
            print("--" * level + chapter.name)
        print_chapter_tree(chapter.children, level + 1)

count_css = """
    li[data-path] a::after {
      background-color: #3e90e8;
      border-radius: 10px;
      color: #fff;
      display: inline-block;
      font-size: 12px;
      height: 14px;
      line-height: 14px;
      padding: 0 6px;
      text-align: center;
      white-space: nowrap;
      border: 1px solid #fff;
      top: 0;
      vertical-align:super;
    }
    """

def build_chapter_count_css(chapters, level):
  global count_css
  for chapter in chapters:
      size = chapter.size()
      if size > 1:
          count_css += 'li[data-level="%s"] > a::after{content:"%s"}' % (
              chapter.data_level, str(size - 1))
      text = build_chapter_count_css(chapter.children, level + 1)
      if (text is not None):
        count_css += text 


def write_count_css(css):
    base.write_text_to_file("./_book/styles/count.css", css)


def main():
    html_file = open("./_book/index.html", 'rb')
    html = str(html_file.read(), encoding="utf-8")
    html_file.close()
    soup = BeautifulSoup(html, features="html.parser")
    chapter_list = process(soup.select(".summary > li[data-level]"))
    print_chapter_tree(chapter_list, 0)
    build_chapter_count_css(chapter_list, 0)
    write_count_css(count_css)


main()
