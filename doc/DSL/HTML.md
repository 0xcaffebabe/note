---
tags: ['前端', '标记语言', 'Web开发']
---

# HTML

- 静态资源
- 动态资源

--------------------------------------------------------------------------------

- 超文本
- 标记语言

## 标签

- 围堵标签
- 自闭标签

## 基本标签

### 元标签

- head 规定了自身必须是 html 标签中的第一个标签，它的内容必须包含一个 title，并且最多只能包含一个 base
- title 文档标题，应该是完整地概括整个网页内容的
- base 是个历史遗留标签，它的作用是给页面上所有的 URL 相对地址提供一个基础
- link
- meta
  - [http-equiv](/计算机网络/http/缓存.md#HTML的HTTP-EQUIV)
	- [viewport](/移动开发/移动web开发.md#流式布局)

```html
<html>
<head>
<!-- 
    一般情况下，HTTP 服务端会通过 http 头来指定正确的编码方式，
    但是有些特殊的情况如使用 file 协议打开一个 HTML 文件，则没有 http 头
    这种时候，charset meta 就非常重要了
 -->
<meta charset="UTF-8">

<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
<!-- 默认使用最新浏览器 -->
<meta http-equiv="Cache-Control" content="no-siteapp">
<!-- 不被网页(加速)转码 -->
<meta name="robots" content="index,follow">
<!-- 搜索引擎抓取 -->
<meta name="renderer" content="webkit">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui">
<meta name="apple-mobile-web-app-capable" content="yes">
<!-- 删除苹果默认的工具栏和菜单栏 -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<!-- 设置苹果工具栏颜色 -->
……
```

### 文件标签

- html
- body
- `<!DOCTYPE html>`

### 文本标签

- h1 ~ h6
- p
- br
- hr
- b
- i
- font

### 图片标签

- src
- alt

### 列表标签

- ul：无序
- ol：有序

### 链接标签

![2022630163840](/assets/2022630163840.webp)

- link
- a
- area 是唯一一个支持了非矩形触发区域的元素

### 块标签

- div
- span

### 表格标签

```html

<table>
    <caption></caption>
    <thead>
        <tr>
            <th>编号</th>
            <th>姓名</th>
        </tr>
    </thead>
    
    <tbody>
            <tr>
                <td>1</td>
                <td>lisi</td>
            </tr>
    </tbody>

    <tfoot></tfoot>
</table>
```

### 表单标签

- input
- select
  - option
- textarea
- label

## HTML5

### `HTML5` 拓展了哪些内容

- 语义化标签
- 本地存储
- 兼容特性
- `2D`、`3D`
- 动画、过渡
- `CSS3` 特性
- 性能与集成

### 语义化标签

- `header` --- 头部标签
- `nav` --- 导航标签
- `article` --- 内容标签
- `section` --- 块级标签
- `aside` --- 侧边栏标签
- `footer` --- 尾部标签

### 多媒体标签

- 音频 -- `audio`
- 视频 -- `video`

#### audio

音频格式 | Chrome | Firefox | IE9 | Opera | Safari
---- | ------ | ------- | --- | ----- | ------
OGG  | 支持     | 支持      | 支持  | 支持    | 不支持
MP3  | 支持     | 不支持     | 支持  | 不支持   | 支持
WAV  | 不支持    | 支持      | 不支持 | 支持    | 不支持

属性       | 属性值      | 注释
-------- | -------- | -----------------------------------------------
src      | url      | 播放的音乐的url地址
preload  | preload  | 预加载（在页面被加载时进行加载或者说缓冲音频），如果使用了autoplay的话那么该属性失效。
loop     | loop     | 循环播放
controls | controls | 是否显示默认控制条（控制按钮）
autoplay | autoplay | 自动播放

```html
<audio src="./media/snow.mp3" controls autoplay></audio>
```

#### video

```html
<video src="./media/video.mp4" controls="controls"></video>
```

浏览器      | MP4      | WebM           | Ogg
-------- | -------- | -------------- | ---
Internet | Explorer | YES            | NO  | NO
Chrome   | YES      | YES            | YES |
Firefox  | YES      | YES            | YES |
Safari   | YES      | NO             | NO  |
Opera    | YES      | (从 Opera 25 起) | YES | YES

```html
<!-- 谷歌浏览器禁用了自动播放功能，如果想自动播放，需要添加 muted 属性 -->
<video controls="controls" autoplay muted loop poster="./media/pig.jpg">
    <source src="./media/video.mp4" type="video/mp4">
    <source src="./media/video.ogg" type="video/ogg">
</video>
```

属性          | 值               | 描述
----------- | --------------- | ---------------------------------------------------
autoplay    | autoplay        | 如果出现该属性,则视频在就绪后马上播放。
controls    | controls        | 如果出现该属性,则向用户显示控件,比如播放按钮。
height      | px              | 设置视频播放器的高度。
loop        | loop            | 如果出现该属性，则当媒介文件完成播放后再次开始播放。
muted muted | 规定视频的音频输出应该被静音。
poster      | url             | 规定视频下载时显示的图像，或者在用户点击播放按钮前显示的图像。
preload     | preload         | 如果出现该属性,则视频在页面加载时进行加载,并预备播放。如果使用"autoplay" ,则忽略该属性。
src         | url             | 要播放的视频的URL。
width       | px              | 设置视频播放器的宽度。

- 音频标签与视频标签使用基本一致
- 多媒体标签在不同浏览器下情况不同，存在兼容性问题
- 谷歌浏览器把音频和视频标签的自动播放都禁止了
- 谷歌浏览器中视频添加 muted 标签可以自己播放

### 新增 input 标签类型

- color
- date
- datetime
- datetime-local
- email
- month
- number
- range
- search
- tel
- time
- url
- week

### 新增表单属性

- autocomplete：用户在自动完成域种输入时，浏览器会在该域显示填写的选项
- novalidate：指定是否验证input域或者提交表单时是否检查表单数据符合要求

## 语义化标签

- header
- footer
- nav

![2021927165247](/assets/2021927165247.jpg)

- 语义化标签对搜索引擎以及开发者更为友好
- 新标签可以使用一次或者多次
- 在 `IE9` 浏览器中，需要把语义化标签都转换为块级元素
- 语义化标签，在移动端支持比较友好

### 补充

语义标签的使用的第一个场景，也是最自然的使用场景，就是：作为自然语言和纯文本的补充，用来表达一定的结构或者消除歧义

### 标题摘要

语义化的 HTML 能够支持自动生成目录结构，HTML 标准中还专门规定了生成目录结构的算法，一篇文档会有一个树形的目录结构，它由各个级别的标题组成

### 整体结构

应用了语义化结构的页面，可以明确地提示出页面信息的主次关系，它能让浏览器很好地支持“阅读视图功能”，还可以让搜索引擎的命中率提升，同时，它也对视障用户的读屏软件更友好

## 可访问性

- ARIA（Accessible Rich Internet Applications）

可以通过 HTML 属性变化来理解这个 JavaScript 组件的状态，读屏软件等三方客户端，就可以理解我们的 UI 变化
