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
