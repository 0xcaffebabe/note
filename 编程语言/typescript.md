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