# HTML5

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

![](https://www.runoob.com/wp-content/uploads/2013/07/html5-layout.jpg)

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

![](https://images2015.cnblogs.com/blog/275644/201707/275644-20170724094159180-147147374.png)

- 音频标签与视频标签使用基本一致
- 多媒体标签在不同浏览器下情况不同，存在兼容性问题
- 谷歌浏览器把音频和视频标签的自动播放都禁止了
- 谷歌浏览器中视频添加 muted 标签可以自己播放

## 新增 input 标签

![](https://codebridgeplus.com/public/wp-content/uploads/html_input.jpg)

## 新增表单属性

![](http://image.mamicode.com/info/201901/20190106005941629009.png)
