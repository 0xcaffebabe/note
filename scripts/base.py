# -*- coding: utf-8 -*
"""
通用工具类
"""
from logging import error
import os
from bs4 import BeautifulSoup
import datetime
import time

from soupsieve.util import upper


def list_all_files(path):
    ignore_prefixs = ['.git', "node_modules"]
    for item in ignore_prefixs:
        if path.startswith(item):
            return []
    result = []
    for item in os.listdir(path):
        if not path.startswith('./'):
            item = path + "/" + item
        if os.path.isdir(item):
            result.extend(listAllFile(item))
        else:
            result.append(item)
    return result


def listAllFile(path):
    return list_all_files(path)


def list_files_by_suffix(suffix):
    files = listAllFile("./")
    result = []
    for item in files:
        if (item.endswith("." + suffix) or item.endswith("." + suffix.upper())):
            result.append(item)
    return result


def listAllMdFile():
    return list_files_by_suffix("md")

# 将制定html的css选择器元素里的内容替换为content 并返回更新后的html


def replace_html_node(html, selector, content):

    soup = BeautifulSoup(html, features="html.parser")
    if (len(soup.select(selector)) == 0):
        print('soup select is 0')
        return ""
    soup.select(selector)[0].replaceWith(
        BeautifulSoup(content, features="html.parser"))
    return soup.prettify()


def write_text_to_file(file_name, text):
    try:
        result_file = open(file_name, 'w')
        result_file.write(text)
        result_file.close()
    except Exception as e:
        log_err("写入文件 " + file_name + " 发生异常 :" + str(e))


def read_text_from_file(file_name):
    try:
        html_file = open(file_name, 'rb')
        html = str(html_file.read(), encoding="utf-8")
        html_file.close()
        return html
    except Exception as e:
        log_err("读取文件 " + file_name + " 发生异常 :" + str(e))
        return ""


def current_time():
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())


def log_err(content):
    print("\033[1;31;1m[log-error]:%s---%s\033[0m" % (current_time(), content))


def log_inf(content):
    print('[log-info]:%s---%s' % (current_time, str(content)))


def log(content):
    log_inf(content)
