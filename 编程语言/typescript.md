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