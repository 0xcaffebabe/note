# let

所声明的变量，只在let命令所在的代码块内有效

```javascript
{
  let a = 10;
  var b = 1;
}

a // ReferenceError: a is not defined.
b // 1
```

# const

声明一个只读的常量。一旦声明，常量的值就不能改变。

```javascript
const PI = 3.1415;
PI // 3.1415

PI = 3;
// TypeError: Assignment to constant variable.
```

# 模板字符串

```js
let name = "cxk"
console.log(`your name is ${name}`)
```

```js
let info =`123
456
789`
```

# 解构赋值

- 数组

```js
let [a, b, c] = [1, 2, 3];
// a=1 b=2 c=3
```

```js
const color = [1,2]
const color2=[...color,3,4]
// color2 = [1,2,3,4],同样能用于对象
```

- 对象

```js
let {name,age} = {name:"123",age:15}
// name = 123 age = 15
```

# 函数默认值

```js
function a(a = 2){
    console.log(a);
}
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

# 模块导入导出

```js
import { stat, exists, readFile } from 'fs';
```

```js
export { firstName, lastName, year };
export function multiply(x, y) {
  return x * y;
};
```

# Promise

- 解决异步编程问题

Promise 是一个对象，它代表了一个异步操作的最终完成或者失败

```js
var promise1 = new Promise(function(resolve, reject) {
  setTimeout(function() {
    resolve('foo');
  }, 300);
});

promise1.then(function(value) {
  console.log(value);
  // expected output: "foo"
});
```

