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

## RegExp

[参考资料](https://www.w3school.com.cn/js/jsref_obj_regexp.asp)

- 创建

```javascript
var reg = new RegExp("正则表达式");
var reg = /正则表达式/;
```

- 使用

```javascript
reg.test('some text');
```

## Gloal

- encodeURI
- decodeURI
- encodeURIComponent:编码范围更广

- parseInt

- isNaN

- eval

# BOM

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



### 属性

## navigator

## screen

## history

## location

- forward
- back


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

```js
JSON.stringify({username:'name'}) // to text
JSON.parse(str) // to obj
```

## 后端解析

- 常见的解析器：Jsonlib，Gson，fastjson，jackson





