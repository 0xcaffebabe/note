# let命令

所声明的变量，只在let命令所在的代码块内有效

```javascript
{
  let a = 10;
  var b = 1;
}

a // ReferenceError: a is not defined.
b // 1
```

# const 命令

声明一个只读的常量。一旦声明，常量的值就不能改变。

```javascript
const PI = 3.1415;
PI // 3.1415

PI = 3;
// TypeError: Assignment to constant variable.
```

# 解构赋值

- 数组

```js
let [a, b, c] = [1, 2, 3];
// a=1 b=2 c=3
```

- 对象

```js
let {name,age} = {name:"123",age:15}
// name = 123 age = 15
```

# 箭头函数

```js
let add = (a,b) => a+b;
```

# map和reduce

```js
let arr1 = ['1','2','3'];
let arr2 = arr1.map(i => parseInt(i));
// arr2 = [1, 2, 3]
```

```js
let ret = arr2.reduce((i,j)=>i+j);
// ret = 6
```

