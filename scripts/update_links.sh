# 处理文章md链接
if test -z "$(find ./ -type f -name '*.html')";then
  echo "html文件为空，终止"
  exit
fi

find ./ -type f -name '*.html'|xargs sed -i "s/.md#/.html#/g"
find ./ -type f -name '*.html'|xargs sed -i "s/.md)/.html)/g"