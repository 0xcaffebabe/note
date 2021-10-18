# Rust

- cargo 项目管理工具
  - new
  - build
  - check

第一个程序:

```rust
fn main(){
  println!("hello world");
}
```

## 变量

```rust
const MAX: u32 = 100; // 常量定义
fn main() {
    println!("MAX = {}", MAX);
    //变量定义
    let a = 1;
    let b: u32 = 1; // 显式指定类型
    println!("a = {}", a);
    println!("b = {}", b);

    // b = 2; 编译报错：不能对不可变变量赋值两次
    let mut c: u32 = 2; // 声明可变变量
    c = 3;
    println!("c = {}", c);
    
    let a: f32 = 1.1; // 变量隐藏（变量遮蔽）
    println!("a = {}", a);
}
```

## 数据类型

```rust
fn main() {
    let success: bool = true; // 布尔类型
    println!("success: {}", success);
    let name = '菜'; // char是32位的
    println!("{}", name);
    // 数字类型：i8,i16,i32,i64 u8 u32 u64 f32 f64
    let i: i8 = 127;
    println!("{}", i);
    // 自适应类型：取决于平台 isize usize
    println!("{} {}", isize::max_value(), usize::max_value());
    // 数组定义 数组长度也是数组类型的一部分（长度不同 类型不同？）
    let arr: [u32; 5] = [1, 2, 3, 4, 5];
    println!("{}", arr[0]);
    // print(arr); 编译错误：长度不匹配

    // 元组
    let person: (i32, char) = (18, '张');
    println!("{} {}", person.0, person.1);
    let person = (18, '张');
    println!("{} {}", person.0, person.1);
    let (age, name) = person; // 解构
    println!("{} {}", name, age);

}
fn print(arr:[u32;3]){}
```

## 函数

```rust
fn say_hello(name: char) -> i32{
    println!("hello, {}", name);
    return 0;
}
fn add() -> i32{
    //  语句执行一些操作 但没有返回值 例如let x= 1
    // 表达式会返回一些值 如a+b 表达式就可以不加return直接返回
    0 // 这样也可以返回
}
fn main() {
    println!("{}", say_hello('你'));
    println!("{}", add());
}
```

## 控制流

```rust
fn main() {
    let x = 0;
    if x == 0 {
        println!("0");
    }else if x == 1{
        println!("1");
    }else {
        println!("unknow");
    }
    // 在let语句中使用if 两个分支的返回值需要为同一类型
    let name = if x == 0 {
        '陈'
    }else {
        '田'
    };
    println!("{}", name);
    let mut i = 0;
    loop {
        if i >= 10 {
            break;
        }
        println!("{}", i);
        i = i + 1;
    }
    // loop 带返回值
    let res = loop {
        if i >= 30 {
            break i * 2;
        }
        i = i+1;
    };
    println!("{}", res);
    // while循环
    while i != 0 {
        i -=1;
    };
    // for循环遍历数组
    let arr:[u32; 5] = [1,2 ,3, 4, 5];
    for i in arr.iter() {
        println!("{}", i);
    }
}
```

## 所有权

Rust 通过所有权机制管理内存 编译器会根据所有权规则对内存的使用进行检查

- 堆栈

编译时大小固定在栈 否则在堆上

- String的内存回收

String类型在离开作用域的时候回调用drop方法

```rust
let s1 = String::from("hello");
    let s2 =s1; // -- value moved here 所有权转移 s1无效了
    println!("{}", s2);
    // println!("{}", s1); // 无法打印
}
```

- deep clone

```rust
// 需要类型实现clone trait
let s3 = s2.clone();
println!("{}", s3);
```

- copy

```rust
// 需要类型实现copy trait
// 基本类型+元组都实现了copy trait
let x = 1;
let y = x; // 栈上复制
println!("{} {}", x, y); // 正常使用y
```

## 引用

![20201228204829](/assets/20201228204829.svg)

```rust
// 使用引用并不拥有这个值 离开这个作用域后也不会被丢弃
fn length(s: &String) -> usize{
    s.len()
}
fn modify_str(s: &mut String) {
    s.push_str("kkk");
}
fn main() {
    let s = String::from("jntm");
    println!("{}", length(&s));
    println!("{}", s); // 仍然能继续使用

    let mut s1 = String::from("jntm");
    modify_str(&mut s1); // 引用不能直接修改值 使用借用（借用的变量必须为 mut）

    let mut s = String::from("jntm");
    let r1 = &s;
    let r2 = &mut s;
    // 在任意时候 只能出现一个可变引用 运行多个不可变引用
    //println!("{} {}", r1 ,r2); // 不允许引用后出现借用

}
```

## slice

```rust
fn main() {
    let s = String::from("disa");
    println!("{}", &s[0..2]);
    println!("{}", &s[0..=2]);
    println!("{}", &s[..=2]); // 默认从0开始
    // println!("{}", "你好"[..1]); // 索引要注意UTF8字节边界 切片是基于字节的
    // 其他类型的slice
    let a = [1, 2, 3, 4];
    println!("{}", &a[1..2][0]);
}
```

## 结构体

```rust
fn main() {
    // 定义
    #[derive(Debug)] // 加了这个可以打印
    struct User {
        name: String,
        age: u8,
    }
    // 创建
    let mut cxk = User {name: String::from("cxk"), age: 18};
    println!("{:?}", cxk); // 打印
    // 修改
    cxk.age = 24;
    // 字段名与参数名同名简写
    let name = String::from("bili");
    let age = 15;
    let bili = User {name, age};
    // 从其他结构体创建
    let jame = User{name: String::from("jame"), ..cxk};
    // 匿名参数结构体
    struct Point(i32, i32);
    let p = Point(5, 5);
    println!("{} {}", p.0, p.1);
    // 空结构体
    struct Null{};
}
```

### 方法

```rust
struct Dog {
    name: String
}
impl Dog {
    fn bark(&self) -> &Dog{
        println!("{} wolf wolf", self.name);
        &self
    }
}
fn main() {
    let dog = Dog{name: String::from("boy")};
    dog.bark();
}
```

## 枚举与匹配

```rust
enum MsgInfo {
    ERROR, SUCCESS, UNKNOW
}
impl MsgInfo {
    // 匹配
    fn print(&self) {
        match *self {
            MsgInfo::ERROR => println!("error"),
            MsgInfo::SUCCESS => println!("success"),
            _ => println!("unknow")
        }
    }
}
fn main() {
    struct Response {
        status: MsgInfo,
        msg: String
    }
    let response = Response {status: MsgInfo::SUCCESS, msg: String::from("成功")};
    // 官方推荐的定义方式
    enum Ip {
        V4(u8,u8,u8,u8),
        V6(String)
    }
    let ip = Ip::V4(127,0,0,1);

}
```

### Option

标准库定义的枚举

```rust
fn main() {
    let some_number: Option<i32> = Some(5);
    let null_str: Option<String> = None;
    // 打印some里面的值
    match some_number {
        Some(i) => println!("{}", i),
        _ => {},
    }
    match incr(some_number){
        None => {},
        Some(x) => println!("{}", x)
    }
    // 使用if处理
    if let Some(value) = incr(some_number) {
        println!("{}", value);
    }
}
fn incr(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(x) => Some(x + 1)
    }
}
```

## Vector

```rust
let mut v: Vec<i32> = Vec::new();
v.push(1);
let v = vec![1, 2, 3]; // 创建带有初始值的vector
println!("{}", &v[0]); // 引用访问
match v.get(1) { // match访问
    Some(value) => println!("{}", value),
    None => {}
}
let mut v = Vec::new();
v.push(1);v.push(2);v.push(3);
// 不可变遍历
for i in &v {
    println!("{}", i);
}
// 可变遍历
for i in &mut v {
    *i += 1; // 对每个值加1
}
```

## 字符串

```rust
let mut s = String::new(); // 空字符串
s.push_str("hello "); // 更新
let s = String::from("init"); // 字面量
let mut s = "123".to_string();
let ss = "123".to_string();
s.push_str(&ss);
println!("{}", ss); // 仍然可以使用
s.push('m'); // push 只能添加字符
let s1 = String::from("hello");
let s2 = String::from(" world");
let s3 = s1 + &s2; // 字符串合并 s1不能再使用
let str = format!("{} {}", s2, s3); // 字符串格式化
let length = "你好".to_string().len(); // 编码为utf8 长度为6
for c in str.chars() { // 遍历
    println!("{}", c);
}
for b in str.bytes() {
    println!("{}", b);
}
```

## HashMap

```rust
use std::collections::HashMap;
fn main() {
    let mut map = HashMap::new();
    map.insert("name", "cxk");

    // 使用两个vector创建hashmap
    let keys = vec!["name","age"];
    let values = vec!["cxk","18"];
    let map:HashMap<_,_> = keys.iter().zip(values.iter()).collect();

    let mut map:HashMap<String,String> = HashMap::new();
    map.insert(String::from("name"), String::from("cxk"));
    map.insert(String::from("age"), String::from("18"));
    // 读取元素
    match map.get(&String::from("name")) {
        Some(v) => println!("{}", v),
        None => {}
    }
    // 遍历元素
    for (k,v) in &map {
        println!("{} {}",k,v);
    }

    // putIfAbsent
    map.entry(String::from("name")).or_insert(String::from("kd"));
}
```

## 模块

- 创建模块

```sh
cargo new --lib mylib
```

- 在mylib/src创建factory.rs

```rust
mod factory {
  pub mod socket_produder {
      pub fn new_socket(){
          println!("socket new");
      }
  }

  mod log_producer {
      fn new_log(){
          println!("log new");
      }
  }
}
```

-lib.rs导出

```rust
pub mod factory;
```

- main.rs引用

```toml
[dependencies]
mylib = {path = "./mylib"}
```

```rust
use mylib::factory::socket_produder;
```
