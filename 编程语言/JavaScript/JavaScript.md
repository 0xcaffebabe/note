# 与html结合方式

- 内部js
- 外部js

# 注释

# 数据类型

## 原始数据类型

- number
- string
- null
- undefined

## 引用数据类型

# 变量

```javascript
var a = 5;
```

- typeof

# 运算符

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

# JS特殊语法

# 流程控制语句

- if..else...
- switch
- while
- do...while
- for

# 基本对象

## Function

```javascript
function f(x){
    ...
}

var f = function(){
    ...
}
```

## Array

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

## Date

- [常用方法](https://www.w3school.com.cn/jsref/jsref_obj_date.asp)

## Math

- [常用方法](https://www.w3school.com.cn/jsref/jsref_obj_math.asp)

## Gloal

- encodeURI
- decodeURI
- encodeURIComponent:编码范围更广

- parseInt

- isNaN

- eval

# 立即执行函数

```javascript
(
    function(){
        //...
    }
)()
```

## window

## 方法

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

# 动画函数封装

> 核心原理：通过定时器 setInterval() 不断移动盒子位置。

- 利用 JS 是一门动态语言，可以很方便的给当前对象添加属性来将定时器添加到对象中

## 缓动效果

- 核心算法： (目标值 - 现在的位置) / 10 做为每次移动的距离步长

## 动函数添加回调函数

回调函数原理：函数可以作为一个参数。将这个函数作为参数传到另一个函数里面，当那个函数执行完之后，再执行传进去的这个函数，这个过程就叫做回调

## 完整代码

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

# JSON

## 语法

- 数据在名称/值对中：json数据是由键值对构成的
- 数据由逗号分隔：多个键值对由逗号分隔
- 花括号保存对象：使用{}定义json 格式
- 方括号保存数组：[]

## 获取数据

- json对象.键名
- json对象["键名"]
- 数组对象[索引]

## 转换

```javascript
JSON.stringify({username:'name'}) // to text
JSON.parse(str) // to obj
```

## 后端解析

- 常见的解析器：Jsonlib，Gson，fastjson，jackson

# 移动端常用插件

- Swiper 插件：轮播图插件
- lsuperslide：常用特效插件
- l iscroll：平滑滚动
- zy.media.js：移动端视频插件

# 移动端常用框架

- bootstrap

# 本地存储

## 特性

1、数据存储在用户浏览器中

2、设置、读取方便、甚至页面刷新不丢失数据

3、容量较大，sessionStorage约5M、localStorage约20M

4、只能存储字符串，可以将对象JSON.stringify() 编码后

## sessionStorage

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

## localStorage

- 生命周期永久，除非手动删除
- 多窗口共享

使用方式同sessionStorage
