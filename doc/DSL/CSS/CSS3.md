
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

##### 场景属性

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

## 3D转换

### 三维坐标系

![202001170927](/assets/202001170927.gif)

### 3D 移动 translate3d

```css
/* 注意：x, y, z 对应的值不能省略，不需要填写用 0 进行填充 */
transform: translate3d(x, y, z)
```

### 透视 perspective

![202001170939](/assets/202001170939.png)

**透视需要写在被视察元素的父盒子上面**

```css
body {
  perspective: 1000px;
}
```

### 3D 旋转rotate

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

### 3D 呈现 transform-style

- 控制子元素是否开启三维立体环境
- `transform-style: flat`  代表子元素不开启 `3D` 立体空间，默认的
- `transform-style: preserve-3d` 子元素开启立体空间

## 浏览器私有前缀

- 火狐-moz-
- ie-ms-
- -webkit-
- -o-

