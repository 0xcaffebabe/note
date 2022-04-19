# Swift

## 变量常量与基本类型

```swift
// 常量
let pi = 3.14
// 变量
var i = 1, j = 2
// 显式变量类型
var url: String = "www.baidu.com"

// 整型 取决于机器字长
print(Int.max)
// 无符号整型
print(UInt.max)
// 8位整型
print(Int8.max)

// 浮点数
let x: Float = 3.1415926
let y: Double = 3.155645
print(x, y)

// 不支持隐式转换
print(x+Float(y))

// 元组
var property: (String, Int, (Int, Int, Int)) = ("cxk", 18, (35, 35, 35))
print(property)
print(property.0)
print(property.1)
// 解构
let (name, age, quake) = property
// 解构忽略部分属性
let (name1, age1, _) = property
print(name, age, quake)
// 命名元组属性
var point: (x: Int, y: Int) = (1,2)
var point1 = (x:1, y: 2)
print("the point: \(point), point1: \(point1)")
```

## 运算符

基本的数值逻辑运算符操作跟 Java 一样, 但在 Swift3 之后 ++ -- 已被废弃

=== 与 !== 用来比较对象的引用

### 常量的首次赋值

```swift
let i: Int
var condition = false
if condition {
    i = 1
}else {
    i = 2
}
```

### 范围运算符

```swift
let a = 0..<10 // 前闭后开（0-9）
print(a)
// 前闭后闭（1-10）
for index in 1...10 {
    print(index)
    // 循环里的index是常量
    // index += 1
}

```

## 控制流

### 循环

- for 循环

```swift
// 忽略下标
for _ in 1...10 {
    print("gogogo")
}
```

- while 循环

```swift
var i = 1
// i的后面一定要有空格
while i <= 10 {
    print(i)
    i += 2
}

```

- do-while循环

```swift
var j = 1
repeat {
    print(j)
    j += 2
}while(j <= 10)
```

### 选择

- if 同类C语言

- switch

```swift
// 每条case之间不用加break
var rank = "a"
switch rank {
// 同时case多个条件
case "a", "A":
    print("jn")
case "b":
    print("d")
default:
    print("defa")
// 空语句
//default:break
//default:()
}

// switch与范围
switch 5 {
case 1...5:
    print("1-5")
case 6...10:
    print("6-10")
default:()
}
// switch与元组
let response = (200, "OK")
switch response {
case(200, "OK"):
    print("done")
case(200, "GOON"):
    print("continue")
default:()
}
// 在case中解构变量
switch (0,0) {
case(let x, 0):
    print("x is \(x)")
case (0, let y):
    print("y is \(y)")
default:()
}
// 继续往下执行
switch 5 {
case 5:
    print("5")
    // 不会判断下面的case是否满足条件 无脑执行
    fallthrough
case 6:
    print("6")
default:()
}
```

### 控制转移

```swift
// 跳出多重循环
outter:
for index in 1...10{
    for index1 in 1...10 {
        if (index == 3 && index1 == 3) {
                print("i got go")
                break outter
        }
    }
}
```

### where

```swift
// where类似于SQL中的where 是一种条件限定
switch (3,3){
case let(x,y) where x == y:
    print("x == y")
case let(x,y):
    ()
}

for case let index in 1...10 where index % 3 == 0 {
    print(index)
}
```

### guard

```swift
// 防御式编程的语义化
// 只有满足条件才不会进入代码块
guard num >= 1 else {
    print("stop")
    exit(0)
}
```

## 字符串

### 基础

```swift
// 判断是否是空字符串
print(str.isEmpty)
// 插值表达式
print("name: \(str)")

// 字符串拼接 转义字符等同类C语言
```

### char与unicode

```swift
// 显式声明单个字符（底层采用unicode存储）
let single: Character = "中"
let single1: Character = "🐶"
// 遍历字符
for c in "中文大萨达🇨🇳" {
    print(c)
}
// 字符串是可变的
str.append("jntm")
print(str)

// 字符串长度
print(str.count)

```

### 索引

- 挺难用的

```swift
// 字符串索引
// [startIndex, endIndedx)
var s = "我如果付费"
// 需要根据startIndex 或者endIndex 计算
print(s[s.index(s.startIndex, offsetBy: 2)]) // 果 在第一个索引往后的2个
print(s[s.index(before: s.endIndex)]) // 费 在最后一个索引之前的一个
```

### 方法

```swift
print(s.uppercased())
print(s.lowercased())
print(s.capitalized) // 将每个单词转为首字母大写
print(s.contains("如果"))
print(s.hasPrefix("我 "))
print(s.hasSuffix("费"))
```

### NSString

```swift
print(NSString(format: "%.2f", 1.0 / 3.0) as String)
// 截取
print(NSString("微分去问问").substring(with: NSMakeRange(1, 3)))
// 替换两边的字符
print(NSString("-a-").trimmingCharacters(in: CharacterSet(charactersIn: "-")))
```

## 可选型

```swift
var responseCode : Int? = 404
var responseMessage: String? = "success"
responseCode = nil
```

### 解包

```swift
// 强制解包
print(responseCode!)
// 在判断中解包
if let responseCode = responseCode {
    // 这里出现了变量遮蔽
    print(responseCode)
}
// 同时判断解包多个
if let responseCode = responseCode,
   let responseMessage = responseMessage {
    print(responseCode, responseMessage)
}
```

### 可选型链

```swift
if let responseMessage = responseMessage {
    print(responseMessage.uppercased)
}
// 等同于
print(responseMessage?.uppercased)

// 如果是 nil 则 message 的值 为 message null
let message = responseMessage ?? "message null"
```

### 在类库中的使用

```swift
// 类型转换 如果转换失败 就返回 nil
if let age = Int("18"), age <= 18 {
    print(age)
}
```

### 隐式可选型

```swift
// 一般用在类中 初始化时为空 当初始化完成 保证对外提供的不为 nil
var a: String! = nil
// a = "hello"
// 执行错误
print(a + "dsds")
```

## 数组

### 声明

```swift
var nums = [0,1,2,3]

// 指定类型
var strings: [String] = ["0","2", "a"]

// 空数组
var es : Array<Int> = []
var es1 = [Int]()

// 5个元素初始值 全为5
var allZeros = [Int](repeating: 5, count: 5)
```

### 基本操作

```java
print(allZeros.count)
print(allZeros.isEmpty)
// 数组越界会有运行异常
print(allZeros[3])
print(allZeros.first!, allZeros.last!)
print(nums.min()!, nums.max()!)

// 子数组 1,2,3
print(nums[1..<4])
print(nums.contains(3))
print(nums.firstIndex(of: 3)!)

// for-each
for number in nums {
    print(number)
}
// 带下标的for-each
for (index, item) in strings.enumerated() {
    print(index, item)
}

// 值比较
print(nums == [0,1,2,3])
```

### 修改

```swift
es.append("jntm")
// 添加两个元素到数组里面
es += ["cxk", "juki"]
// 插入后位于索引2
es.insert("ctrl", at: 2)
es.removeLast()
es.removeFirst()
// 删除指定下标
es.remove(at: 1)
es.removeAll()

nums[0] = 3
// 区间设置值
nums[0...2] = [9,9,9]
// 两边长度可以不一致
nums[0...2] = [7]
```

### NSArray

```swift
// 可以承载不同数据类型
var na: NSArray = [1, "hello", 3]
```

## 集合

### 字典

```swift
var dict: [String: String] = ["name": "cxk", "age": "18"]
var dict1: Dictionary<String, String> = [:]

print(dict["name"]!)
print(Array(dict.keys))
print(Array(dict.values))
for key in dict.keys {
    print(dict[key]!)
}
for (key, value) in dict {
    print(key, value)
}
print(dict == ["name": "cxk", "age": "18"])

// 更新
dict["name"] = "jntm"
// 这个方法会返回其之前的值
dict.updateValue("jntm", forKey: "name")
// 删除
dict["name"] = nil
dict.removeValue(forKey: "name")
dict.removeAll()
```

### Set

```swift
// 声明
var set : Set<String> = ["a", "b" , "c"]

for i in set {
    print(i)
}
print(set == ["b", "c", "a"])
set.insert("aa")
set.remove("c")
// 集合运算
print(set.union(["a","aa"]))
print(set.intersection(["a", "aa"]))
print(set.subtracting(["a", "aa"]))
print(set.symmetricDifference(["a", "aa"]))
```

## 函数

### 定义

```swift
// 有参数有返回值
func say(name: String, age: Int) -> String {
    return "jntm \(name) - \(age)"
}
// 无参数无返回值
func say() {
    print( "ctrl")
}
// 返回多个值
func request() -> (message: String, code: Int) {
    return ("not found", 404)
}
// 调用时 多个参数必须使用 形参: 实参 的形式
print(say(name: "cxk", age: 18))
```

### 外内部参数名

```swift
// 外部与内部参数名
func request(url getUrl: String) {
    print(getUrl)
}
request(url: "http://baidu.com")

// 忽略外部参数名
func request(_ url: String, _ method: String) {}
request("baidu.com", "get")
```

### 默认参数、可变参数

```swift
// 可变参数不像其他语言 可以不放在最后 可变参数本质上也是一个数组
func request(url: String, method: String = "get", params: String ...){}
request(url: "baidu.com", params: "sds", "dfsds")
```

### 引用参数

```swift
// 默认参数值和可变参数
// 可变参数不像其他语言 可以不放在最后 可变参数本质上也是一个数组
func request(url: String, method: String = "get", params: String ...){}
request(url: "baidu.com", params: "sds", "dfsds")

// 形参默认都是不可变的
// 使用 inout 关键字 相当于一个指针
func request(url: inout String){
    url = "google.com"
}
var u = "dsds"
request(url: &u)
print(u)
```

### 函数式编程

```swift
func submit(runnable: () -> ()) {
    runnable()
}
func print(){
    print("running")
}
// 第一种调用
submit(runnable: print)
// 第二种调用
submit {
    print("hhh")
}
// 传递一个参数
func submit(consumer: (String) -> ()){
    consumer("ikun")
}
submit { params in
    print(params)
}
// 函数式编程三大操作
print([1,2,3].map{ v in v + 1})
print([1,2,3].filter{ v in v % 2 == 0})
print([1,2,3].reduce(10, {x, y in x + y}))

// 返回函数类型
func getFuture() -> () -> () {
    return {
        print("this is future")
    }
}
getFuture()()
// 函数嵌套
func execute(){
    func innerFunc(){
        print("hello world")
    }
    innerFunc()
}
execute()
```

## 闭包

```swift
var res = [1, 2, 3].sorted(by: { (a: Int, b: Int) -> Bool in
    return a > b
})
print(res)

// 化简
print([1,2,3].sorted(by: {a, b in a > b}))
// 默认命名
print([1, 2, 3].sorted(by: {$0 > $1}))
// 大于号本身是一个函数
print([1,2,3].sorted(by: >))

// 结尾闭包 最后一个参数是闭包的话 可以使用这种语法
print([1,2,3].sorted{ a, b in a > b})
print([1,2,3].map{v in String(v)})

// 内容捕获
var num = 700
print([1,2,3].sorted{a , b in abs(a-num) < abs(b-num)})
```

## 枚举

```swift
enum Color: String {
    case Red = "红色",Yellow = "黄色",Blue = "蓝色"
}
let color: Color = .Blue

switch color {
case .Blue:
    print(color.rawValue)
case .Yellow:
    print(color.rawValue)
case .Red:
    print(color.rawValue)
}

// 使用rawValue获取枚举值
print(Color(rawValue: "红色")!)

// 关联值
enum Status {
    case Success(message: String, code: Int)
    case Error(String)
}
let result = Status.Success(message: "done", code: 200)
switch result {
case let .Success(message, _):
    print("sucess \(message)")
case .Error:
    print("error")
}

// 可选型的本质就是使用了关联值的枚举
let name: String? = Optional.some("jntm")
switch name {
case let .some(name):
    print(name)
case .none:
    print("is nil")
}
```

## 结构体

```swift
struct Location {
    // 这里var跟let的区别在于是否可变
    var x = 0,y: Int = 0
    var z: Int = 0
    
    init() {}
    init(x: Int, y: Int, z: Int) {}
    init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }
    // 可失败的构造函数 返回nil
    init?(x: Int) {
        guard x <= 100 else {
            return nil
        }
        self.x = x
    }
    
    func distance() -> Int {
        return x - y
    }

    // 如果不加mutating这个关键字 这个方法就没法修改结构体
    mutating func setX(x: Int) {
        self.x += 1
    }
}

var home = Location(x: 1, y: 2, z: 3)
// 如果里面的字段有默认值 在这里的构造可以传参
var empty = Location()
print(Location(x: 4, y: 3))
print(home.x)
print(Location(x:101) ?? -1)
home.x = 2
print(home.distance())

// 结构体和枚举是值类型
var p1 = Location(x: 1, y: 2)
var p2 = p1
p1.x = 3
print(p2.x == 1)
```

## 类

```swift
class Person {
    static var popilation: Int = 700_0000_0000
    var name: String
    var age: Int {
        // 属性观察器 需要注意的是不会在init阶段被调用
        // 将要赋值
        willSet {
            if newValue > 200 {
                print("太太老")
            }
        }
        // 已经赋值了
        didSet {
            if age == 18 {
                print("貌美如花")
            }
            if age > 100 {
                print("太老了")
                age = oldValue
            }
        }
    }
    // 计算属性
    var nameAndAge: String {
        get{
            return name + "," + String(age)
        }
        set(nameAndAge) {
            self.name = nameAndAge.components(separatedBy: ",")[0]
            self.age = Int(nameAndAge.components(separatedBy: ",")[1])!
        }
    }
    var bithYear: Int {
        return 2022 - self.age
    }
    
    // 延迟属性 首次访问时会被计算后缓存下来
    lazy var firstDate: Date = {
        return Date()
    }()
    
    init(name: String, age: Int) {
        self.name = name
        self.age = age
    }
    init?(nameAndAge: String) {
        if !nameAndAge.contains(",") {
            return nil
        }
        self.name = nameAndAge.components(separatedBy: ",")[0]
        self.age = Int(nameAndAge.components(separatedBy: ",")[1])!
    }
    
    
    // 类型方法
    static func populationBalanced() -> Bool {
        return popilation <= 7000_0000_0000
    }
}

// 类创建的对象是引用类型
let cxk = Person(name: "cxk", age: 18)
print(cxk.age)
print(Person(nameAndAge: "cxk,18")!.age)

// cxk本身如果是常量 但里面的成员是变量 则可以修改 不像结构体
cxk.age = 22

// 继承
class Student: Person {
    var grade = 12
    // 重载构造器
    // 使用required关键字来强制子类必须重写该构造函数
    required init(grade: Int) {
        // 在super.init之前 不能做self初始化之外的操作
        // self.eat()
        super.init(name: "cxk", age: 17)
        self.grade = grade
    }
    // 便利构造函数 通过一定逻辑调用其他构造函数初始化
    // 便利构造器无法调用super.init
    // 如果子类实现了父类所有的指定构造函数，则自动继承父类的所有便利构造函数
    convenience init(){
        self.init(name: "jntm", age: 22)
    }
    // 重写构造器
    override init(name: String, age: Int) {
        super.init(name: name, age: age)
        self.name = name
        self.age = age
    }
    // 重写属性
    override var bithYear: Int {
        return 2023 - self.age
    }
    // 重写方法
    override func eat() {
        print("student eat")
    }
}
// 禁止再继承
final class SuperPerson: Person{}
let student = Student(grade: 12)
print(student.nameAndAge)

// 多态
let persons: [Person] = [SuperPerson(nameAndAge: "s1,14")!, Student(grade: 18), Person(nameAndAge: "s1,32")!]

```

访问控制：

- public 可在模块外访问
- internal 默认的控制 可在本模块内访问
- private 只允许在本文件内访问

## 运算符重载

```swift
// 自定义运算符需要声明 postfix prefix infix
infix operator |||

struct ReversedList {
    var data: [Int] = [1,2,3,4,5]
    
    // 重载下标运算符
    subscript(index: Int) -> Int? {
        get {
            data[data.count - index - 1]
        }
        set {
            if let newValue = newValue {
                data[data.count - index - 1] = newValue
            }
        }
    }
    // 多维下标
    subscript(index1: Int, index2: Int) -> Int {
        return data[index1] + index2
    }
    
    // 算术运算符重载
    static func + (left: ReversedList, right: ReversedList) -> ReversedList {
        return ReversedList(data: left.data + right.data)
    }
    static func + (left: ReversedList, right: Int) -> ReversedList {
        var left = left
        for i in 0..<left.data.count {
            left.data[i] += right
        }
        return left
    }
    static func += (left: inout ReversedList, right: Int) {
        left = left + right
    }
    prefix static func - (left: ReversedList) -> ReversedList {
        return ReversedList(data: left.data.map {-$0})
    }
    
    // 比较运算符重载
    static func == (left: ReversedList, right: ReversedList) -> Bool {
        guard left.data.count == right.data.count else {
            return false
        }
        for i in 0..<left.data.count {
            if (left.data[i] != right.data[i]) {
                return false
            }
        }
        return true
    }
    static func < (left: ReversedList, right: ReversedList) -> Bool {
        for i in 0..<left.data.count {
            if left.data[i] >= right.data[i] {
                return false
            }
        }
        return true
    }
    
    // 自定义运算符 /,=,-,+,!,*,%,<,>,&,|,^,~
    static func ||| (left: ReversedList, right: ReversedList) -> ReversedList {
        var left = left
        for i in 0..<left.data.count {
            left.data[i] = left.data[i] % right.data[i]
        }
        return left
        
    }
}
```

## 扩展

```swift
extension String {
    // 如果扩展类的构造方法 则构造方法必须是便利构造方法
    init(by: String) {
        self.init(by.uppercased())
    }
    
    // 扩展的属性只能是计算型属性
    var length: Int {
        self.count
    }
    
    func firstChar() -> Character {
        return self[self.startIndex]
    }
    
    // 嵌套类型
    struct Range {}
}

let range : String.Range? = nil
```

## 泛型

```swift
// 泛型函数
func swap<T>(a: inout T, b: inout T) {
    (a,b) = (b,a)
}

var a = "123"
var b = "321"
swap(a: &a, b: &b)
print(a,b)

// 泛型类型
struct ArrayList<T> {
    var data: [T] = []
    
    mutating func add(e: T) {
        data += [e]
    }
}

var list = ArrayList<String>()
list.add(e: "123")
print(list)
```
