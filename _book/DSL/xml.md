_xml 与 html_

- xml标签都是自定义的，html标签是预定义。
- xml的语法严格，html语法松散
- xml是存储数据的，html是展示数据

# 基本语法

- xml文档的后缀名 .xml
- xml第一行必须定义为文档声明
- xml文档中有且仅有一个根标签
- 属性值必须使用引号(单双都可)引起来
- 标签必须正确关闭
- xml标签名称区分大小写

# 组成部分

## 文档声明

- 格式：`<?xml 属性列表 ?>`
- 属性列表：

  - version：版本号，必须的属性
  - encoding：编码方式。告知解析引擎当前文档使用的字符集，默认值：ISO-8859-1
  - standalone：是否独立

    - 取值：

      - yes：不依赖其他文件
      - no：依赖其他文件

## 标签

- 规则：

  - 名称可以包含字母、数字以及其他的字符
  - 名称不能以数字或者标点符号开始
  - 名称不能以字母 xml（或者 XML、Xml 等等）开始
  - 名称不能包含空格

## 属性属性

id属性值唯一

## 文本：

- CDATA区：在该区域中的数据会被原样展示

  - 格式： `<![CDATA[ 数据 ]]>`

# 约束

![约束](/assets/约束.bmp)

## DTD

- 内部dtd：将约束规则定义在xml文档中
- 外部dtd：将约束的规则定义在外部的dtd文件中

  - 本地：`<!DOCTYPE 根标签名 SYSTEM "dtd文件的位置">`
  - 网络：`<!DOCTYPE 根标签名 PUBLIC "dtd文件名字" "dtd文件的位置URL">`

## Schema

# 解析

- DOM：将标记语言文档一次性加载进内存，在内存中形成一颗dom树

  - 优点：操作方便，可以对文档进行CRUD的所有操作
  - 缺点：占内存

- SAX：逐行读取，基于事件驱动的。

  - 优点：不占内存。
  - 缺点：只能读取，不能增删改

# jsuop

- Jsoup：工具类，可以解析html或xml文档，返回Document
  - parse
- Document：文档对象。代表内存中的dom树
  - getElementByXX
- Element：元素对象
  - getElementByXX
- Node：节点对象

## 快捷查询

- selector
- XPath




