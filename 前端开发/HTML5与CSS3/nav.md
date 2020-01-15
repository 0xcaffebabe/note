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

## CSS3

### 选择器

#### 属性选择器

![](https://images2017.cnblogs.com/blog/1199008/201711/1199008-20171108095116481-170436080.png)

```css
input[type=search] {
  color: skyblue;
}
``` 

#### 结构伪类选择器

![](http://www.sunpcn.cn/wp-content/uploads/2015/08/wysxzq.jpg)

nth-child 详解

- n 可以是数字、关键字、公式
- n 如果是数字，就是选中第几个
- 常见的关键字有 `even` 偶数、`odd` 奇数
- 常见的公式如下(如果 n 是公式，则从 0 开始计算)
- 但如果是第 0 个元素或者超出了元素的个数会被忽略

`nth-child` 和  `nt-of-type` 的区别

- `nth-child`  选择父元素里面的第几个子元素，不管是第几个类型
- `nt-of-type`  选择指定类型的元素

#### 伪元素选择器

- ::before 在元素内部的前面插入内容
- ::after 在元素内部的后面插入内容

注意事项

- `before` 和 `after` 必须有 `content` 属性
- `before` 在内容前面，after 在内容后面
- `before` 和 `after` 创建的是一个元素，但是属于行内元素
- 创建出来的元素在 `Dom` 中查找不到，所以称为伪元素
- 伪元素和标签选择器一样，权重为 1