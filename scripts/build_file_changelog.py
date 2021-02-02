# -*- coding: utf-8 -*

from base import listAllMdFile, write_text_to_file, replace_html_node, read_text_from_file

import pydriller

def process():
  files = listAllMdFile()
  for file in files:
    commit_list = []
    for commit in pydriller.RepositoryMining("./", filepath=file).traverse_commits():
      commit_list.append({'msg': commit.msg, 'date': commit.author_date})
    key = file.replace('.md','.html')
    write_recent_commits(key, commit_list)
    print(key + "process done")

def write_recent_commits(file_name, commit_list):
  file_name = "_book/" + file_name
  html = '<div class="copyright"><p>更新历史:</p><ul>'
  for item in commit_list:
    html += '<li><a href="#">%s %s</a></li>'%(item['msg'], item['date'])
  html += '</ul></div>'
  file_html = read_text_from_file(file_name)
  if (file_html == ''): 
    print(file_name + "is empty ,skip")
    return
  html = replace_html_node(file_html, '.page-footer .copyright', html)
  if (html == ""):
    print(file_name + "html selct result empty,,skip")
    return
  write_text_to_file(file_name, html)

process()