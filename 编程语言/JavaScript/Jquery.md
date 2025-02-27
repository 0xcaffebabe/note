# jQuery

j就是 JavaScript；Query 查询； 意思就是查询js，把js中的DOM操作做了封装

**版本介绍**

1x ：兼容 IE 678 等低版本浏览器， 官网不再更新

2x ：不兼容 IE 678 等低版本浏览器， 官网不再更新

3x ：不兼容 IE 678 等低版本浏览器， 是官方主要更新维护的版本

## 基本操作

### 入口函数

```javascript
$(function () {
    ....
});
```

不同于原生 js 中的 load 事件是等页面文档、外部的 js 文件、css文件、图片加载完毕才执行内部代码

window.onload 和 $(function) 区别

- window.onload 只能定义一次,如果定义多次，后边的会将前边的覆盖掉
- $(function)可以定义多次的。

### jQuery中的顶级对象$

$是 jQuery 的别称，在代码中可以使用 jQuery 代替

$是jQuery的顶级对象，相当于原生JavaScript中的 window

1. 用原生 JS 获取来的对象就是 DOM 对象
2. jQuery 方法获取的元素就是 jQuery 对象。
3. jQuery 对象本质是： 利用$对DOM 对象包装后产生的对象（伪数组形式存储）

4. jq对象 -- > dom对象 : `jq对象[索引]` 或者 `jq对象.get(索引)`

```javascript
var domObject1 = $('div')[0]
var domObject2 = $('div').get(0)
```

- dom对象 -- > jq对象 : `$(js对象)`

```javascript
var jQueryObject = $(box);
```

## 事件绑定

```javascript
$("div").click(function () {
    alert("click");
});
```

## 选择器

类型           | 语法                   | 作用
------------ | -------------------- | -------------------
-            | 基础选择器                | -
标签选择器（元素选择器） | $("html标签名")         | 获得所有匹配标签名称的元素
ID选择器        | $("#id的属性值")         | 获得与指定id属性值匹配的元素
类选择器         | $(".class的属性值")      | 获得与指定的class属性值匹配的元素
并集选择器        | $("选择器1,选择器2....")   | 获取多个选择器选中的所有元素
交集选择器        | $("li.current")      | 交集元素
-            | 层级选择器                | -
后代选择器        | $("A B ")            | 选择A元素内部的所有B元素
子选择器         | $("A > B")           | 选择A元素内部的所有B子元素
-            | 属性选择器                | -
属性名称选择器      | $("A[属性名]")          | 包含指定属性的选择器
属性选择器        | $("A[属性名='值']")      | 包含指定属性等于指定值的选择器
符合属性选择器      | $("A[属性名='值'][]...") | 包含多个属性条件的选择器
-            | 筛选选择器                | -
过滤选择器        | :first               | 获得选择的元素中的第一个元素
尾选择器         | :last                | 获得选择的元素中的最后一个元素
非元素选择器       | :not(selector)       | 不包括指定内容的元素
偶数选择器        | :even                | 偶数，从 0 开始计数
奇数选择器        | :odd                 | 奇数，从 0 开始计数
等于索引选择器      | :eq(index)           | 指定索引元素
大于索引选择器      | :gt(index)           | 大于指定索引元素
小于索引选择器      | :lt(index)           | 小于指定索引元素
标题选择器        | :header              | 获得标题（h1~h6）元素，固定写法
可用元素选择器      | :enabled             | 获得可用元素
不可用元素选择器     | :disabled            | 获得不可用元素
选中选择器        | :checked             | 获得单选/复选框选中的元素
选中选择器        | :selected            | 获得下拉框选中的元素

一些节点选择的辅助方法：

![202002231554](/assets/202002231554.png)

- 隐式迭代

```javascript
$('div').hide();  // 页面中所有的div全部隐藏，不用循环操作
```

## 样式控制

- 修改简单元素样式

```javascript
// 1.参数只写属性名，则是返回属性值
var strColor = $(this).css('color');
// 2.  参数是属性名，属性值，逗号分隔，是设置一组样式，属性必须加引号，值如果是数字可以不用跟单位和引号
$(this).css("color", "red");
// 3.  参数可以是对象形式，方便设置多组样式。属性名和属性值用冒号隔开， 属性可以不用加引号
$(this).css({ "color":"white","font-size":"20px"});
```

- 设置类样式

原生 JS 中 className 会覆盖元素原先里面的类名，jQuery 里面类操作只是对指定类进行操作，不影响原先的类名

```js
// 1.添加类
$("div").addClass("current");
// 2.删除类
$("div").removeClass("current");
// 3.切换类
$("div").toggleClass("current");
```

## DOM操作

### 内容操作

- html(): 获取/设置元素的标签体内容

```html
<a><font>内容</font></a>
```
```js
$("a").html(); // <font>内容</font>
```

- text(): 获取/设置元素的标签体纯文本内容

```html
<a><font>内容</font></a>
```
```js
$("a").text(); // 内容
```

- val()： 获取/设置元素的value属性值

### 属性操作

- attr(): 获取/设置元素的属性(只能操作自定义属性)

```js
var link = $("div").prop('index'); // 获取自定义属性
$("div").prop('index','xx'); // 设置自定义属性
```

- removeAttr():删除属性，如果操作的是元素自定义的属性，则建议使用attr
- prop():获取/设置元素的属性（只能操作固有属性）

```js
var link = $("div").prop('href'); // 获取属性
$("div").prop('href','xx'); // 设置属性
```

- removeProp():删除自定义属性
- 数据缓存 data()，可以在指定的元素上存取数据，并不会修改 DOM 元素结构

```js
$("div").data("key","value") //向元素添加数据
$("div").data("key") //获取添加的数据
```

## 节点操作

- append():父元素将子元素追加到末尾

  - `对象1.append(对象2): 将对象2添加到对象1元素内部，并且在末尾`

- prepend():父元素将子元素追加到开头

  - 对象1.prepend(对象2):将对象2添加到对象1元素内部，并且在开头
- after():添加在目标元素后面
- before():添加在目标元素前面
- appendTo():

  - `对象1.appendTo(对象2):将对象1添加到对象2内部，并且在末尾`

- prependTo():

  - `对象1.prependTo(对象2):将对象1添加到对象2内部，并且在开头`

- after():添加元素到元素后边

  - `对象1.after(对象2)： 将对象2添加到对象1后边。对象1和对象2是兄弟关系`

- before():添加元素到元素前边

  - `对象1.before(对象2)： 将对象2添加到对象1前边。对象1和对象2是兄弟关系`

- insertAfter()

  - `对象1.insertAfter(对象2)：将对象2添加到对象1后边。对象1和对象2是兄弟关系`

- insertBefore()

  - `对象1.insertBefore(对象2)： 将对象2添加到对象1前边。对象1和对象2是兄弟关系`

- remove():移除元素（自身）

- empty():清空元素的所有后代元素

## 动画

参数：

- speed：动画的速度。三个预定义的值("slow","normal", "fast")或表示动画时长的毫秒数值(如：1000)
- easing：用来指定切换效果，默认是"swing"，可用参数"linear"

  - swing：动画执行时效果是 先慢，中间快，最后又慢
  - linear：动画执行时速度是匀速的

- fn：在动画完成时执行的函数，每个元素执行一次。

### 显示隐藏

- show([speed,[easing],[fn]]) 显示
- hide([speed,[easing],[fn]]) 引擎
- toggle([speed],[easing],[fn]) 切换

### 滑入滑出

- slideDown([speed],[easing],[fn]) 下拉
- slideUp([speed,[easing],[fn]]) 上拉
- slideToggle([speed],[easing],[fn]) 切换

### 淡入淡出

- fadeIn([speed],[easing],[fn]) 
- fadeOut([speed],[easing],[fn])
- fadeToggle([speed,[easing],[fn]])
- fadeTo([speed],opacity,[easing],[fn])

### 自定义动画

- animate(params,[speed],[easing],[fn])

params代表要变化的css样式

```js
$("div").animate({height:200})
```

### 动画排队

动画或者效果一旦触发就会执行，如果多次触发，就造成多个动画或者效果排队执行

- stop() 写到动画或者效果的前面， 相当于停止结束上一次的动画

## 元素操作

### 遍历

- jq对象.each(callback)

```javascript
$("div").each(function (index,element) {
    console.table(index,element);
});
```

回调方法传入的element是dom元素

如果当前function返回为false，则结束循环(break)。

如果当前function返回为true，则结束本次循环，继续下次循环(continue)

- $.each(object, [callback])

```javascript
$.each($("div"),function (i, e) {
    console.table(i,e);
})
```

- for..of

_ES6语法_

```javascript
for (let i of $("div")){
  console.log(i);
}
```

## 事件

### 事件绑定

#### 标准绑定

jq对象.事件方法(回调函数)，如果调用事件方法，不传递回调函数，则会触发浏览器默认行为。

#### on绑定

```js
jq对象.on("事件名称",回调函数)
```

或者
```js
  jq对象.on({
  事件1:处理函数,
  事件2:处理函数
})
```

```js
// 事件触发一次后失效
jq对象.one('click',fn)
```

#### 事件委托

```js
$("div").on("click","p",function(){
  // 将子元素发生的事件委托给父元素，这样就可以实现给动态创建的元素创建点击事件
  alert('p元素触发');
})
```

#### 事件解绑

```js
// 解绑某个事件
jq对象.off("事件名称")
// 解绑所有事件
jq对象.off()
// 解绑事件委托
jq对象.off('click','a')
```

#### 事件触发

```js
jq对象.trigger("click")
// 不会触发元素的默认行为（比如input focus之后会光标闪烁，使用这个方法光标就不会闪烁）
jq对象.triggerHandler("click")
```

### 事件对象

与DOM中的event基本一致

## 对象拷贝

```js
$.extend([deep],target,sourceObject,[sourceObjectN])
```

## 多库共存

```js
// 让jquery 释放对$ 控制权 让用自己决定
var $x = jQuery.noConflict();
```

## 尺寸和位置操作

- 尺寸

```js
// width height 获取或者设置
$("div").width();
// innerWidth innerHeight 包含padding
$("div").outerWidth();
// outerWidth outerHeight 包含padding、border,加上参数true就包含margin
$("div").outerWidth();
```

- 位置

```js
// 绝对定位的偏移
$("div").offset()
// 设置
$("div").offset({
  top:0,
  left:0
})

// 获取相对于父级定位盒子的偏移,只能获取不能设置
$("div").position()

// 设置或者获取被卷去的头部
$("div").scrollTop()
// 设置或者获取被卷去的左部
$("div").scrollLeft()
```