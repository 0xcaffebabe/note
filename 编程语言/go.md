# go

- 静态类型、编译型
- 支持两种范式
- 特点
  - 原生并发支持

## 概念

### package

- 基本的分发单位、依赖关系的体现
- 每个源码文件都必须声明package
- 要生成可执行程序，必须要有main的package，并且还需要有main函数
- 同一个路径下只能存在一个package

### 源码文件

- 命令源码文件、库源码文件
- 测试源码文件

## 命令行工具

- go build 编译
- go run 编译并运行
- go get获取远程代码包

## 语法

- 注释

```go
// single row
/*
multi row
*/
```

- 基础结构

```go
package main // 程序所属包
import "fmt" // 导入依赖包
const NAME = "cxk" // 常量定义
type myInt int // 一般类型声明
// 结构体声明
type user struct { }
// 接口声明
type UserService interface { }
// 入口函数
func main(){
  var a = "cxk"
  fmt.Println(a+NAME)
}
```