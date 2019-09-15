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

```js
let [a, b, c] = [1, 2, 3];
// a=1 b=2 c=3
```

