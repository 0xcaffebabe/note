---
tags: ['前端', '样式', 'Web开发']
---

# CSS

> 层叠样式表（英语：Cascading Style Sheets，缩写：CSS；又称串样式列表、级联样式表、串接样式表、阶层式样式表）是一种用来为结构化文档（如HTML文档或XML应用）添加样式（字体、间距和颜色等）的计算机语言，由W3C定义和维护。当前最新版本是CSS2.1，为W3C的推荐标准。CSS3现在已被大部分现代浏览器支持，而下一版的CSS4仍在开发中。

## 语法规则

### At规则

- @charset ：<https://www.w3.org/TR/css-syntax-3/>
- @import ：<https://www.w3.org/TR/css-cascade-4/>
- @media ：<https://www.w3.org/TR/css3-conditional/>
- @page ：<https://www.w3.org/TR/css-page-3/>
- @counter-style ：<https://www.w3.org/TR/css-counter-styles-3>
- @keyframes ：<https://www.w3.org/TR/css-animations-1/>
- @fontface ：<https://www.w3.org/TR/css-fonts-3/>
- @supports ：<https://www.w3.org/TR/css3-conditional/>
- @namespace ：<https://www.w3.org/TR/css-namespaces-3/>

### 选择器

- <https://www.w3.org/TR/selectors-4/>

![2022630152944](/assets/2022630152944.webp)

选择器的作用：找到特定的HTML页面元素

#### namespace

svg 和 HTML 中都有 a 元素，我们若要想区分选择 svg 中的 a 和 HTML 中的 a，就必须用带命名空间的类型选择器

```css
@namespace svg url(http://www.w3.org/2000/svg);
@namespace html url(http://www.w3.org/1999/xhtml);
svg|a {
  stroke:blue;
  stroke-width:1;
}

html|a {
  font-size:40px
}
```

#### 基础选择器

选择器    | 作用              | 缺点           | 使用情况  | 用法
------ | --------------- | ------------ | ----- | --------------------
标签选择器  | 可以选出所有相同的标签，比如p | 不能差异化选择      | 较多    | p { color：red;}
类选择器   | 可以选出1个或者多个标签    | 可以根据需求选择     | 非常多   | .nav { color: red; }
id选择器  | 一次只能选择器1个标签     | 只能使用一次       | 不推荐使用 | #nav {color: red;}
通配符选择器 | 选择所有的标签         | 选择的太多，有部分不需要 | 不推荐使用 | * {color: red;}

##### 标签选择器

```css
标签名{属性1:属性值1; 属性2:属性值2; 属性3:属性值3; }
```

```css
p {
    font-size:14px;
}
```

##### 类选择器

```css
.类名  {   
    属性1:属性值1; 
    属性2:属性值2; 
    属性3:属性值3;     
}
```

```html
<p class='类名'></p>
```

- 多类名

```html
<p class='class1 class2'></p>
```

##### ID选择器

```css
#id名 {属性1:属性值1; 属性2:属性值2; 属性3:属性值3; }
```

```html
<p id="id名"></p>
```

- ID选择器与类选择器

  - 类选择器我们在修改样式中，用的最多。
  - id选择器一般用于页面唯一性的元素身上，经常和我们后面学习的javascript 搭配使用。

##### 通配符选择器

```css
* { 属性1:属性值1; 属性2:属性值2; 属性3:属性值3; }
```

```css
* {
  margin: 0;                    /* 定义外边距*/
  padding: 0;                   /* 定义内边距*/
}
```

## 复合选择器

### 后代选择器

- 后代选择器又称为包含选择器

```css
父级 子级{属性:属性值;属性:属性值;}
```

```css
.class h3{color:red;font-size:16px;}
```

### 子元素选择器

- 子元素选择器只能选择作为某元素**子元素(直接子元素)**的元素

```css
.class>h3{color:red;font-size:14px;}
```

### 交集选择器

```css
/* 选择标签是p且类名是one的元素 */
p.one{color:red}
```

### 并集选择器

```css
/*  .one 和 p  和 #test 这三个选择器都会执行颜色为红色。   */
.one, p , #test {color: #F00;}
```

### 链接伪类选择器

```css
a:link      /* 未访问的链接 */
a:visited   /* 已访问的链接 */
a:hover     /* 鼠标移动到链接上 */
a:active    /* 选定的链接 */
```

- 写的时候，他们的顺序尽量不要颠倒 按照 lvha 的顺序。否则可能引起错误

### 符合选择器总结

选择器     | 作用           | 特征         | 使用情况 | 隔开符号及用法
------- | ------------ | ---------- | ---- | --------------------------
后代选择器   | 用来选择元素后代     | 是选择所有的子孙后代 | 较多   | 符号是**空格** .nav a
子代选择器   | 选择 最近一级元素    | 只选亲儿子      | 较少   | 符号是 **>** .nav>p
交集选择器   | 选择两个标签交集的部分  | 既是 又是      | 较少   | **没有符号** p.one
并集选择器   | 选择某些相同样式的选择器 | 可以用于集体声明   | 较多   | 符号是**逗号** .nav, .header
链接伪类选择器 | 给链接更改状态      |            | 较多   | 重点记住 a{} 和 a:hover 实际开发的写法

### 属性和值

属性不允许使用连续的两个中划线开头，这样的属性会被认为是 CSS 变量

值可能是以下类型：

- CSS 范围的关键字：initial，unset，inherit，任何属性都可以的关键字。
- 字符串：比如 content 属性。
- URL：使用 url() 函数的 URL 值。
- 整数 / 实数：比如 flex 属性。
- 维度：单位的整数 / 实数，比如 width 属性。
- 百分比：大部分维度都支持。颜色：比如 background-color 属性。
- 图片：比如 background-image 属性。
- 2D 位置：比如 background-position 属性。
- 函数：来自函数的值，比如 transform 属性。

## 书写规范

[BEM规范](https://juejin.cn/post/6844903672162304013)

- 空格规范

```css
/*  选择器 与 { 之间必须包含空格。 */
.selector {
  /* 属性名 与之后的 : 之间不允许包含空格， : 与 属性值 之间必须包含空格 */
  font-size: 12px;
}
```

- 选择器规范

```css
/*  并集选择器，每个选择器声明必须独占一行 */
.post,
.page,
.comment {
    line-height: 1.5;
}
```
一般情况情况下，选择器的嵌套层级应不大于 3 级，位置靠后的限定条件应尽可能精确

- 属性规范

```css
/* 属性定义必须另起一行。 */
.selector {
    margin: 0;
    padding: 0;
    /* 属性定义后必须以分号结尾。 */
}
```

## 使用方式

- 内联

```html
<标签名 style="属性1:属性值1; 属性2:属性值2; 属性3:属性值3;"> 内容 </标签名>
```

- 内嵌

```html
<head>
<style type="text/CSS">
    选择器（选择的标签） { 
      属性1: 属性值1;
      属性2: 属性值2; 
      属性3: 属性值3;
    }
</style>
</head>
```

- 外联

```html
<head>
  <link rel="stylesheet" type="text/css" href="css文件路径">
</head>
```

属性   | 作用
---- | :-------------------------------------------------------
rel  | 定义当前文档与被链接文档之间的关系，在这里需要指定为"stylesheet"，表示被链接的文档是一个样式表文件。
type | 定义所链接文档的类型，在这里需要指定为"text/CSS"，表示链接的外部文件为CSS样式表。我们都可以省略
href | 定义所链接外部样式表文件的URL，可以是相对路径，也可以是绝对路径。

- 比较

样式表   | 优点           | 缺点           | 使用情况    | 控制范围
----- | ------------ | ------------ | ------- | ---------
行内样式表 | 书写方便，权重高     | 没有实现样式和结构相分离 | 较少      | 控制一个标签（少）
内部样式表 | 部分结构和样式相分离   | 没有彻底分离       | 较多      | 控制一个页面（中）
外部样式表 | 完全实现结构和样式相分离 | 需要引入         | 最多，强烈推荐 | 控制整个站点（多）

## 三大特性

### 层叠性

所谓层叠性是指多种CSS样式的叠加。

样式冲突，遵循的原则是**就近原则。** 那个样式离着结构近，就执行那个样式。

### 继承性

子元素可以继承父元素的样式（**text-，font-，line-这些元素开头的可以继承，以及color属性**）

### 优先级

选择器列表是用逗号分隔的复杂选择器序列；复杂选择器则是用空格、大于号、波浪线等符号连接的复合选择器；复合选择器则是连写的简单选择器组合

- 第一优先级：无连接符号
- 第二优先级
  - “空格”
  - “~”
  - “+”
  - “>”
  - “||”
- 第三优先级：“,”

| 标签选择器             | 计算权重公式 |
| ---------------------- | ------------ |
| 继承或者 *             | 0,0,0,0      |
| 每个元素（标签选择器） | 0,0,0,1      |
| 每个类，伪类           | 0,0,1,0      |
| 每个ID                 | 0,1,0,0      |
| 每个行内样式 style=""  | 1,0,0,0      |
| 每个!important  重要的 | ∞ 无穷大     |

- 权重叠加
  - div ul  li   ------>      0,0,0,3
  - .nav ul li   ------>      0,0,1,2
  - a:hover      -----—>   0,0,1,1
  - .nav a       ------>      0,0,1,1

## 排版

### 标签显式模式

> 标签以什么方式进行显示，比如div 自己占一行， 比如span 一行可以放很多个

元素模式  | 元素排列        | 设置样式        | 默认宽度     | 包含
----- | ----------- | ----------- | -------- | ------------
块级元素  | 一行只能放一个块级元素 | 可以设置宽度高度    | 容器的100%  | 容器级可以包含任何标签
行内元素  | 一行可以放多个行内元素 | 不可以直接设置宽度高度 | 它本身内容的宽度 | 容纳文本或则其他行内元素
行内块元素 | 一行放多个行内块元素  | 可以设置宽度和高度   | 它本身内容的宽度

#### 块级元素(block-level)

```
常见的块元素有<h1>~<h6>、<p>、<div>、<ul>、<ol>、<li>等，其中<div>标签是最典型的块元素。
```

（1）比较霸道，自己独占一行

（2）高度，宽度、外边距以及内边距都可以控制。

（3）宽度默认是容器（父级宽度）的100%

（4）是一个容器及盒子，里面可以放行内或者块级元素。

- 文字类块标签里面不能放其他块元素

#### 行内元素(inline-level)

```
常见的行内元素有<a>、<strong>、<b>、<em>、<i>、<del>、<s>、<ins>、<u>、<span>等，其中<span>标签最典型的行内元素。有的地方也成内联元素
```

（1）相邻行内元素在一行上，一行可以显示多个。

（2）高、宽直接设置是无效的。

（3）默认宽度就是它本身内容的宽度。

（4）**行内元素只能容纳文本或则其他行内元素。**

#### 行内块元素（inline-block）

```
在行内元素中有几个特殊的标签——<img />、<input />、<td>，可以对它们设置宽高和对齐属性，有些资料可能会称它们为行内块元素。
```

（1）和相邻行内元素（行内块）在一行上,但是之间会有空白缝隙。一行可以显示多个 （2）默认宽度就是它本身内容的宽度。 （3）高度，行高、外边距以及内边距都可以控制。

#### 标签显示模式转换 display

- 块转行内：display:inline;
- 行内转块：display:block;
- 块、行内元素转换为行内块： display: inline-block;

### 行高

![行高的测量](/assets/202339153741.png)

实现文本垂直居中：

- 如果 行高 等 高度  文字会 垂直居中
- 如果行高 大于 高度   文字会 偏下 
- 如果行高小于高度   文字会  偏上

### 正常流

- 依次排列，排不下了换行

正常流基础上，有 float 相关规则，使得一些盒占据了正常流需要的空间，可以把 float 理解为“文字环绕”

还有 vertical-align 相关规则规定了如何在垂直方向对齐盒

#### 原理

- 当遇到块级盒：排入块级格式化上下文（也就是会换行）
- 当遇到行内级盒或者文字：首先尝试排入行内级格式化上下文，如果排不下，那么创建一个行盒，先将行盒排版（行盒是块级，所以到第一种情况），行盒会创建一个行内级格式化上下文
- 遇到 float 盒：把盒的顶部跟当前行内级上下文上边缘对齐，然后根据 float 的方向把盒的对应边缘对到块级格式化上下文的边缘，之后重排当前行盒

#### 文字排版

![横向文字](/assets/20227516362.webp)

![纵向文字](/assets/202275163637.webp)

多数元素被当作长方形盒来排版，而只有 display 为 inline 的元素，是被拆成文本来排版的

#### 盒子模型

一个盒具有 margin、border、padding、width/height 等属性，它在主轴方向占据的空间是由对应方向的这几个属性之和决定的，而 vertical-align 属性决定了盒在交叉轴方向的位置，同时也会影响实际行高

![盒子模型](/assets/202339153612.gif)

##### 盒子边框（border）

```css
border : border-width || border-style || border-color
```

属性           |      作用
------------ | :----------:
border-width | 定义边框粗细，单位是px
border-style |    边框的样式
border-color |     边框颜色

边框写法总结：

上边框                  | 下边框                      | 左边框                   | 右边框
:------------------- | :----------------------- | :-------------------- | :---------------------
border-top-style:样式; | border-bottom-style:样式;  | border-left-style:样式; | border-right-style:样式;
border-top-width:宽度; | border- bottom-width:宽度; | border-left-width:宽度; | border-right-width:宽度;
border-top-color:颜色; | border- bottom-color:颜色; | border-left-color:颜色; | border-right-color:颜色;
border-top:宽度 样式 颜色; | border-bottom:宽度 样式 颜色;  | border-left:宽度 样式 颜色; | border-right:宽度 样式 颜色;

- 边框合并

```css
border-collapse:collapse;
```

##### 内边距（padding）

- padding属性用于设置内边距。 **是指 边框与内容之间的距离。**

属性             | 作用
-------------- | :---
padding-left   | 左内边距
padding-right  | 右内边距
padding-top    | 上内边距
padding-bottom | 下内边距

- 盒子会变大

简写：

值的个数 | 表达意思
---- | ------------------------------
1个值  | padding：上下左右内边距;
2个值  | padding: 上下内边距 左右内边距 ；
3个值  | padding：上内边距 左右内边距 下内边距；
4个值  | padding: 上内边距 右内边距 下内边距 左内边距 ；

内盒尺寸计算（元素实际大小）：

- 盒子的实际的大小 =  内容的宽度和高度 +  内边距   +  边框   
- Element Width = content width + padding + border 
- Element Height = content height + padding + border 

内边距产生的问题：

- 会撑大原来的盒子
  - 通过给设置了宽高的盒子，减去相应的内边距的值，维持盒子原有的大小
- 如果没有给一个盒子指定宽度， 此时，如果给这个盒子指定padding， 则不会撑开盒子。

##### 外边距（margin）

- margin属性用于设置外边距。  margin就是控制**盒子和盒子之间的距离**

| 属性          | 作用     |
| ------------- | :------- |
| margin-left   | 左外边距 |
| margin-right  | 右外边距 |
| margin-top    | 上外边距 |
| margin-bottom | 下外边距 |

margin值的简写 （复合写法）代表意思  跟 padding 完全相同。

块级盒子水平居中：

- 盒子必须指定了宽度（width）
- 然后就给**左右的外边距都设置为auto**

```css
div {
          width:600px;
          height: 500px;
          background-color: skyblue;
          margin: 0 auto;
} 
```

文字居中和盒子居中区别：

```css
text-align: center; /*  文字 行内元素 行内块元素水平居中 */
margin: 10px auto;  /* 块级盒子水平居中  左右margin 改为 auto 就可以了 上下margin都可以 */
```

插入图片和背景图片区别：

1. 插入图片 我们用的最多 比如产品展示类  移动位置只能靠盒模型 padding margin
2. 背景图片我们一般用于小图标背景 或者 超大背景图片  背景图片 只能通过  background-position

清除元素的默认内外边距：

```css
* {
   padding:0;         /* 清除内边距 */
   margin:0;          /* 清除外边距 */
}
```

外边距合并：

- 使用margin定义块元素的**垂直外边距**时，可能会出现外边距的合并。
-  嵌套块元素垂直外边距的合并（塌陷）
   - 可以为父元素定义上边框。
   - 可以为父元素定义上内边距
   - 可以为父元素添加overflow:hidden。

子元素将父元素拉了下来：

当为子元素指定margin-top时，父元素也被带下来了

解决这个问题的方式可以为父元素指定`overflow:auto`

##### 盒子模型布局稳定性

使用优先级：width >  padding  >   margin   

##### 圆角边框(CSS3)

```css
border-radius:length;  
```

##### 盒子阴影(CSS3)

```css
box-shadow:水平阴影 垂直阴影 模糊距离（虚实）  阴影尺寸（影子大小）  阴影颜色  内/外阴影；
```

### 定位

将盒子**定**在某一个**位**置 自由的漂浮在其他盒子(包括标准流和浮动)的上面

> 定位 = 定位模式 + 边偏移

#### 边偏移

边偏移属性    | 示例             | 描述
-------- | :------------- | --------------------------------
`top`    | `top: 80px`    | **顶端**偏移量，定义元素相对于其父元素**上边线的距离**。
`bottom` | `bottom: 80px` | **底部**偏移量，定义元素相对于其父元素**下边线的距离**。
`left`   | `left: 80px`   | **左侧**偏移量，定义元素相对于其父元素**左边线的距离**。
`right`  | `right: 80px`  | **右侧**偏移量，定义元素相对于其父元素**右边线的距离**

#### 定位模式

```css
选择器 { position: 属性值; }
```

值          |    语义
---------- | :------:
`static`   | **静态**定位
`relative` | **相对**定位
`absolute` | **绝对**定位
`fixed`    | **固定**定位

- 静态定位(static)：元素的默认定位方式
- 相对定位(relative)：是元素**相对**于它原来在标准流中的位置来说的，原来**在标准流的区域继续占有**，后面的盒子仍然以标准流的方式对待它
- 绝对定位(absolute)
  - **绝对定位**是元素以带有定位的父级元素来移动位置
  - **完全脱标** ---- 完全不占位置
  - **父元素没有定位**，则元素依据最近的已经定位（绝对、固定或相对定位）的父元素（祖先）进行定位

> **子绝父相** ---- **子级**是**绝对**定位，**父级**要用**相对**定位。

- 固定定位(fixed)
  - **完全脱标** ---- 完全不占位置
  - 只认**浏览器的可视窗口** ---- `浏览器可视窗口 + 边偏移属性` 来设置元素的位置
  - 不随滚动条滚动

#### 居中

> **绝对定位/固定定位的盒子**不能通过设置 `margin: auto` 设置**水平居中**。

1. `left: 50%;`：让**盒子的左侧**移动到**父级元素的水平中心位置**；
2. `margin-left: -100px;`：让盒子**向左**移动**自身宽度的一半**。

#### 堆叠顺序（z-index）

加了定位的盒子，默认**后来者居上**， 后面的盒子会压住前面的盒子

```css
selector {
    z-index: value;
}
```

**属性值**：**正整数**、**负整数**或 **0**，默认值是 0，数值越大，盒子越靠上

`z-index` 只能应用于**相对定位**、**绝对定位**和**固定定位**的元素，其他**标准流**、**浮动**和**静态定位**无效

#### 定位改变display属性

一个行内的盒子，如果加了**浮动**、**固定定位**和**绝对定位**，不用转换，就可以给这个盒子直接设置宽度和高度等

给盒子改为了浮动或者定位，就不会有垂直外边距合并的问题了

## 总结

定位模式         | 是否脱标占有位置   | 移动位置基准      | 模式转换（行内块） | 使用情况
------------ | ---------- | :---------- | --------- | ------------
静态static     | 不脱标，正常模式   | 正常模式        | 不能        | 几乎不用
相对定位relative | 不脱标，占有位置   | 相对自身位置移动    | 不能        | 基本单独使用
绝对定位absolute | 完全脱标，不占有位置 | 相对于定位父级移动位置 | 能         | 要和定位父级元素搭配使用
固定定位fixed    | 完全脱标，不占有位置 | 相对于浏览器移动位置  | 能         | 单独使用，不需要父级



### 浮动元素排版

对 float 的处理是先排入正常流，再移动到排版宽度的最左 / 最右（这里实际上是主轴的最前和最后）

元素的浮动是指**设置了浮动属性的元素**会

- 脱离标准普通流的控制
- 移动到指定位置

作用：

- **让多个盒子(div)水平排列成一行**，使得浮动成为布局的重要手段。
- 可以实现盒子的左右对齐等等..
- 浮动最早是用来**控制图片**，实现**文字环绕图片的效果**。

语法：

```css
选择器 { float: 属性值; }
```

属性值       | 描述
--------- | --------------
**none**  | 元素不浮动（**默认值**）
**left**  | 元素向**左**浮动
**right** | 元素向**右**浮动

特性：

`float` 属性会让盒子漂浮在标准流的上面,并且不占有原来位置

任何元素都可以浮动。浮动元素会生成一个块级框，生成的块级框和我们前面的行内块极其相似

使用浮动的核心目的----让多个块级盒子在同一行显示

特点 | 说明
-- | -------------------------------------------------
浮  | 加了浮动的盒子**是浮起来**的，漂浮在其他标准流盒子的上面。
漏  | 加了浮动的盒子**是不占位置的**，它原来的位置**漏给了标准流的盒子**。
特  | **特别注意**：浮动元素会改变display属性， 类似转换为了行内块，但是元素之间没有空白缝隙

扩展：

- 子盒子的浮动参照父盒子对齐
- 不会与父盒子的边框重叠，也不会超过父盒子的内边距
- 浮动只会影响当前的或者是后面的标准流盒子，不会影响前面的标准流

清除浮动：

父级盒子很多情况下，不方便给高度，但是子盒子浮动就不占有位置，最后父级盒子高度为0，导致排版出现问题

**清除浮动主要为了解决父级元素因为子级浮动引起内部高度为0 的问题。清除浮动之后， 父级就会根据浮动的子盒子自动检测高度。父级有了高度，就不会影响下面的标准流了**

```css
选择器{clear:属性值;}
```

属性值   | 描述
----- | ---------------------
left  | 不允许左侧有浮动元素（清除左侧浮动的影响）
right | 不允许右侧有浮动元素（清除右侧浮动的影响）
both  | 同时清除左右两侧浮动的影响

- 额外标签法

```html
<div class="left"></div>
<div class="right"></div>
<div style="clear: both;"></div>
```

- 父级添加overflow

- after伪元素

```css
 .clearfix:after {  content: ""; display: block; height: 0; clear: both; visibility: hidden;  }   

 .clearfix {*zoom: 1;}   /* IE6、7 专有 */
```

- 双伪元素

```css
.clearfix:before,.clearfix:after { 
  content:"";
  display:table; 
}
.clearfix:after {
 clear:both;
}
.clearfix {
  *zoom:1;
}
```

| 清除浮动的方式       | 优点               | 缺点                               |
| -------------------- | :----------------- | :--------------------------------- |
| 额外标签法（隔墙法） | 通俗易懂，书写方便 | 添加许多无意义的标签，结构化较差。 |
| 父级overflow:hidden; | 书写简单           | 溢出隐藏                           |
| 父级after伪元素      | 结构语义化正确     | 由于IE6-7不支持:after，兼容性问题  |
| 父级双伪元素         | 结构语义化正确     | 由于IE6-7不支持:after，兼容性问题  |

## 颜色

- RGB，符合光谱三原色理论：红、绿、蓝三种颜色的光可以构成所有的颜色，使用三个整数来表示
- RGBA： 是代表 Red（红色）、Green（绿色）、Blue（蓝色）和 Alpha 的色彩空间
- CMYK：在印刷行业，使用的就是这样的三原色（品红、黄、青）来调配油墨，这种颜色的表示法叫做 CMYK，它用一个四元组来表示颜色，三原色调配黑色，经济上是不划算的，所以印刷时会单独指定黑色
- HSL：用一个值来表示人类认知中的颜色，我们用专业的术语叫做色相（H）。加上颜色的纯度（S）和明度（L），就构成了一种颜色的表示

### 渐变

```css
/* 线性渐变 */
linear-gradient(direction, color-stop1, color-stop2, ...);
/* 放射性渐变 */
radial-gradient(shape size at position, start-color, ..., last-color);
```

## 字体样式

### 单位

- 绝对长度

单位 | 描述
-- | ------------------------
cm | 厘米
mm | 毫米
in | 英寸 (1in = 96px = 2.54cm)
px | 像素 (1px = 1/96th of 1in)
pt | 点 (1pt = 1/72 of 1in)
pc | 派卡 (1pc = 12 pt)

- 相对长度

单位   | 描述
---- | ----------------------------------------
em   | 相对于元素的字体大小（font-size）（2em 表示当前字体大小的 2 倍）
ex   | 相对于当前字体的 x-height(极少使用)
ch   | 相对于 "0"（零）的宽度
rem  | 相对于根元素的字体大小（font-size）
vw   | 相对于视口*宽度的 1%
vh   | 相对于视口*高度的 1%
vmin | 相对于视口*较小尺寸的 1％
vmax | 相对于视口*较大尺寸的 1％
%    | 相对于父元素

### 字体样式相关属性

属性          | 表示   | 注意点
:---------- | :--- | :----------------------------------------------
font-size   | 字号   | 我们通常用的单位是px 像素，一定要跟上单位
font-family | 字体   | 实际工作中按照团队约定来写字体
font-weight | 字体粗细 | 记住加粗是 700 或者 bold 不加粗 是 normal 或者 400 记住数字不要跟单位
font-style  | 字体样式 | 记住倾斜是 italic 不倾斜 是 normal 工作中我们最常用 normal
font        | 字体连写 | 1\. 字体连写是有顺序的 不能随意换位置 2\. 其中字号 和 字体 必须同时出现

- font-size:大小

```css
p {  
    font-size:20px; 
}
```

- font-family:字体

```css
p{ font-family:"微软雅黑";}
/* 可以同时指定多个字体，按从左到右选择 */
p{font-family: Arial,"Microsoft Yahei", "微软雅黑";}
```

CSS Unicode字体

```css
/* 表示设置字体为“微软雅黑”。 */
font-family: "\5FAE\8F6F\96C5\9ED1";
```

- font-weight:字体粗细

属性值     | 描述
------- | :--------------------------------------
normal  | 默认值（不加粗的）
bold    | 定义粗体（加粗的）
100~900 | 400 等同于 normal，而 700 等同于 bold 我们重点记住这句话

- font-style:字体风格

属性     | 作用
------ | :------------------------------------
normal | 默认值，浏览器会显示标准的字体样式 font-style: normal;
italic | 浏览器会显示斜体的字体样式。

- font:综合设置字体样式

```css
font: 加粗 字号/行高/ 字体
```

```css
font: 400 14px/24px "宋体";
```

### 字体外观相关属性

- 颜色

表示表示    | 属性值
:------ | :---------------------------
预定义的颜色值 | red，green，blue，还有我们的御用色 pink
十六进制    | #FF0000，#FF6600，#29D794
RGB代码   | rgb(255,0,0)或rgb(100%,0%,0%)

- color:文本颜色

- text-align:文本水平对齐方式

属性     |    解释
------ | :------:
left   | 左对齐（默认值）
right  |   右对齐
center |   居中对齐

- line-height:行间距

```css
/* 一般情况下，行距比字号大7.8像素左右就可以了。 */
line-height: 24px;
```

- text-indent:首行缩进

```css
/*首行缩进2个字  em  1个em 就是1个字的大小*/
text-indent: 2em;
```

- text-decoration 文本的装饰

值            | 描述
------------ | ---------------------------
none         | 默认。定义标准的文本。 取消下划线（最常用）
underline    | 定义文本下的一条线。下划线 也是我们链接自带的（常用）
overline     | 定义文本上的一条线。（不用）
line-through | 定义穿过文本下的一条线。（不常用）

## 背景

| 属性                  | 作用             | 值                                                           |
| --------------------- | :--------------- | :----------------------------------------------------------- |
| background-color      | 背景颜色         | 预定义的颜色值/十六进制/RGB代码                              |
| background-image      | 背景图片         | url(图片路径)                                                |
| background-repeat     | 是否平铺         | repeat/no-repeat/repeat-x/repeat-y                           |
| background-position   | 背景位置         | length/position    分别是x  和 y坐标， 切记 如果有 精确数值单位，则必须按照先X 后Y 的写法 |
| background-attachment | 背景固定还是滚动 | scroll/fixed                                                 |
| 背景简写              | 更简单           | 背景颜色 背景图片地址 背景平铺 背景滚动 背景位置;  他们没有顺序 |
| 背景透明              | 让盒子半透明     | background: rgba(0,0,0,0.3);   后面必须是 4个值              |

### 背景颜色

```css
/* 默认的值是 transparent  透明的 */
background-color:颜色值;
```

### 背景图片(image)

参数   | 作用
---- | ---------------
none | 无背景图（默认的）
url  | 使用绝对或相对地址指定背景图像

```css
background-image : url(images/demo.png);
```

### 背景平铺（repeat）

参数        | 作用
--------- | :-----------------
repeat    | 背景图像在纵向和横向上平铺（默认的）
no-repeat | 背景图像不平铺
repeat-x  | 背景图像在横向上平铺
repeat-y  | 背景图像在纵向平铺

### 背景位置(position)

```css
background-position : length || length
background-position : position || position
```

| 参数     | 值                                                           |
| -------- | :----------------------------------------------------------- |
| length   | 百分数 \| 由浮点数字和单位标识符组成的长度值                 |
| position | top \| center \| bottom \| left \| center \| right   方位名词 |

- 必须先指定background-image属性
- position 后面是x坐标和y坐标。 可以使用方位名词或者 精确单位。
- 如果指定两个值，两个值都是方位名字，则两个值前后顺序无关，比如left  top和top  left效果一致
- 如果只指定了一个方位名词，另一个值默认居中对齐。
- 如果position 后面是精确坐标， 那么第一个，肯定是 x  第二的一定是y
- 如果只指定一个数值,那该数值一定是x坐标，另一个默认垂直居中
- 如果指定的两个值是 精确单位和方位名字混合使用，则第一个值是x坐标，第二个值是y坐标

### 背景附着

```css
background-attachment : scroll | fixed 
```

| 参数   |           作用           |
| ------ | :----------------------: |
| scroll | 背景图像是随对象内容滚动 |
| fixed  |       背景图像固定       |

### 背景简写

```css
background: 背景颜色 背景图片地址 背景平铺 背景滚动 背景位置;
```

### 背景透明(CSS3)

```css
background: rgba(0, 0, 0, 0.3);
```

## 高级技巧

### 元素的显示与隐藏

#### display 显示

```css
/* 隐藏对象 */
display: none
```

- 特点： 隐藏之后，不再保留位置。

> 配合后面js做特效，比如下拉菜单，原先没有，鼠标经过，显示下拉菜单， 应用极为广泛

#### visibility 可见性

```css
/* 对象可视 */
visibility：visible ; 　
/* 对象隐藏 */
visibility：hidden;
```

- 特点： 隐藏之后，继续保留原有位置。

#### overflow 溢出

- 检索或设置当对象的内容超过其指定高度及宽度时如何管理内容

属性值         | 描述
----------- | ---------------------
**visible** | 不剪切内容也不添加滚动条
**hidden**  | 不显示超过对象尺寸的内容，超出的部分隐藏掉
**scroll**  | 不管超出内容否，总是显示滚动条
**auto**    | 超出自动显示滚动条，不超出不显示滚动条

应用：

1. 清除浮动
2. 隐藏超出内容，隐藏掉, 不允许内容超过父盒子。

### 总结

属性             | 区别          | 用途
-------------- | ----------- | -----------------------------------------
**display**    | 隐藏对象，不保留位置  | 配合后面js做特效，比如下拉菜单，原先没有，鼠标经过，显示下拉菜单， 应用极为广泛
**visibility** | 隐藏对象，保留位置   | 使用较少
**overflow**   | 只是隐藏超出大小的部分 | 1\. 可以清除浮动 2\. 保证盒子里面的内容不会超出该盒子范围

###  CSS用户界面样式

####  鼠标样式cursor

设置或检索在对象上移动的鼠标指针采用何种系统预定义的光标形状

```css
a:hover {
    cursor: value;
}
```

 | 属性值          | 描述       |
| --------------- | ---------- |
| **default**     | 小白  默认 |
| **pointer**     | 小手       |
| **move**        | 移动       |
| **text**        | 文本       |
| **not-allowed** | 禁止       |

#### 轮廓线 outline

```css
outline : outline-color ||outline-style || outline-width 
```

```css
outline : outline-color ||outline-style || outline-width 
```

一般都直接去掉:

```css
outline: 0;
outline: none;
```

#### 防止拖拽文本域resize

```html
<textarea  style="resize: none;"></textarea>
```

### vertical-align 垂直对齐

```css
vertical-align : baseline |top |middle |bottom 
```

vertical-align 不影响块级元素中的内容对齐，它只针对于**行内元素**或者**行内块元素**

行内块元素， **通常用来控制图片/表单与文字的对齐**

#### 图片、表单和文字对齐

![1498467742995](/assets/1498467742995.png)

#### 去除图片底侧空白缝隙

图片或者表单等行内块元素，他的底线会和父级盒子的基线对齐

- 给img vertical-align:middle | top| bottom等等。  让图片不要和基线对齐
- 给img 添加 display：block; 转换为块级元素就不会存在问题了

### 溢出的文字省略号显示

```css
/*1. 先强制一行内显示文本*/
    white-space: nowrap;
/*2. 超出的部分隐藏*/
    overflow: hidden;
/*3. 文字用省略号替代超出的部分*/
    text-overflow: ellipsis;
```

### CSS精灵技术（sprite) 

CSS 精灵其实是将网页中的一些背景图像整合到一张大图中（精灵图）

### 滑动门

![](/assets/202339153948.png)

### 扩展

#### margin负值

- 负边距+定位：水平垂直居中
- 压住盒子相邻边框
  - 需要添加浮动 

#### CSS三角

- 将盒子宽高设置为0，然后设置四个边框

```css
div {
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 20px;
            border-color: pink skyblue deepskyblue darkcyan;
}
```

---
tags: ['DSL', 'CSS']
---

## CSS3

### 选择器

#### 属性选择器

选择器                 | 描述
------------------- | ------------------
[attribute ]        | 用于选取带有指定属性的元素。
[attribute=value]   | 用于选取带有指定属性和值的元素。
[attribute~=value]  | 用于选取属性值中包含指定词汇的元素。
[attribute          | =value]            | 用于选取带有以指定值开头的属性值的元素，该值必须是整个单词。
[attribute^=valuel  | 匹配属性值以指定值开头的每个元素。
[attribute$ =value] | 匹配属性值以指定值结尾的每个元素。
[attribute* =value] | 匹配属性值中包含指定值的每个元素。

```css
input[type=search] {
  color: skyblue;
}
``` 

#### 结构伪类选择器

伪类元素选择器               | 说明
--------------------- | ----------------------------------------------------------------------
E:first-line          | 选择某标签中第一行的元素
E:first-letter        | 伪类选择器将某标签中第一行的元素首字符
E:before              | 伪类选择器:将某标签之前加入内容
E:after               | 伪类选择器将某标签之后加入内容
E:root                | 将样式绑定到页面根元素中
E:not                 | 对某个结构元素使用样式但想排除结构下的子结构元素
E:empty               | 指定当元素样式为空白时使用的样式
E.target              | 对页面中target元素指定样式此样式只在用户点击了页面中的链接，并且跳转到target元素后才生效
E:first-child         | 选择同级别此元素的第一个元素
E:last-child          | 选择同级别此元素的最后一个元素
E:nth-child           | 对元素中指定序号的子元素设置样式(正数)，:nth-child(n)/nth-child(odd/even) -奇/偶数
E:nth-last-child      | 对元素中指定序号的子元素设置样式(倒数)，nth-last- child(n)- nth-last-child(odd/even)-奇/偶数
E:nth-of-type(n)      | 与nth-childO作用类似，但是仅匹配使用同种标签的元素:
E:nth-last-of-type(n) | 与nth-last-child作用类似但是仅匹配使用同种标签的元素
E:nth-child(an+b)     | a表示每次循环中包括几张样式b表示指定的样式在循环中的所在位置
E:only-child          | 匹配父元素下仅有的一个子元素
E:only-of-type        | 匹配父元素 下使用同种标签的唯一个子元素
E:enable              | 匹配表单中激活的元素
E:disabled            | 匹配表单中禁用的元素
E:checked             | 匹配表单中被选中的radio(单选)或checkbox(复选)元素
E:selection           | 匹配用户当前选中的元素



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

### 2D转换

#### 2D转换translate

- x 就是 x 轴上水平移动
- y 就是 y 轴上水平移动

```css
transform: translate(x, y)
transform: translateX(n)
transfrom: translateY(n)
```

- `2D` 的移动主要是指 水平、垂直方向上的移动
- `translate` 最大的优点就是不影响其他元素的位置
- `translate` 中的100%单位，是相对于本身的宽度和高度来进行计算的
- 行内标签没有效果

#### 2D旋转rotate

`2D` 旋转指的是让元素在二维平面内顺时针或者逆时针旋转

```css
transform: rotate(度数) 
```

- rotate` 里面跟度数，单位是 `deg`
- 角度为正时，顺时针，角度为负时，逆时针
- 默认旋转的中心点是元素的中心点

#### 设置元素旋转中心点(transform-origin)

```css
transform-origin: x y;
```

- 注意后面的参数 x 和 y 用空格隔开
- x y 默认旋转的中心点是元素的中心 (50% 50%)，等价于 `center`  `center`
- 还可以给 x y 设置像素或者方位名词(`top`、`bottom`、`left`、`right`、`center`)

#### `2D` 转换之 `scale`

用来控制元素的放大与缩小

```css
transform: scale(x, y)
```

- 注意，x 与 y 之间使用逗号进行分隔
- `transform: scale(1, 1)`: 宽高都放大一倍，相当于没有放大
- `transform: scale(2, 2)`: 宽和高都放大了二倍
- `transform: scale(2)`: 如果只写了一个参数，第二个参数就和第一个参数一致
- `transform:scale(0.5, 0.5)`: 缩小
- `scale` 最大的优势：可以设置转换中心点缩放，默认以中心点缩放，而且不影响其他盒子

#### 综合写法

- 同时使用多个转换，其格式为 `transform: translate() rotate() scale()`
- 顺序会影响到转换的效果(先旋转会改变坐标轴方向)
- 但我们同时有位置或者其他属性的时候，要将位移放到最前面

### 动画

动画是 `CSS3` 中最具颠覆性的特征之一，可通过设置多个节点来精确的控制一个或者一组动画，从而实现复杂的动画效果

- 定义动画

```css
@keyframes motion {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(1000px);
    }
}
```

- 使用动画

```css
div {
    width: 200px;
    height: 200px;
    background-color: skyblue;
    animation: motion 5s;
}
```

- 0% 是动画的开始，100 % 是动画的完成，这样的规则就是动画序列
- 在 @keyframs 中规定某项 CSS 样式，就由创建当前样式逐渐改为新样式的动画效果
- 动画是使元素从一个样式逐渐变化为另一个样式的效果，可以改变任意多的样式任意多的次数
- 用百分比来规定变化发生的时间，或用 `from` 和 `to`，等同于 0% 和 100%

#### 场景属性

```css
div {
  width: 100px;
  height: 100px;
  background-color: aquamarine;
  /* 动画名称 */
  animation-name: move;
  /* 动画花费时长 */
  animation-duration: 2s;
  /* 动画速度曲线 */
  animation-timing-function: ease-in-out;
  /* 动画等待多长时间执行 */
  animation-delay: 2s;
  /* 规定动画播放次数 infinite: 无限循环 */
  animation-iteration-count: infinite;
  /* 是否逆行播放 */
  animation-direction: alternate;
  /* 动画结束之后的状态 */
  animation-fill-mode: forwards;
}
```

- 简写

```css
animation: name duration timing-function delay iteration-count direction fill-mode
```

- 简写属性里面不包含 `animation-paly-state`
- 暂停动画 `animation-paly-state: paused`; 经常和鼠标经过等其他配合使用
- 要想动画走回来，而不是直接调回来：`animation-direction: alternate`
- 盒子动画结束后，停在结束位置：`animation-fill-mode: forwards` 

#### 贝塞尔曲线

- 一种针对两个点之间变化的插值方法 k次贝塞尔曲线需要k+1个控制点

**牛顿积分**

### 3D转换

#### 三维坐标系

![202001170927](/assets/202001170927.gif)

#### 3D 移动 translate3d

```css
/* 注意：x, y, z 对应的值不能省略，不需要填写用 0 进行填充 */
transform: translate3d(x, y, z)
```

#### 透视 perspective

![202001170939](/assets/202001170939.png)

**透视需要写在被视察元素的父盒子上面**

```css
body {
  perspective: 1000px;
}
```

#### 3D 旋转rotate

>3D 旋转指可以让元素在三维平面内沿着 x 轴、y 轴、z 轴 或者自定义轴进行旋转

```css
transform: rotate3d(x, y, z, deg)
```

```css
rotateY
rotateX
rotateZ
/* 沿着对角线旋转 */
transform: rotate3d(1, 1, 0, 180deg)
```

#### 3D 呈现 transform-style

- 控制子元素是否开启三维立体环境
- `transform-style: flat`  代表子元素不开启 `3D` 立体空间，默认的
- `transform-style: preserve-3d` 子元素开启立体空间

### 浏览器私有前缀

- 火狐-moz-
- ie-ms-
- -webkit-
- -o-

## Less

Less 是一门 CSS 预处理语言，它扩展了 CSS 语言，增加了变量、Mixin、函数等特性，使 CSS 更易维护和扩展

### CSS弊端

- 冗余度高
- 没有计算能力
- 不方便维护扩展，不利于复用

### 安装

```shell
npm install -g less
```

### 使用

- 变量定义与使用

```less
// 必须有@为前缀
// 不能包含特殊字符
// 不能以数字开头
// 大小写敏感
@color: pink;

div {
    background-color: @color;
}
```

- 样式嵌套

```less
.header {
    width: 200px;
    a {
        color: white;
    }
}
// 如果遇见 （交集|伪类|伪元素选择器） ，利用&进行连接
.header {
    width: 200px;
    &:hover {
        color: white;
    }
}
```

- 运算

任何数字、颜色或者变量都可以参与运算。就是Less提供了加（+）、减（-）、乘（*）、除（/）算术运算

```less
@width: 10px + 5;
// 对颜色进行运算
div {
    border: @width solid red+2;
}
// 对宽度运算
div {
    width: (@width + 5) * 2;
}
```

对于两个不同的单位的值之间的运算，运算结果的值取第一个值的单位

## Bootstrap

响应式布局：

响应式需要一个父级做为布局容器，来配合子级元素来实现变化效果。

原理就是在不同屏幕下，通过媒体查询来改变这个布局容器的大小，再改变里面子元素的排列方式和大小，从而实现不同屏幕下，看到不同的页面布局和样式变化

### 布局容器

- container：两边留白

  - 响应式布局的容器 固定宽度
  - 大屏 ( >=1200px) 宽度定为 1170px
  - 中屏 ( >=992px) 宽度定为 970px
  - 小屏 ( >=768px) 宽度定为 750px
  - 超小屏 (100%)

- container-fluid

  - 百分百宽度
  - 占据全部视口（viewport）的容器

### 栅格系统

- 按照不同屏幕划分为1~12 等份
- 行（row） 可以去除父容器作用15px的边距
- xs-extra small：超小； sm-small：小； md-medium：中等； lg-large：大；
- 列（column）大于 12，多余的"列（column）"所在的元素将被作为一个整体另起一行排列
- 每一列默认有左右15像素的 padding
- 可以同时为一列指定多个设备的类名，以便划分不同份数 例如 class="col-md-4 col-sm-6"

栅格嵌套

```html
<!-- 列嵌套
简单理解就是一个列内再分成若干份小列
 -->
 <div class="col-sm-4">
    <div class="row">
         <div class="col-sm-6">小列</div>
         <div class="col-sm-6">小列</div>
    </div>
</div>
```

列偏移

```html
<div class="row">
    <div class="col-lg-4">1</div>
    <!-- 向右偏移四个列 -->
    <div class="col-lg-4 col-lg-offset-4">2</div>
</div>
```

列排序

```html
<!-- 列排序 -->
<div class="row">
    <!-- 向右移动8个单位 -->
    <div class="col-lg-4 col-lg-push-8">左侧</div>
    <!-- 向左移动4个单位 -->
    <div class="col-lg-8 col-lg-pull-4">右侧</div>
</div>
```

响应式工具

使用这些工具类可以方便的针对不同设备展示或隐藏页面内容

![202001220830](/assets/202001220830.jpg)

visible-* 可达到相反的效果

### [文档](https://v3.bootcss.com/)

