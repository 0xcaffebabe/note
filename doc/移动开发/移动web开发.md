# 移动web开发

## 流式布局

视口（viewport）就是浏览器显示页面内容的屏幕区域。 视口可以分为布局视口、视觉视口和理想视口

### 布局视口 layout viewport

![202001180923](/assets/202001180923.png)

一般移动设备的浏览器都默认设置了一个布局视口，用于解决早期的PC端页面在手机上显示的问题。

iOS, Android基本都将这个视口分辨率设置为 980px，所以PC上的网页大多都能在手机上呈现，只不过元素看上去很小，一般默认可以通过手动缩放网页

### 视觉视口 visual viewport

![202001180929](/assets/202001180929.png)

它是用户正在看到的网站的区域，我们可以通过缩放去操作视觉视口，但不会影响布局视口，布局视口仍保持原来的宽度

### 理想视口 ideal viewport

布局视口的宽度应该与理想视口的宽度一致，简单理解就是设备有多宽，我们布局的视口就多宽

### meta标签

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, minimum-scale=1.0">
```

属性            | 解释说明
------------- | ------------------------------------
width         | 宽度设置的是viewport宽度，可以设置device-width特殊值
initial-scale | 初始缩放比，大于0的数字
maximum-scale | 最大缩放比，大于0的数字
minimum-scale | 最小缩放比，大于0的数字
user-scalable | 用户是否可以缩放，yes或no (1或0)


标准设置

- 视口宽度和设备保持一致
- 视口的默认缩放比例1.0
- 不允许用户自行缩放
- 最大允许的缩放比例1.0
- 最小允许的缩放比例1.0

## 二倍图

### 物理像素&物理像素比

物理像素点指的是屏幕显示的最小颗粒，是物理真实存在的。这是厂商在出厂时就设置好了,比如苹果6 是  750* 1334

我们开发时候的1px 不是一定等于1个物理像素的

一个px的能显示的物理像素点的个数，称为物理像素比或屏幕像素比

lRetina（视网膜屏幕）是一种显示技术，可以将把更多的物理像素点压缩至一块屏幕里，从而达到更高的分辨率，并提高屏幕显示的细腻程度

按照刚才的物理像素比会放大倍数，这样会造成图片模糊

在标准的viewport设置中，使用倍图来提高图片质量，解决在高清设备中的模糊问题

### 背景缩放background-size

```css
background-size: 背景图片宽度 背景图片高度;
```

单位： 长度|百分比|cover|contain;

cover把背景图像扩展至足够大，以使背景图像完全覆盖背景区域。

contain把图像图像扩展至最大尺寸，以使其宽度或高度完全适应内容区域

## 移动开发选择和技术解决方案

- 单独制作移动端页面（主流）
- 响应式页面兼容移动端（其次）

### 解决方案

移动端浏览器基本以 webkit 内核为主，因此我们就考虑webkit兼容性问题

- 移动端公共样式Normalize.css

- 移动端大量使用 CSS3盒子模型box-sizing
  - CSS3盒子模型：盒子的宽度=  CSS中设置的宽度width 里面包含了 border 和 padding 

```css
/*CSS3盒子模型*/
box-sizing: border-box;
/*传统盒子模型*/
box-sizing: content-box;
```

- 移动端特殊样式

```css
/*CSS3盒子模型*/
box-sizing: border-box;
-webkit-box-sizing: border-box;
/*点击高亮我们需要清除清除  设置为transparent 完成透明*/
-webkit-tap-highlight-color: transparent;
/*在移动端浏览器默认的外观在iOS上加上这个属性才能给按钮和输入框自定义样式*/
-webkit-appearance: none;
/*禁用长按页面时的弹出菜单*/
img,a { -webkit-touch-callout: none; }
```

## 移动端常见布局

移动端单独制作

+ 流式布局（百分比布局）
+ flex 弹性布局（强烈推荐）
+ less+rem+媒体查询布局
+ 混合布局

响应式

+ 媒体查询
+ bootstarp

流式布局：

流式布局，就是百分比布局，也称非固定像素布局。

通过盒子的宽度设置成百分比来根据屏幕的宽度来进行伸缩，不受固定像素的限制，内容向两侧填充。

流式布局方式是移动web开发使用的比较常见的布局方式。

```css
width:100%;
max-width: 1200px;
min-width: 320px;
```

### flex布局

pc端浏览器支持情况比较差

如果是移动端或者是不考虑兼容的pc则采用flex

#### 原理

flex 是 flexible Box 的缩写，意为"弹性布局"，用来为盒状模型提供最大的灵活性，任何一个容器都可以指定为 flex 布局

通过给父盒子添加flex属性，来控制子盒子的位置和排列方式

#### 父项常见属性

- flex-direction设置主轴的方向

![202001182037](/assets/202001182037.jpg)

```css
flex-direction: value;
```

值              | 说明
-------------- | -------
**row**        | 默认值从左到右
row-reverse    | 从右到左
**column**     | 从上到下
column-reverse | 从下到上

-  justify-content 设置主轴上的子元素排列方式

值                 | 说明
----------------- | ---------------------
**flex-start**    | 默认值从头部开始如果主轴是x轴，则从左到右
flex-end          | 从尾部开始排列
**center**        | 在主轴居中对齐(如果主轴是x轴则水平居中)
**space-around**  | 平分剩余空间
**space-between** | 先两边贴边再平分剩余空间(重要)

- flex-wrap设置是否换行

nowrap 不换行
wrap 换行

- align-items 设置侧轴上的子元素排列方式（单行 ）

flex-start 从头部开始
flex-end 从尾部开始
center 居中显示
stretch 拉伸

- align-content  设置侧轴上的子元素的排列方式（多行）

值             | 说明
------------- | -------------------
flex-start    | 默认值在侧轴的头部开始排列
flex-end      | 在侧轴的尾部开始排列
center        | 在侧轴中间显示
space-around  | 子项在侧轴平分剩余空间
space-between | 子项在侧轴先分布在两头，再平分剩余空间
stretch       | 设置子项元素高度平分父元素高度

-  flex-flow 属性是 flex-direction 和 flex-wrap 属性的复合属性

```css
flex-flow:row wrap;
```

#### flex布局子项常见属性

- flex 属性

定义子项目分配剩余空间，用flex来表示占多少**份数**

- align-self控制子项自己在侧轴上的排列方式

align-self 属性允许单个项目有与其他项目不一样的对齐方式，可覆盖 align-items 属性

- order 属性定义项目的排列顺序

数值越小，排列越靠前，默认为0

## rem布局

### rem

rem (root em)是一个相对单位，类似于em，em是父元素字体大小。

不同的是rem的基准是相对于html元素的字体大小

### 媒体查询

+ 使用 @media查询，可以针对不同的媒体类型定义不同的样式
+ @media 可以针对不同的屏幕尺寸设置不同的样式
+ 当你重置浏览器大小的过程中，页面也会根据浏览器的宽度和高度重新渲染页面 
+ 目前针对很多苹果手机、Android手机，平板等设备都用得到多媒体查询

```css
@media mediatype and|not|only (media feature) {
    CSS-Code;
}
```

mediatype 查询类型

值     | 解释说明
----- | -----------------
all   | 用于所有设备
print | 用于打印机和打印预览
scree | 用于电脑屏幕，平板电脑，智能手机等

关键字

关键字将媒体类型或多个媒体特性连接到一起做为媒体查询的条件

媒体特性

值         | 解释说明
--------- | -----------------
width     | 定义输出设备中页面可见区域的宽度
min-width | 定义输出设备中页面最小可见区域宽度
max-width | 定义输出设备中页面最大可见区域宽度

为了防止混乱，媒体查询我们要按照从小到大或者从大到小的顺序来写,但是我们最喜欢的还是从小到大来写，这样代码更简洁

媒体特性也可以加在css引用中，来达到不同的屏幕加载不同的css文件

### rem适配方案

1.less+rem+媒体查询

2.lflexible.js+rem

