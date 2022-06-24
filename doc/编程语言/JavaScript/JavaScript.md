# JavaScript

## 类型

### Undefined 

该类型表示未定义，它的类型只有一个值，就是 undefined，由于undefined是一个全局变量，并非是一个关键字, 所以部分编程规范要求用 void 0 代替 undefined

```js
undefined = 2
```

在ES5之前的时候，undefined是可以被赋值的。在现代浏览器当中已经把undefined设置为一个non-configurable, non-writable属性的值了

### Null

类型也只有一个值，就是 null，它的语义表示空值

### Boolean
### String

用于表示文本数据。String 有最大长度是 2^53 - 1，字符串的操作 charAt、charCodeAt、length 等方法针对的都是 UTF16 编码

### Number

有 18437736874454810627(即 2^64-2^53+3) 个值

几个例外情况：

1. NaN，占用了 9007199254740990，这原本是符合 IEEE 规则的数字
2. Infinity，无穷大；
3. -Infinity，负无穷大

有效的整数范围是 -0x1fffffffffffff 至 0x1fffffffffffff，所以 Number 无法精确表示此范围外的整数

对于浮点数的比较要注意浮点数的特点：

```js
// 误差是否在精度值之内
Math.abs(0.1 + 0.2 - 0.3) <= Number.EPSILON
```

### Symbol

是一切非字符串的对象 key 的集合

```js
o[Symbol.iterator] = function() {
  var v = 0 
  return { 
    next: function() {
       return { value: v++, done: v > 10 } 
    } 
  } 
};
```

### Object

## 变量

```javascript
var a = 5;
```

- typeof

### 类型转换

JavaScript 中的“ == ”运算，因为试图实现跨类型的比较，它的规则复杂到几乎没人可以记住，某些规范强制要求使用 ===

#### 字符串转数值

parseInt默认只支持 16 进制前缀“0x”，而且会忽略非数字字符，也不支持科学计数法当传入第二个参数，可以解析：

```js
parseInt("1e3", 30)
```

而 parseFloat 则直接把原字符串作为十进制来解析，它不会引入任何的其他进制

#### 装拆箱

```js
// 使用内置的 Object 函数，我们可以在 JavaScript 代码中显式调用装箱能力
Object(1)
```

拆箱转换会尝试调用 valueOf 和 toString 来获得拆箱后的基本类型。如果 valueOf 和 toString 都不存在，或者没有返回基本类型，则会产生类型错误 TypeError

### 运算符

- 一元运算符

  ```javascript
  ++ -- + -
  ```

- 算术运算符

  ```javascript
  + - * / % ...
  ```

- 赋值运算符

  ```javascript
  = += -+....
  ```

- 比较运算符

  ```javascript
  > < >= <= == ===
  ```

- 逻辑运算符

  ```javascript
  && || !
  ```

  - 其他对象转boolean

    - number：0或NaN为假，其他为真
    - string：除了空字符串("")，其他都是true
    - null&undefined:都是false
    - 对象：所有对象都为true

- 三元运算符

## JS特殊语法

### 分号自动插入

JS的语句若没有分号，会按照以下规则插入分号：

1. 要有换行符，且下一个符号是不符合语法的，那么就尝试插入分号。
2. 有换行符，且语法中规定此处不能有换行符，那么就自动插入分号。
3. 源代码结束处，不能形成完整的脚本或者模块结构，那么就自动插入分号

#### no LineTerminator here 规则

- 带标签的continue语句,不能在continue后插入换行
- 带标签的break语句,不能在break后插入换行
- return后不能插入换行
- 后自增、后自减运算符前不能插入换行
- throw和Exception之间不能插入换行
- 凡是async关键字,后面都不能插入换行
- 箭头函数的箭头前,也不能插入换行
- yield之后,不能插入换行

#### 一些不加分号容易出错的情况

1. 以括号开头

```js
(function(a){
   console.log(a);
})()/*这里没有被自动插入分号*/
(function(a){
  console.log(a);
})()
```

2. 以数组开头

```js
var a = [[]]/*这里没有被自动插入分号*/
[3, 2, 1, 0].forEach(e => console.log(e))
```

3. 以正则表达式开头

```js
var x = 1, g = {test:()=>0}, b = 1/*这里没有被自动插入分号*/
/(a)/g.test("abc")
console.log(RegExp.$1)
```

4. 以Template开头

```js
var f = function(){
  return "";
}
var g = f/*这里没有被自动插入分号*/
`Template`.match(/(a)/);
console.log(RegExp.$1)
```

### 指令序言

```js
"no lint";
"use strict";
function doSth(){
    //......
}
//......
```

## 流程控制语句

- if..else...
- switch
- while
- do...while
- for

## 基本对象

### Function

```javascript
function f(x){
    ...
}

var f = function(){
    ...
}
```

### Array

- 创建

```javascript
new Array(元素列表);
new Array(长度);
[1,2,3,4];
```

- 特点

  - 元素类型可变
  - 长度可变

- 方法

  - join：拼接成字符串
  - push

### Date

- [常用方法](https://www.w3school.com.cn/jsref/jsref_obj_date.asp)

### Math

- [常用方法](https://www.w3school.com.cn/jsref/jsref_obj_math.asp)

### Gloal

- encodeURI
- decodeURI
- encodeURIComponent:编码范围更广

- parseInt

- isNaN

- eval

## 立即执行函数

```javascript
(
    function(){
        //...
    }
)()
```

### window

### 方法

与弹出框有关的方法：

- alert() 显示带有一段消息和一个确认按钮的警告框。
- confirm() 显示带有一段消息以及确认按钮和取消按钮的对话框。

  - 如果用户点击确定按钮，则方法返回true
  - 如果用户点击取消按钮，则方法返回false

- prompt() 显示可提示用户输入的对话框。

  - 返回值：获取用户输入的值

与打开关闭有关的方法：

- close() 关闭浏览器窗口。

  - 谁调用我 ，我关谁

- open() 打开一个新的浏览器窗口

  - 返回新的Window对象

## 动画函数封装

> 核心原理：通过定时器 setInterval() 不断移动盒子位置。

- 利用 JS 是一门动态语言，可以很方便的给当前对象添加属性来将定时器添加到对象中

### 缓动效果

- 核心算法： (目标值 - 现在的位置) / 10 做为每次移动的距离步长

### 动函数添加回调函数

回调函数原理：函数可以作为一个参数。将这个函数作为参数传到另一个函数里面，当那个函数执行完之后，再执行传进去的这个函数，这个过程就叫做回调

### 完整代码

```javascript
function animate(obj,target,callback){
    clearInterval(obj.timer);
    obj.timer = setInterval(() => {
        var step = Math.ceil((target - obj.offsetLeft)/10);
        if (obj.offsetLeft >= target){
            clearInterval(obj.timer);
            callback();
        }
        obj.style.left = obj.offsetLeft + step + 'px';
    }, 15);
}
```

## JSON

### 语法

- 数据在名称/值对中：json数据是由键值对构成的
- 数据由逗号分隔：多个键值对由逗号分隔
- 花括号保存对象：使用{}定义json 格式
- 方括号保存数组：[]

### 获取数据

- json对象.键名
- json对象["键名"]
- 数组对象[索引]

### 转换

```javascript
JSON.stringify({username:'name'}) // to text
JSON.parse(str) // to obj
```

### 后端解析

- 常见的解析器：Jsonlib，Gson，fastjson，jackson

## 移动端常用插件

- Swiper 插件：轮播图插件
- lsuperslide：常用特效插件
- l iscroll：平滑滚动
- zy.media.js：移动端视频插件

## 移动端常用框架

- bootstrap

## 本地存储

### 特性

1、数据存储在用户浏览器中

2、设置、读取方便、甚至页面刷新不丢失数据

3、容量较大，sessionStorage约5M、localStorage约20M

4、只能存储字符串，可以将对象JSON.stringify() 编码后

### sessionStorage

1、生命周期为关闭浏览器窗口

2、在同一个窗口(页面)下数据可以共享

3、以键值对的形式存储使用

```js
// 存储
sessionStorage.setItem(key, value);
// 获取
sessionStorage.getItem(key);
// 删除
sessionStorage.removeItem(key);
// 清除所有
sessionStorage.clear();
```

### localStorage

- 生命周期永久，除非手动删除
- 多窗口共享

使用方式同sessionStorage
