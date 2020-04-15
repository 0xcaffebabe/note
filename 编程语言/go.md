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

### import

- 不能导入源码中没有使用的package

```go
// 另外一种语法
import ( 
  "fmt"
  "time"
)
```

#### 原理

- 如果一个main导入其他包,包将被顺序导入;
- 如果导入的包中依赖其它包(包B) ,会首先导入B包,然后初始化B包中常量和变量,最后如果B包中有init ,会自动执行init() ;
- 所有包导入完成后才会对main中常量和变量进行初始化,然后执行main中的init函数(如果存在) , 最后执行main函数;
- 如果一个包被导入多次则该包只会被导入一次;

![批注 2020-04-14 155821](/assets/批注%202020-04-14%20155821.png)

#### 别名

- 别名操作的含义是:将导入的包命名为另- -个容易记忆的别名;

```go
import pk "awesomeProject/pkg1"

pk.F()
```

- 点(.)操作的含义是:点(.)标识的包导入后,调用该包中函数时可以省略前缀包名;

```go
import . "awesomeProject/pkg1"

F()
```

- 下划线(_ )操作的含义是:导入该包,但不导入整个包,而是执行该包中的init函数,因此无法通过包名来调用包中的其他函数。使用下划线(_ ) 操作往往是为了注册包里的引擎,让外部可以方便地使用;

```go
import _ "awesomeProject/pkg1"
```

### 数据类型

- 数值类型,字符串类型和布尔型;
- 派生类型;

```go
var i uint32 = 2
fmt.Println(unsafe.Sizeof(i)) // 4
var i1 int = 2
fmt.Println(unsafe.Sizeof(i1)) // 8
var i2 float32 = 1.0
fmt.Println(unsafe.Sizeof(i2)) // 4
var i3 bool = true
fmt.Println(unsafe.Sizeof(i3)) // 1
var i4 byte = 1
fmt.Println(unsafe.Sizeof(i4)) // 1
```

![批注 2020-04-14 190812](/assets/批注%202020-04-14%20190812.png)

## 变量

- 变量的声明格式: var <变量名称> [变量类型]
- 变量的赋值格式: <变量名称> = <值 ,表达式,函数等>
- 声明和赋值同时进行: var <变量名称> [变量类型]= <值 ,表达式，函数等>
- 分组声明格式:

```go
var(
i int
j float32
name string
)
```

- 同一行声明多个变量和赋值

```go
var a, b, c int = 1,2,3
// 或者
var a,b,c = 1,2,3
// 省略var
a,b,c := 1,2,3
```

- 全局变量的声明必须使用var关键词，局部变量则可以省略

```go
var a=1
func main(){
	b:=2
	fmt.Println(a,b)
}
```

- 特殊变量下划线 ”_”

```go
var _ = 2
// 无法使用_
```

- Go中不存在隐式转换,类型转换必须是显式的;

```go
var a =1
var b  = float32(a)
```

- 类型转换只能发生在两种兼容类型之间;

- 大写字母开头的变量是可导出的,也就是其它包可以读取的,是公用变量;
- 小写字母开头的就是不可导出的,是私有变量。

```go
// pkg1
func F1(){}

func f1(){}

// main
func main(){
	pkg1.F1()
	//pkg1.f1() 无法访问
}
```

## 常量

显式: const identifier [type] = value
隐式: const identifier = value ( 通常叫无类型常量)

常量可以使用内置表达式定义,例如: len()，unsafe.Sizeof(等 ;
常量范围目前只支持布尔型、数字型(整数型、浮点型和复数)和字符串型;