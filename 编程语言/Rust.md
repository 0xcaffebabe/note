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
