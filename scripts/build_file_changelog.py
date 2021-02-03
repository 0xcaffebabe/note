# -*- coding: utf-8 -*

import base

import pydriller

page_alias = {'README.md': 'index.html'}

def process():
  files = base.listAllMdFile()
  for file in files:
    commit_list = []
    commit_log = reversed(list(pydriller.RepositoryMining("./", filepath=file).traverse_commits()))
    # 只取最近10条
    commit_log = list(commit_log)[0:10]
    for commit in commit_log:
      commit_list.append({'msg': commit.msg, 'date': commit.author_date.strftime("%Y-%m-%d %H:%M:%S")})
    key = ""
    if file in page_alias: key = page_alias[file]
    else: key = file.replace('.md','.html')
    write_recent_commits(key, commit_list)
    print(key + "处理完成")

def write_recent_commits(file_name, commit_list):
  file_name = "_book/" + file_name
  html = '<div class="copyright"><p>更新历史:</p><ul>'
  for item in commit_list:
    html += '<li><a href="#">%s %s</a></li>'%(item['date'], item['msg'])
  html += '</ul></div>'
  file_html = base.read_text_from_file(file_name)
  if (file_html == ''): 
    print(file_name + "内容为空,跳过")
    return
  html = base.replace_html_node(file_html, '.page-footer .copyright', html)
  if (html == ""):
    print(file_name + "html 节点替换结果为空, 跳过")
    return
  base.write_text_to_file(file_name, html)

process()