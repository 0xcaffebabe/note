- 静态资源
- 动态资源

--------------------------------------------------------------------------------

- 超文本
- 标记语言

# 标签

- 围堵标签
- 自闭标签

# 基本标签

## 文件标签

- html
- head
- title
- body
- `<!DOCTYPE html>`

## 文本标签

- h1 ~ h6
- p
- br
- hr
- b
- i
- font

## 图片标签

- src
- alt

## 列表标签

- ul：无序
- ol：有序

## 链接标签

## 块标签

- div
- span

## 语义化标签

- header
- footer
- nav

## 表格标签

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

## 表单标签

- input
- select
  - option
- textarea
- label

## HTML5

## `HTML5` 拓展了哪些内容

- 语义化标签
- 本地存储
- 兼容特性
- `2D`、`3D`
- 动画、过渡
- `CSS3` 特性
- 性能与集成

## 语义化标签

- `header` --- 头部标签
- `nav` --- 导航标签
- `article` --- 内容标签
- `section` --- 块级标签
- `aside` --- 侧边栏标签
- `footer` --- 尾部标签

![2021927165247](/assets/2021927165247.jpg)

- 语义化标签主要针对搜索引擎
- 新标签可以使用一次或者多次
- 在 `IE9` 浏览器中，需要把语义化标签都转换为块级元素
- 语义化标签，在移动端支持比较友好

## 多媒体标签

- 音频 -- `audio`
- 视频 -- `video`

### audio

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

### video

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

## 新增 input 标签类型

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

## 新增表单属性

- autocomplete：用户在自动完成域种输入时，浏览器会在该域显示填写的选项
- novalidate：指定是否验证input域或者提交表单时是否检查表单数据符合要求
