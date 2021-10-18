# 目录
[toc]
# VIM
## vim的四种模式
- **正常模式**：启动vim后默认处于正常模式。不论位于什么模式，按下<Esc>键(有时需要按两下）都会进入正常模式
    - w：跳到下一个单词
    - b：跳到上一个单词
    - 0：跳到行首
    - $：跳到行尾
    - gg：跳到文档开头
    - G：跳到文档末尾
    - ctrl + u :上翻页
    - ctrl + f ：下翻页
    - zz：将光标移到屏幕中间
    - dt{char} : delete to char (删除到char)
    - ct{char} : delete to char and into insert(删除到char然后进入insert
    - ctrl+u：向前滚动半页
    模式)
- **插入模式**：
```
i:进入插入模式
o：新起一行进行添加
a：在光标后进行追加
在插入模式中，可以使用```ctrl + h``` 或者 ```ctrl + w```来删除上一个单词
ctrl + u ：undo操作
```
- **命令模式**：在正常模式中，按下:（英文冒号）键，会进入命令模式。在命令模式中可以执行一些输入并执行一些vim或插件提供的指令，就像在shell里一样。这些指令包括设置环境、文件操作、调用某个功能等等
    - %s s/{a}/{b}/g：全局把a替换成b
    - vs:垂直分割屏幕
    - sp：水平分割屏幕
    - ctrl + w:移动到上一个屏幕
- **可视模式**：在正常模式中按下v, V, <Ctrl>+v，可以进入可视模式。可视模式中的操作有点像拿鼠标进行操作，选择文本的时候有一种鼠标选择的即视感，有时候会很方便
    - y：复制
    - p：粘贴
## 宏的使用
录制宏：
回放宏：
## 自动补全
- 单词自动补全
    - ctrl + n：下一个单词
    - ctrl + p: 上一个单词
- 文件自动补全
ctrl + f
## 修改VIM的配色
```
: colorscheme xx
```
其中xx为配色名称
## 持久化配置
在~/.vimrc中可以输入一些命令，以此来保存配置：
```
set nu
set autoindent
set background=dark
colorscheme hybrid
syntax on
```
## 按键映射
*map：
其中*可以为i(insert),c(command),n(normal),v(visual)
*noremap:
*的取值同上
nore的区别在于这种按键映射是非递归的。
举例：
```
imap jj <esc> 
```
这么样一条命令代表在insert模式下按下jj会自动切换到normal模式
## 插件的安装


