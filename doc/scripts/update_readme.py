# -*- coding: utf-8 -*
import base
templateFile = open('./scripts/readme_template.md', 'r', encoding='utf8')
summaryFile = open('./SUMMARY.md', 'r', encoding='utf8')
readmeFile = open('./README.md', 'w', encoding='utf8')

template = templateFile.read()
summary = summaryFile.read()
template = template.replace('${category}', summary)
readmeFile.write(template)

readmeFile.close()
summaryFile.close()
templateFile.close()

base.log('更新首页完成')
