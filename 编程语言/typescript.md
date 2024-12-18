# typescript

- ES新规范支持
- IDE支持

## 类型

```ts
var myname: string = "cxk"; // 字符串
var alias: any = 1 // 可以是任何类型
var age: number = 13 // 数字类型
var gender: boolean = true // 布尔

function test(name: string): void { } // 函数参数以及函数返回值

// 自定义类型
class Person {
    name: string
    age: number
}
// 创建对象
var cxk = new Person()
cxk.name = "cxk"
cxk.age = 18
```

## 参数

- 默认值

```ts
function test(a: string = "default") { }
```

- 可选参数

```ts
// 调用函数test时，可不传递b
function test(a: string,b?: string) { }
```

- 不定项参数

```ts
function test(...args) { }
```

## 函数

- generator

```ts
function* test() { 
    console.log("start");
    yield;
    console.log("finish");
}
var f1 = test();
f1.next();//输出start
f1.next(); // 输出 finish
```

- 解构

```ts
function test() {
    return {
        pname: 'cxk',
        age: 18
    }
}
const {pname,age} = test()
```

- 箭头函数

### 安全链式调用

```ts
return person?.name?.firstName; // 等价于 person && person.name && person.name.firstName
```

```ts
person.name!; // 强制name属性不为空
```

```ts
name? :string; // 可选属性
```

## for

- for of

```ts
for (let n of arr) {
    // 可以用在数组、字符串、对象
}
```

## 面向对象

```ts
class Person {
    name;
    run() {
        
    }
}
const p1 = new Person()
p1.name = "cxk1"
const p2 = new Person()
p2.name="cxk2"
```

### 权限控制

```ts
private run() {
        
}
```

### 泛型

```ts
const list: Array<String> = []
list[0]="1" // 只能存放string
```

### 接口

```ts
interface Runnable {
    run();
}
class Thread implements Runnable {
    run () {}
}
```

## 模块

- 暴露

```ts
export var prop1;

export function data () {
  console.log('data')
}

export class Thread{
  run():void{
    console.log('run')
  }
}
```

- 引入使用

```ts
import {data} from './module1'
data()
```