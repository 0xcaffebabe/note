# 转换

- jq -- > js : jq对象[索引] 或者 jq对象.get(索引)
- js -- > jq : $(js对象)

# 基本操作

## 事件绑定

```javascript
$("div").click(function () {
        alert("click");
});
```

## 入口函数

```javascript
$(function () {
    ....
});
```

window.onload 和 $(function) 区别

- window.onload 只能定义一次,如果定义多次，后边的会将前边的覆盖掉
- $(function)可以定义多次的。

## 样式控制

```javascript
$("div").css("color","red");
```

# 选择器

类型           | 语法                   | 作用
------------ | -------------------- | -------------------
标签选择器（元素选择器） | $("html标签名")         | 获得所有匹配标签名称的元素
ID选择器        | $("#id的属性值")         | 获得与指定id属性值匹配的元素
类选择器         | $(".class的属性值")      | 获得与指定的class属性值匹配的元素
并集选择器        | $("选择器1,选择器2....")   | 获取多个选择器选中的所有元素
后代选择器        | $("A B ")            | 选择A元素内部的所有B元素
子选择器         | $("A > B")           | 选择A元素内部的所有B子元素
属性名称选择器      | $("A[属性名]")          | 包含指定属性的选择器
属性选择器        | $("A[属性名='值']")      | 包含指定属性等于指定值的选择器
符合属性选择器      | $("A[属性名='值'][]...") | 包含多个属性条件的选择器
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

# DOM操作

## 内容操作

- html(): 获取/设置元素的标签体内容 `<a><font>内容</font></a> --> <font>内容</font>`
- text(): 获取/设置元素的标签体纯文本内容 `<a><font>内容</font></a> --> 内容`
- val()： 获取/设置元素的value属性值

## 属性操作

- attr(): 获取/设置元素的属性
- removeAttr():删除属性，如果操作的是元素自定义的属性，则建议使用attr
- prop():获取/设置元素的属性，如果操作的是元素的固有属性，则建议使用prop
- removeProp():删除属性
- addClass():添加class属性值
- removeClass():删除class属性值
- toggleClass():切换class属性
- css()

## 节点操作

- append():父元素将子元素追加到末尾

  - `对象1.append(对象2): 将对象2添加到对象1元素内部，并且在末尾`

- prepend():父元素将子元素追加到开头

  - 对象1.prepend(对象2):将对象2添加到对象1元素内部，并且在开头

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

- remove():移除元素

- empty():清空元素的所有后代元素

# 动画

参数：

- speed：动画的速度。三个预定义的值("slow","normal", "fast")或表示动画时长的毫秒数值(如：1000)
- easing：用来指定切换效果，默认是"swing"，可用参数"linear"

  - swing：动画执行时效果是 先慢，中间快，最后又慢
  - linear：动画执行时速度是匀速的

- fn：在动画完成时执行的函数，每个元素执行一次。

## 方法

### 默认

- show([speed,[easing],[fn]])
- hide([speed,[easing],[fn]])
- toggle([speed],[easing],[fn])

## 滑动

- slideDown([speed],[easing],[fn])
- slideUp([speed,[easing],[fn]])
- slideToggle([speed],[easing],[fn])

## 淡入淡出

- fadeIn([speed],[easing],[fn])
- fadeOut([speed],[easing],[fn])
- fadeToggle([speed,[easing],[fn]])

# 遍历

## jq对象.each(callback)

```javascript
$("div").each(function (i,e) {
        console.table(i,e);
});
```

- 如果当前function返回为false，则结束循环(break)。
- 如果当前function返回为true，则结束本次循环，继续下次循环(continue)

## $.each(object, [callback])

```javascript
$.each($("div"),function (i, e) {
        console.table(i,e);
    })
```

## for..of

_ES6语法_

```javascript
for (let i of $("div")){
        console.log(i);
    }
```

# 事件绑定

## 标准绑定

jq对象.事件方法(回调函数)，如果调用事件方法，不传递回调函数，则会触发浏览器默认行为。

## on/off

jq对象.on("事件名称",回调函数)

jq对象.off("事件名称")

- 如果off方法不传递任何参数，则将组件上的所有事件全部解绑

# 插件

