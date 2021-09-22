# -*- coding: utf-8 -*
from time import localtime
import base
import datetime
from bs4 import BeautifulSoup
import pydriller

def process():
    html = base.read_text_from_file('_book/index.html')
    soup = BeautifulSoup(html, features='html.parser')
    node_list = soup.select('.markdown-section a[href$=".html"]')
    for i in node_list:
        file_name = i['href'].replace('.html','.md')
        commit_log = reversed(list(pydriller.RepositoryMining(
            "./", filepath=file_name).traverse_commits()))
        # 只取最近10条
        commit_log = list(commit_log)[0:10]
        days = (datetime.datetime.now() - commit_log[0].author_date.replace(tzinfo=None)).days
        readable_time = commit_log[0].author_date.strftime("%Y-%m-%d %H:%M:%S")
        i.append(BeautifulSoup("<span class='page-lastupdate' date-time='%s'>%s天前更新</span>" %
                                   (readable_time, days), features='html.parser'))
        base.log(file_name + " 章节最后更新时间处理完成")
    base.write_text_to_file('_book/index.html', soup.prettify())

process()