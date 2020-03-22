# ES6

## let

所声明的变量，只在let命令所在的代码块内有效

```javascript
{
  let a = 10; // 暂时性死区
  var b = 1;
}

b = 1 // 1
a = 1 // ReferenceError: a is not defined.
```

- 不存在变量提升

```javascript
console.log(a); //  Cannot access 'a' before initialization
let a = 20;
```

## const

声明一个只读的常量。一旦声明，常量的值就不能改变。

- 具有块级作用域

```javascript
{
    const PI = 3;
}
console.log(PI); // PI is not defined
```

- 声明时必须赋值

```javascript
const PI; // Missing initializer in const declaration
```

- 不能重新赋值

```javascript
const PI = 3.1415;
PI = 3; // TypeError: Assignment to constant variable.
```

## var、let、const

var    | let     | const
------ | ------- | -------
函数级作用域 | 块级作用域   | 块级作用域
变量提升   | 不存在变量提升 | 不存在变量提升
值可更改   | 值可更改    | 值不可更改

## 模板字符串

```javascript
let name = "cxk"
// 模板字符串中可以解析变量
console.log(`your name is ${name}`)
```

```js
const fn = ()=>'fn function ';
// 模板字符串可以调用函数
let text = `fn call: ${fn()}`;
```

```javascript
// 模板字符串可以换行
let info =`123
456
789`
```

## 解构赋值

解构赋值就是把数据结构分解，然后给变量进行赋值

如果解构不成功，变量跟数值个数不匹配的时候，变量的值为undefined

- 数组

```javascript
let [a, b, c] = [1, 2, 3];
// a=1 b=2 c=3
```

```javascript
const color = [1,2]
const color2=[...color,3,4]
// color2 = [1,2,3,4],同样能用于对象
```

- 对象

```javascript
let {name,age} = {name:"123",age:15}
// name = "123" age = 15
let {name:myName,age:myAge} = {name:"123",age:15}
// myName = "123" myAge = 15
```

## 函数默认值

```javascript
function a(a = 2){
    console.log(a);
}
```

## 剩余参数

```js
function f(...args){
  console.log(args); // [1,2,3,4]
}
f(1,2,3,4);
```

## 箭头函数

```javascript
// 函数体中只有一句代码，且代码的执行结果就是返回值，可以省略大括号
let sum = (a,b) => a+b;
// 如果形参只有一个，可以省略小括号
let f = res => res.data;
```

```js
// 箭头函数不绑定this关键字，箭头函数中的this，指向的是函数定义位置的上下文this
var obj = {
    f: () => {
        console.log(this); // Window
    }
}
obj.f();
```

## Array新增方法

### Arrat.from

```js
//定义一个集合
let arrayLike = {
    '0': 'a',
    '1': 'b',
    '2': 'c',
    length: 3
}; 
//转成数组
let arr2 = Array.from(arrayLike); // ['a', 'b', 'c']
 let arrayLike = { 
     "0": 1,
     "1": 2,
     "length": 2
 }
 let newAry = Array.from(arrayLike, item => item *2)//[2,4]
```

### Array实例方法:find

```js
[1,2,3].find(i=>i/2==1) // 2
```

### Array实例方法:findIndex

```js
[1,2,3].findIndex(i=>i/2==1) // 1
```

### Array实例方法:includes

```js
[1,2,3].includes(4) // false
```

## String新增方法

### 实例方法:startsWith,endsWith

```js
'javascript'.startsWith('java') // true
'javascript'.endsWith('script') // true
```

### 实例方法:repeat

```js
'x'.repeat(3) // xxx
```

## 数据结构Set

ES6 提供了新的数据结构  Set。它类似于数组，但是成员的值都是唯一的，没有重复的值

```js
const set = new Set([1,2,3,4,4]) // set = {1,2,3,4}
```

### 一些方法

```js
set.add(1); // 添加元素
set.delete(1) // 删除元素
set.has(1) // 判断是否有这个元素
set.clear() // 清空集合
set.forEach(v => console.log(v))
```

