#!/bin/sh

echo "安装python依赖"
pip install jieba wordcloud beautifulsoup4 httpx pydriller

echo "运行统计脚本"
python ./scripts/statistics.py

echo "运行更新仓库文件时间脚本"
git config --global core.quotepath false
chmod +x ./scripts/updatetime.sh
./scripts/updatetime.sh | bash

echo "运行更新README脚本"
python ./scripts/update_readme.py

echo "安装gitbook依赖"
gitbook install

echo "构建书籍"
gitbook build

echo "运行更新html文件md链接脚本"
chmod +x ./scripts/update_links.sh
./scripts/update_links.sh | bash

echo "运行构造章节文章数脚本"
python ./scripts/build_chapter_count.py

echo "运行统计文章字数脚本"
python ./scripts/build_page_word_count.py

echo "运行页面更新历史构建脚本"
python ./scripts/build_file_changelog.py