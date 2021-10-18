# -*- coding: utf-8 -*
"""
构建章节底部提交历史
"""
import base

import pydriller

page_alias = {'README.md': 'index.html'}


def process():
    files = base.listAllMdFile()
    for file in files:
        commit_list = []
        commit_log_origin = list(pydriller.RepositoryMining(
            "./", filepath=file).traverse_commits())
        show_more = len(commit_log_origin) > 10
        commit_log = reversed(commit_log_origin)
        # 只取最近10条
        commit_log = list(commit_log)[0:10]
        for commit in commit_log:
            commit_list.append({'msg': commit.msg, 'date': commit.author_date.strftime(
                "%Y-%m-%d %H:%M:%S"), 'hash': commit.hash})
        key = ""
        if file in page_alias:
            key = page_alias[file]
        else:
            key = file.replace('.md', '.html')
        write_recent_commits(key, commit_list, show_more, len(commit_log_origin))
        base.log("章节历史构建 " + key + " 处理完成")


def write_recent_commits(file_name, commit_list, show_more, commit_count):
    file_name = "_book/" + file_name
    html = '<div class="copyright"><p>更新历史:</p><ul>'
    for item in commit_list:
        html += '<li><a href="https://github.com/0xcaffebabe/note/commit/%s" target="_blank">%s %s</a></li>' % (
            item['hash'], item['date'], item['msg'])
    if show_more:
        git_file = file_name.replace("_book/","").replace(".html",".md")
        html += '<li><a href="https://github.com/0xcaffebabe/note/commits/master/%s" target="_blank">全部历史(%s条)</a></li>'%(git_file, commit_count)
    html += '</ul></div>'
    file_html = base.read_text_from_file(file_name)
    if (file_html == ''):
        base.log("章节历史构建 "+file_name + "内容为空,跳过")
        return
    html = base.replace_html_node(file_html, '.page-footer .copyright', html)
    if (html == ""):
        base.log("章节历史构建 "+file_name + "html 节点替换结果为空, 跳过")
        return
    base.write_text_to_file(file_name, html)


process()
