# Python

## 数据类型

- 整数型
- 浮点型
- 字符串
- 布尔型
- None

### 数据结构

#### 列表

```python
# 列表中的元素可以是任意类型的
list = [1,'2',3.0]
# 通过下标来获取/修改元素
list[0]='a'
print(list[0])
# 通过len函数来获取列表长度
print(len(list))
# 通过list的append函数来添加元素
list.append('xx')
# 查看元素在列表中的下标
print(list.index(3.0))
# 查看元素是否在列表中
print('2' in list)
# 统计列表中某元素的数量
print(list.count(1))
# 向某位置插入元素,如果提供的下标超出列表的大小，会插在最后
list.insert(0,'x')
# 添加一个列表
list.extend([5,5,5])
# 根据下标删除元素并返回
x = list.pop(0)
# 直接删除指定下标位置的元素
del list[0]
# 删除并返回最后一个元素
x = list.pop()
# 直接删除元素
list.remove('2')
# 反转列表
list.reverse()
# 排序
list.sort()
# 清空列表
list.clear()
```

#### 元组

元组创建完成后，便不能向其中添加元素，也不能修改和删除其中的任何一个元素

```python
# 空元祖
items = ()
# 一个元素的元组，需要在最后加一个(,)，如果括号中只有一个元素，那么 Python 会将这个括号当作优先级符号进行处理
items=(1,)
# 多个元素的元组
items=(1,2,3)
# 获取元素
print(items[2])
# 获取下标
print(items.index(2))
# 是否存在
print(2 in items)
# 统计元素个数
print(items.count(1))
```

#### 字符串

字符串是字符的有序序列，所以也具有索引。也可以根据索引取出其中某一个字符

```python
print('cxk'[2])
# 字符串是不可变的，所以不能通过下标修改
# 'cxk'[2]='b'
# 同样可以用len获取长度
print(len('cxk'))
str = 'java language'
# 查找子串
print(str.find('ang'))
# 判断子串
print('ava' in str)
# 统计子串数
print(str.count('a'))
# 是否以某子串开头
print(str.startswith('ja'))
# 是否以某子串结尾
print(str.endswith('ge'))
# 字符串替换
print(str.replace('java','python'))
# 去除字符串前后空白字符
print(str.strip())
# 分割字符串，返回list
print(str.split(' '))
# 拼接字符串
print(str.join(['so','good']))
# 转成大写形式
print(str.upper())
# 转成小写形式
print(str.lower())
```

- 字符转义

常用的转义字符 | 含义
------- | --------
`\'`    | 单引号
`\"`    | 双引号
`\\`    | 反斜杠
`\n`    | 换行符
`\t`    | 制表符（Tab）
`\r`    | 回车

- 原始字符串

```python
# 原始字符串，有啥就是啥
print(r'java \t no.1')
```

- 多行字符串

```python
# 多行字符串，输出的字符串不换行
print('java no.1\
    yes!\
    ')
# 输出的字符串换行
print("""
java
no.1
""")
```

### 列表、元组、字符串的通用操作

```python
# 长度
print(len(str))
# 获取子序列
print(str[1:10])
# 拼接子序列
print(str + '?')
# 重复序列中的元素
print(str*3)
```

### 字典

也就是map,显著优势是可以通过键快速地查询数据

```python
# 创建空字典
map = {}
# 创建有内容的字典
map = {'key1': 1, 'key2': 2}
# 增加键值对/修改键所对应的值
map['key3'] = 3
# 通过键获取值,若键不存在则将抛出 KeyError 异常
print(map['key2'])
# 通过方法来获取，不存在返回None
print(map.get('key1'))
# 不存在返回默认值0
print(map.get('keyx', 0))
# 是否包含某个键
print('x' in map)
# 获取所有键，返回迭代器
print(map.keys())
# 获取所有值，返回迭代器
print(map.values())
# 获取键值对迭代器，每一对都是元组
print(map.items())
# 根据键删除,返回值，如果键不存在，则会抛出 KeyError 异常
map.pop('key1')
# 键不存在返回默认值，不会抛异常
map.pop('key1', 'x')
# 键不存在会抛异常
del map['key2']
# 随机弹出一个键值对
print(map.popitem())
# 用字典更新字典
map = {'key1': 'x'}
map.update({'key1': 1})
```

### 集合

其中的元素没有顺序关系。集合中的元素没有重复，重复的元素将被自动剔除最终只留下一个，集合也是用花括号（{}）来表示，不同于字典的是，花括号中放的是一个个数据，而不是键值对

```python
# 创建空集合
s = set()
# 创建集合
s = {1, 2, 3, 4, 5}
# 添加元素
s.add(0)
# 并集
s.update({7, 8, 9})
# 查看元素是否在集合中
print(0 in s)
# 弹出一个元素
print(s.pop())
# 删除指定元素,如果要删除的元素不存在，则抛出 KeyError 异常
s.remove(1)
# 删除，但不抛出异常
s.discard(1)
# 求交集
print({1, 2, 3}.intersection({3, 4, 5}))
print({1, 2, 3} & {3, 4, 5})
# 求并集
print({1, 2, 3}.union({3, 4, 5}))
print({1, 2, 3} | {3, 4, 5})
# 求差集
print({1, 2, 3}.difference({3, 4, 5}))
print({1, 2, 3} - {3, 4, 5})
# 是否为子集
print({1, 2}.issubset({1, 2, 3}))
# 是否为超集
print({1, 2, 3}.issuperset({1, 2}))
# 清空集合
s.clear()
```

## 数值运算

```python
# 加法
print(33+725)
# 减法
print(33-11)
# 乘法
print(33*25)
# 除法
print(33/22)
# 取余
print(33 % 11)
# 次方
print(33**2)
# 整除
print(33//22)
```

## 比较运算

```python
print(2>3)
print(2==3)
print(2<=3)
print(2!=3)
```

## 变量与赋值

```python
a=5
```

## 函数

- 抽象
- 代码复用

### 函数定义

```python
def sum(a,b):
    return a+b
```

### 副作用

函数包含一些会引起程序或系统状态变化的操作，如修改全局变量、命令行输入输出、读写文件等，这样的变化叫做函数的副作用

### 几个内置函数

```python
# 获取终端的一个输入
str = input('input str')
# 将str转为int类型
a = int(str)
# 输出
print(a)
```

### python内置函数

- 数据类型相关

内置函数    | 功能                      | 示例                  | 示例结果
------- | ----------------------- | ------------------- | ------------------------
dict()  | 将参数转换为字典类型              | dict(a=1, b=2, c=3) | {'a': 1, 'b': 2, 'c': 3}
float() | 将字符串或数字转换为浮点型           | float('0.22')       | 0.22
int()   | 将字符串或数字转换为整数型           | int(1.23)           | 1
list()  | 将元组、字符串等可迭代对象转换为列表      | list('abc')         | ['a', 'b', 'c']
tuple() | 将列表、字符串等可迭代对象转换为元组      | tuple([1, 2, 3])    | (1, 2, 3)
set()   | 1.创建空集合；2.将可迭代对象转换为列表集合 | set('abc')          | {'b', 'a', 'c'}
str()   | 将参数转换为字符串               | str(3.14)           | '3.14'
bytes() | 将参数转换为字节序列              | bytes(4)            | b'\x00\x00\x00\x00

- 数值计算相关

内置函数    | 功能      | 示例                        | 示例结果
------- | ------- | ------------------------- | ----------------------
max()   | 求最大值    | max([13, 2, 0.6, -51, 7]) | 13
min()   | 求最小值    | min([13, 2, 0.6, -51, 7]) | -51
sum()   | 求和      | sum([13, 2, 0.6, -51, 7]) | -28.4
abs()   | 求绝对值    | abs(-51)                  | 51
pow()   | 求次方     | pow(2, 10)                | 1024
bin()   | 转换为二进制  | bin(77)                   | '0b1001101' （注意结果为字符串）
hex()   | 转换为十六进制 | hex(77)                   | '0x4d' （注意结果为字符串）
round() | 浮点数四舍五入 | round(4.5678, 2)          | （第二个参数为小数精度） 4.57

- bool 值判断相关

内置函数   | 功能
------ | -------------------------------------------------------------------------
bool() | 判断参数是否为真，为真则返回 True，否则返回 False。「为真」指的是，表达式的结果为布尔值 True，或非零数字，或非空字符串，或非空列表
all()  | 如果可迭代对象中的所有值，在逐一应用 bool(值) 后结果都为 True，则返回 True，否则返回 False
any()  | 如果可迭代对象中的任意一个或多个值，在应用 bool(值) 后结果为 True，则返回 True，否则返回 False

- IO 相关

内置函数    | 功能
------- | --------------------
input() | 从标准输入中读取字符串
print() | 将内容写入标准输出中
open()  | 打开一个文件。之后便可以对文件做读写操作

- 元数据相关

内置函数         | 功能
------------ | ------------------------------------------------
type()       | 获取对象的类型
isinstance() | 判断对象是否是某个类（或其子类）的对象
dir()        | 获取类或对象中的所有方法和属性；无参数时获取当前作用域下的所有名字
id()         | 返回一个对象的唯一标识。在我们所使用的 CPython 中这个唯一标识实际为该对象在内存中的地址

- help

```py
# 得到有关int函数的相关信息
help(int)
```

- sorted

```py
# 排序
print(sorted([3,5,7,1]))
```

- range

```py
# 获取一个整数序列
print(range(100))
```

### 函数进阶

- 参数默认值

```py
# 如果省略a，则a的默认值为10
def f(a=10):
    print(a)
```

- 关键字参数

```py
def f(x,y):
    print(x)
    print(y)
# 这里通过指定参数名，可以颠倒参数的顺序
f(y=1,x=2)
```
```py
# 使用这种方式，kw能把接收到参数组合成一个map
def f(**kw):
    print(kw)
    
f(x=1,y=2,z=3)
```

- 任意参数列表

```py
# 类似于java的可变参数
def f(*kw):
    print(kw)
    
f(1,2,3)
```

- 多返回值

```py
def f():
    x=1
    y=2
    return x,y
    
a,b=f()
```

## 逻辑关键字

- and
- or
- not

## 分支语句

需要注意的是，python使用的缩进来代表c/java中的花括号

```python
if a<18:
    print('未成年')
elif a>=18 and a<=20:
    print('还年轻')
else:
    print('成年')
```

## 循环语句

- while循环

```python
while a>=0:
    print(a)
    a = a-1
```

- for循环

```python
list = [1,2,3]
for i in list:
    print(i)
```

## 错误处理与异常机制

### 异常捕获

```python
# 捕获所有异常
try:
    b=a/0
except:
    print('catch exception')
# 捕获某个异常
try:
    b=a/0
except ZeroDivisionError as e:
    print('catch exception:',e)
# 捕获多个异常
try:
    b=a/0
except (ZeroDivisionError,IndexError) as e:
    print('catch exception:',e)
# 增加finally语句，finally语句无论是否发生异常都会执行
try:
    b=a/0
except:
    print('catch exception')
finally:
    print("finally")
```

python常见的内置异常

异常名               | 含义
----------------- | ---------------
Exception         | 大多数异常的基类
SyntaxError       | 无效语法
NameError         | 名字（变量、函数、类等）不存在
ValueError        | 不合适的值
IndexError        | 索引超过范围
ImportError       | 模块不存在
IOError           | I/O 相关错误
TypeError         | 不合适的类型
AttributeError    | 属性不存在
KeyError          | 字典的键值不存在
ZeroDivisionError | 除法中被除数为 0

### 抛出异常

```python
try:
    raise ValueError("参数错误")
except ValueError as e:
    print('catch exception:',e)
```

## 面向对象

### 查看数据类型

```python
print(type(''))
```

### 类的定义

```python
class Person:
    pass # pass是占位符
```

### 实例化

```python
p = Person()
```

### 属性

```python
class Person:
    # 增加构造器参数,self，定义时必须有这个参数，但是调用时不必传递，等同于this
    def __init__(self,firstName,lastName):
        self.firstName = firstName
        self.lastName = lastName
# 创建对象时传入参数
p = Person('c','xk')
# 访问属性
print(p.firstName)
```

### 方法

```python
class Person:
    # 省略...
    def say(self):
        print(self.firstName+self.lastName)
# 调用方法
p.say()
```

### 进阶

- 类属性与类方法

```py
class Person:
    # 定义一个类变量
    people = '70亿'
    # 定义一个类方法
    @classmethod
    def go(klass):
        print(str(klass)+'go')
# 使用
print(Person.people)
Person.go()
```

- 静态方法

```py
class Person:
    ...
    # 定义一个静态方法，区别在于不用传入klass
    @staticmethod
    def go0():
        print('static go')
```

- 私有属性

```py
class Person:
    # 定义一个类私有属性
    __people = '70'
    @classmethod
    def f(klass):
        print(Person.__people)
    def f1(self):
        # 私有成员变量
        self.__age=15
        return self.__age

Person.f()
p = Person()
print(p.f1())
# 会抛异常
p.__age
# 会抛出异常
print(Person._people)
```

- 特殊方法

头尾有双下划线的方法都是特殊方法

`__init__()`用于对象的初始化。在实例化类的过程中，被自动调用,就是构造器

`__next__()` 对迭代器调用 next() 函数，便能生成下一个值。这个过程的背后，next() 调用了迭代器的 `__next__()` 方法

`__len__()` 实现了 `__len__()` 方法，调用 len() 函数时将自动调用容器的` __len__() `方法

`__str__() ` 在使用 print() 函数时将自动调用类的 `__str__()` 方法,toString()

`__getitem__()` 'abc'[2] 即等同于 'abc'.`__getitem__(2)`

- 类继承

```py
class Animal:
    def run(self):
        print('animal run')

class Dog(Animal):
    def __init__(self):
        # 调用父类的构造器
        super().__init__()
    # 覆写父类的方法
    def run(self):
        print('dog run')
    def bark(self):
        print('wolf wolf')
dog = Dog()
dog.run()
dog.bark()
```

- 多继承

```py
class MachineDog:
    def kill(self):
        print('machine dog kill you')
class Dog(Animal):
   ...
class KillingMachineDog(Dog,MachineDog):
    pass
superDog = KillingMachineDog()
superDog.bark()
superDog.kill()
```

## 模块和包

### 模块的导入

```python
# 导入模块
import random
# 使用模块
print(random.randint(1,9))
```

### 包

```
包/
├── __init__.py
├── 模块1.py
├── 模块2.py
├── 子包1/
    ├── __init__.py
    ├── 模块3.py
    └── 模块4.py
└── 子包2/
    ├── __init__.py
    ├── 模块5.py
    └── 孙子包1/
        ├── __init__.py
        └── 模块6.py
```

包的导入

```python
import package.subpackage.module
```

## 迭代器

迭代指的是通过重复执行某个操作，不断获取被迭代对象中的数据。这样的每一次操作就是就是一次 **迭代**

迭代器可以提供迭代功能，当我们需要逐一获取数据集合中的数据时，使用迭代器可以达成这个目的

迭代器可以不保存数据，它的数据可以在需要时被计算出来（这一特性也叫做惰性计算）

```py
# 将容器包装成一个迭代器
iterator = iter([1,2,3,4])
# 不断迭代，直至迭代完抛出异常
while True:
    print(next(iterator))
```

python的for循环迭代就是通过使用迭代器完成的

- 对一个容器调用 iter() 函数，获取到该容器的迭代器
- 每次循环时对迭代器调用 next() 函数，以获取一个值
- 若捕获到 StopIteration 异常则结束循环

### 可迭代

定义了 `__iter__()` 方法的类对象就是可迭代的。当这个类对象被 iter() 函数使用时，将返回一个迭代器对象

### 自定义迭代器

```py
class MyIterator:
    # 定义了这个方法就代表是可迭代的
    def __iter__(self):
        self.count=0
        return self
    # 实现可迭代对象的接口
    def __next__(self):
        self.count = self.count+1
        return self.count
# 使用
i = MyIterator()
for i in i:
    print(i)
```

## 生成器

yield 语句的作用和 return 语句有几分相似，都可以将结果返回。不同在于，生成器函数执行至 yield 语句，返回结果的同时记录下函数内的状态，下次执行这个生成器函数，将从上次退出的位置（yield 的下一句代码）继续执行

```py
# 另外一种定义迭代器的方式
def f():
    for i in range(10):
        yield i

# 使用
i = f()
for j in i:
    print(j)
```

### 生成器表达式

```py
生成器 = (针对项的操作 for 项 in 可迭代对象)
```

```py
# 输出0-9每个数的平方
for i in (j**2 for j in range(10)):
    print(i)
```

也可以加上if语句

```py
# 输出0-100中偶数的平方
for i in (j**2 for j in range(100) if j%2==0):
    print(i)
```

### 字典生成式

```py
{键: 值 for 项 in 可迭代对象}
```

```py
# 生成0-10的键为i，值为i的平方的map
map = {i:i**2 for i in range(10)}
```

### 集合生成式

```py
# 生成0-10的集合
set = {i for i in range(10)}
```

## 函数式编程

```py
def say():
    print('say')
# 函数可赋值给变量并调用
f = say
f()
```

### 函数作为参数

```py
def f(callback):
    callback('date')
def f1(x):
    print(x)

f(f1)
```

### lambda表达式

```py
# 上面的函数调用也可以缩写成
f(lambda x: print(x))
```

### 函数作为返回值

```py
def f():
    return lambda x,y: x+y

print(f()(1,2))
```

### map与filter

```py
# filter函数可对一个可迭代对象做过滤，符合过滤lambda的元素会被返回
l = filter(lambda x: x%2==0,[1,2,3,4,5])
print(list(l))
```

```py
l = [1,2,3,4,5]
# map函数则是对可迭代对象中的每个元素做处理，然后返回
ret = map(lambda x: x**2,l)
print(list(ret))
```

## 装饰器

### 自定义装饰器

```py
def aop(fun):
    # 对fun进行包装，在其外层拦截参数
    def wrapper(*args,**kw):
        print("aop拦截参数:",args,kw)
        fun(*args,**kw)
    return wrapper

class A:
    # 加上这一行等于 m = aop(m)
    @aop
    def m(self):
        print('method invoke')

a = A()
a.m()
```

## 一些语言特性

### 切片

```py
l = [1,2,3,4,5]
# 负数代表倒数第几个
print(l[-2])
# 起始索引跟结束索引默认不写就代表是第一个/最后一个
print(l[:])
# 代表从0到最后一个，步长为2取一个元素
print(l[0:-1:2])
```

### 赋值

```py
# 连续赋值
a = b = c = 1
# 拆包
x, y = 1, 2
# 拆包一次接收多个元素
x, *y = 1, 2, 3, 4
# 交换两个元素
x, y = y, x
# or的使用
print('' or '1') # 结果为'1' 类似于js
```

### 控制语句

```py
# 三元表达式
# 如果1=1,ret=1 否则ret=2
ret = 1 if 1==1 else 2
# for...else
# 如果可迭代对象全部都被迭代了，就会执行else语句，否则不执行else语句，while...else同理
for i in range(5):
    print(i)
else:
    print('all used')
# try except else,没有发生异常时，else语句会被调用
try:
    pass
except:
    print('发生异常')
else:
    print('没有发生异常')
```

### 类

```py
# 自定义异常
class BussinessException(Exception):
    pass
```

### 函数

```py
#     参数类型标注   返回值类型标注
def f(name:str) -> str:
    return 'hello'
```

## IO

### 打开文件

```py
f = open('test.py','r')
# 指定编码
f = open('test.py','r',encoding='gbk')
```

**读写模式**

'r'：只读，若文件不存在则抛出 FileNotFoundError 异常
'rb': 以二进制的形式
'w'：只写，将覆盖所有原有内容，若文件不存在则创建文件
'a'：只写，以追加的形式写入内容，若文件不存在则创建文件
'r+'：可读可写，若文件不存在则抛出 FileNotFoundError 异常
'w+'：可读可写，若文件不存在则创建文件
'a+'：可读可写，写入时使用追加模式，若文件不存在则创建文件

### 文件写入

```py
f = open('a.txt','w')
f.write('a dog')
```

### 文件读取

```py
f = open('test.py','r',encoding='utf8')
# 读出全部内容
print(f.read())
# 读出文件行的列表
print(f.readlines())
```

### 文件关闭

```py
f.close()
```

### 文件系统操作

```py
import os
# 创建目录
os.mkdir('./test')
# 枚举目录下的文件
for i in os.listdir('./'):
    print(i)
# 删除目录
os.rmdir('./test')
# 删除文件
os.remove('a.txt')
# 重命名文件
os.rename('test.py','test1.py')
```

## 序列化

- pickle(python独有)

```py
import pickle

# 序列化成二进制
ret = pickle.dumps([1,2,3])
print(ret)
# 反序列化
print(pickle.loads(ret))
```

- json

```py
import json
# 序列化成json
str = json.dumps({'a':1,'b':2})
print(str)
# 反序列化
print(json.loads(str))
```

## 进程与线程

### 进程

```py
import multiprocessing
import os
def f():
    print('子进程')
    print('pid',os.getpid())
    print('ppid',os.getppid())

# 只有主进程才创建子进程
if __name__ == '__main__':
    # 创建一个子进程
    p = multiprocessing.Process(target=f)
    p.start()
    # 等待子线程运行完毕才会继续往下走
    p.join()
```

### 线程

```py
import threading

def f():
    print('sub thread')

# 创建线程并启动
t = threading.Thread(target=f)
t.start()
# 等待子线程执行完毕才继续往下执行
t.join()
print('main thread')
```

- 锁

```py
import threading
count = 0
# 创建一个锁
lock = threading.Lock()
def add():
    for i in range(2000000):
        global count
        # 获取锁
        lock.acquire()
        count = count+1
        # 释放锁
        lock.release()
    print('执行完成：当前结果:',count)
for i in range(10):
    threading.Thread(target=add).start()
```

## 安装第三方包

```js
pip install requests --user
```

## python编码风格

### 变量和函数

「全小写+下划线」

```py
max_capacity = 10
```

### 类名

「驼峰写法」

```py
class CodeGenerator:
    pass
```

### 异常名

「驼峰写法」

```py
ValueError
```

### 常量

「全大写+下划线」

```py
MAX_VALUE=100
```

### 模块名和包名

模块可使用「小写 + 下划线」

```py
open_api
```

包名仅使用小写字母命名

```py
requests
```

### 缩进

每级缩进应使用 4 个空格

### 换行

每行代码的最大字符数为 79。若某一行代码过长，可以将其换行书写

定义函数和类时，多个函数或类之间使用两个空行进行分隔

### 导入

import 按下列类型和顺序使用：

- 标准库导入
- 第三方库导入
- 本地库导入

### 注释

注释以 # 及一个空格开始
行内注释和代码间至少要有两个空格分隔