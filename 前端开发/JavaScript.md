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
