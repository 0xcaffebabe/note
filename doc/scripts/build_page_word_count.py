# -*- coding: utf-8 -*
import bs4
import base
from bs4 import BeautifulSoup
import os


def get_word_count(file_name):
    html_file = open(file_name, 'rb')
    html = str(html_file.read(), encoding="utf-8")
    html_file.close()
    soup = BeautifulSoup(html, features="html.parser")
    if (len(soup.select('.markdown-section')) == 0):
        return 0
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
        base.log("字数统计构建 " + item + "跳过")
        return
    soup.select('.markdown-section .page-footer')[0]\
        .append(BeautifulSoup('<span class="footer-wordcount"> 本页字数: \
      <span style="color: #ccc">%s</span> 字</span>' % (count), 'html.parser'))
    html = soup.prettify()
    result_file = open(html_file, 'w')
    result_file.write(html)
    result_file.close()


def agg_home_count(count_map):
    html = base.read_text_from_file('_book/index.html')
    soup = bs4.BeautifulSoup(html, features='html.parser')
    node_list = soup.select('.markdown-section a[href$=".html"]')
    for i in node_list:
        i.append(bs4.BeautifulSoup("<span class='chapter-wordcount'>{:,} 字</span>".format(count_map['_book/' + i['href']]), features='html.parser'))
    base.write_text_to_file('_book/index.html', soup.prettify())


html_list = travel_html_file('./')
count_map = {}
for item in html_list:
    count = get_word_count(item)
    write_count_to_html(item, count)
    count_map[item] = count
    base.log("字数统计构建 "+ item + '字数统计完成')
base.log(" 字数统计构建 首页字数聚合")

agg_home_count(count_map)
