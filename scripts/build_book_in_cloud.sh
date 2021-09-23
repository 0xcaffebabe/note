#!/bin/sh
startTime=`date +%Y%m%d-%H:%M`
startTime_s=`date +%s`

echo "安装python依赖"
pip install jieba wordcloud beautifulsoup4 httpx pydriller htmlmin

echo "运行统计脚本"
python3 ./scripts/statistics.py

echo "运行更新仓库文件时间脚本"
git config --global core.quotepath false
chmod +x ./scripts/updatetime.sh
./scripts/updatetime.sh | bash

echo "运行更新README脚本"
python3 ./scripts/update_readme.py

echo "安装gitbook依赖"
gitbook install

echo "构建书籍"
gitbook build

echo "运行更新html文件md链接脚本"
chmod +x ./scripts/update_links.sh
./scripts/update_links.sh | bash

echo "运行统计文章字数脚本"
python3 ./scripts/build_page_word_count.py

echo "运行页面更新历史构建脚本"
python3 ./scripts/build_file_changelog.py

echo "运行构造首页章节最后更新时间脚本"
python3 ./scripts/build_home_change_time.py

echo "运行构造章节文章数脚本"
python3 ./scripts/build_chapter_count.py

echo "运行首页js追加脚本"
python3 ./scripts/append_js_index.py

echo "运行css预处理脚本"
python3 ./scripts/css_processor.py

echo "运行html压缩脚本"
python3 ./scripts/html_processor.py

endTime=`date +%Y%m%d-%H:%M`
endTime_s=`date +%s`
sumTime=$[ $endTime_s - $startTime_s ]

echo "构建总消耗时间:$sumTime 秒"
