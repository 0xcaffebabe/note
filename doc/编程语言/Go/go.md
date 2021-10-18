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

```go
const name = "cxk"
const age int = 18
const (
	habbit1 = "sing"
	habbit2 = "rap"
)
```

常量可以使用内置表达式定义,例如: len()，unsafe.Sizeof()等 ;
常量范围目前只支持布尔型、数字型(整数型、浮点型和复数)和字符串型;

### 特殊常量iota

- iota在const关键字出现时将被重置为0
- const中每新增一行常量 声明将使iota计数自增1次

```go
const a = iota
const b = iota

const (
	c = iota
	d = iota
)
func main(){
	fmt.Println(a,b) // 0 0
	fmt.Println(c,d) // 0 1
}
```

- iota常见使用法:


1)跳值使用法;

```go
const (
	c = iota
	_ = iota
	d = iota
)
func main(){
	fmt.Println(c,d) // 0 2
}
```

2)插队使用法;

```go
const (
	c = iota
	d = 3
	e = iota
)
func main(){
	fmt.Println(c,d,e) // 0 3 2
}
```

3 )表达式隐式使用法;

```go
const (
	c = iota *2
	d // 没有指定值，默认会继承之前的表达式
	e
)
func main(){
	fmt.Println(c,d,e) // 0 2 4
}
```

4)单行使用法;

```go
const (
	a ,b = iota,iota+3
	c,d
)
func main(){
	fmt.Println(a,b,c,d) // 0 3 1 4
}
```

## 运算符

```go
a := 1
b := 2
a++ // ++运算符只能这样用
println(a)
b-- // --运算符只能这样用
println(b)
```

## 控制语句

- 条件控制

```go
a := 0
if a>=1 {
	println("true")
}else if a <= 0 {
	println("false")
}
```

- 选择语句

```go
a := 10
switch a {
case 1:
	{
		println("1")
	}
case 2:
	{
		println("2")
	}
default:
	{
		println("default")
	}
}
```

- 循环语句

```go
// 死循环
for {
	println("run")
	time.Sleep(1*time.Second)
}
// 经典for循环
for i:=1;i<10;i++ {
	println("run",i)
}
// foreach
a := []string{"cxk", "jntm"}
for key, value := range a {
	println(key, value)
}
```

- goto

```go
if true {
	goto label2
}else {
	goto label1
}
label1:
	println("label1")
label2:
	println("label2")
```

- break

```go
a := []string{"cxk", "jntm"}
for key, value := range a {
	println(key, value)
	if key == 0 {
		break
	}
}
```

## 内建方法

### make

```go
// slice类似于数组
slice := make([]string,3)
slice[0] = "cxk"
slice[1] = "cxk2"
slice[2] = "cxk3"
for k,v := range slice {
	println(k,v)
}
println("---")
// map
aMap := make(map[string]string,3)
aMap["a"]="1"
aMap["b"]="2"
for k,v := range aMap {
	println(k,v)
}
println("---")
// channel 类似缓冲区
aChan := make(chan int,3)
close(aChan)
```

### new

```go
// 返回一个指针
aMap := new(map[string]string)
fmt.Println(reflect.TypeOf(aMap)) // *map[string]string
```

### append & copy & delete

```go
slice :=make ([]string,2)
slice[0]="1"
slice[1]="2"
slice = append(slice,"3")
fmt.Println(slice) // 1 2 3
```

```go
slice1 :=make ([]string,2)
slice1[0]="1"
slice1[1]="2"
slice2 :=make([]string,2)
copy(slice2,slice1)
fmt.Println(slice2) // 1 2
```

```go
aMap := make(map[string]string)
aMap["1"]="a"
aMap["2"]="b"
delete(aMap,"1")
fmt.Println(aMap) // 2:b
```

### 异常

```go
func main() {
	defer func() {
		// 异常处理
		msg := recover()
		fmt.Println("msg:",msg)
	}()
	// 抛出异常
	panic("异常")
}
```

### len && cap && close

```go
slice := make([]int,3,5)
println(len(slice)) // 3
println(cap(slice)) // 5

aChan := make(chan int,1)
aChan <- 1
close(aChan)
```

## 结构体

```go
// 定义结构体
type Person struct {
	Name string
	Age int
}
func main(){
	var p Person // 声明结构体变量
	p.Age = 18 // 结构体成员赋值
	p1 := Person{Name: "cxk"} // 另外一种方式
	p2 := new(Person) // 返回一个Person指针
	p.Name = "cxk"
	fmt.Println(p)
}
```

### 属性及函数

- 两种作用域，大写开头为公开，小写开头为私有

```go
// 定义Person的一个公开成员方法
func (p *Person)Say(){
	fmt.Println("person say")
}
```

### 组合

```go
type Animal struct {
	Type string
}
type Dog struct {
	Animal // 组合animal，Dog继承Animal的属性
	Name string
}
```

## 并发

- 协程

```go
func main(){
	go run()
	go run()
	time.Sleep(time.Second*5)
}
func run(){
	for i:=1;i<10;i++ {
		time.Sleep(time.Millisecond*2)
		print(i)
	}
	println()
}
```

- 协程通讯

```go
var chanInt = make(chan int,10)
func main(){
	go send()
	go receive()
	time.Sleep(5*time.Second)
}

func send(){
	chanInt <- 1
	chanInt <- 2
	chanInt <- 3
}

func receive(){
	num := <- chanInt
	fmt.Println(num)
	num = <- chanInt
	fmt.Println(num)
	num = <- chanInt
	fmt.Println(num)
}
```

- 使用select

```go
var chanInt = make(chan int,10)
var chan1 = make(chan int,10)

func send(){
	for i:=0;i<10;i++ {
		chanInt <- i
		chan1 <- i*i
	}
}

func receive(){
	for {
		select {
		case num := <- chanInt:
			fmt.Println(num)
		case num := <- chan1:
			fmt.Println(num)
		}
	}
}
```

select可以随机在多个channel中取数据

- 同步

```go
func main(){
	makeFood(10)
	go eatFood(10)
	waitGroup.Wait()
}
var waitGroup sync.WaitGroup
func makeFood(i int){
	for j:=0;j<i;j++ {
		waitGroup.Add(1)
		fmt.Println("make food",j)
	}
}
func eatFood(i int){
	for j:=0;j<i;j++ {
		fmt.Println("eat food",j)
		waitGroup.Done() // countdown
	}
}
```

## 指针

```go
i:=20
var pi *int=&i // pi指向i
fmt.Println(*pi) // 读取pi所指向的内容
fmt.Println(pi == nil) // 判断是否为空

a,b :=1,2
pa := [...]*int{&a,&b} // 指针数组(元素为指针的数组)
fmt.Println(pa)

arr := [...]int{1,2,3}
ap := &arr // 数组指针（指向一个数组的指针）
fmt.Println(ap)
```

## json

- 序列化

```go
setting := Setting{Menu:"menu",Count: 15}
byte,err:=json.Marshal(setting)
if err!=nil {
	fmt.Println(err)
}else {
	fmt.Println(string(byte))
}
```

- tag

```go
type Setting struct {
	Menu string `json:"menu"` // 指定序列后的字段名字
	Count int
}
```

- 反序列化

```go
str := "{\"menu\":\"menu\",\"Count\":15}\n"
var setting Setting
err := json.Unmarshal([]byte(str),&setting)
if err != nil {
	fmt.Println(err)
}else {
	fmt.Println(setting)
}
```

## module

- 初始化项目

```sh
go mod init
```

- 输出项目依赖

```sh
go mod graph
```