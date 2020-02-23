# Python

## 数据类型

- 整数型
- 浮点型
- 字符串
- 布尔型
- None

### 数据结构

#### 列表

```py
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

```py
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

```py
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

常用的转义字符|	含义
-|-
`\'`|	单引号
`\"`|	双引号
`\\`|	反斜杠
`\n`|	换行符
`\t`|	制表符（Tab）
`\r`|	回车

- 原始字符串

```py
# 原始字符串，有啥就是啥
print(r'java \t no.1')
```

- 多行字符串

```py
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

```py
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

```py
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

```py
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

```py
print(2>3)
print(2==3)
print(2<=3)
print(2!=3)
```

## 变量与赋值

```py
a=5
```

## 函数

- 抽象
- 代码复用

### 函数定义

```py
def sum(a,b):
    return a+b
```

### 副作用

函数包含一些会引起程序或系统状态变化的操作，如修改全局变量、命令行输入输出、读写文件等，这样的变化叫做函数的副作用


### 几个内置函数

```py
# 获取终端的一个输入
str = input('input str')
# 将str转为int类型
a = int(str)
# 输出
print(a)
```

## 逻辑关键字

- and
- or
- not

## 分支语句

需要注意的是，python使用的缩进来代表c/java中的花括号

```py
if a<18:
    print('未成年')
elif a>=18 and a<=20:
    print('还年轻')
else:
    print('成年')
```

## 循环语句

- while循环

```py
while a>=0:
    print(a)
    a = a-1
```

- for循环

```py
list = [1,2,3]
for i in list:
    print(i)
```

## 错误处理与异常机制

### 异常捕获

```py
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

异常名|	含义
-|-
Exception|	大多数异常的基类
SyntaxError|	无效语法
NameError|	名字（变量、函数、类等）不存在
ValueError|	不合适的值
IndexError|	索引超过范围
ImportError|	模块不存在
IOError|	I/O 相关错误
TypeError|	不合适的类型
AttributeError|	属性不存在
KeyError|	字典的键值不存在
ZeroDivisionError|	除法中被除数为 0

### 抛出异常

```py
try:
    raise ValueError("参数错误")
except ValueError as e:
    print('catch exception:',e)
```

## 面向对象

### 查看数据类型

```py
print(type(''))
```

### 类的定义

```py
class Person:
    pass # pass是占位符
```

### 实例化

```py
p = Person()
```

### 属性

```py
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

```py
class Person:
    # 省略...
    def say(self):
        print(self.firstName+self.lastName)
# 调用方法
p.say()
```

## 模块和包

### 模块的导入

```py
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

```py
import package.subpackage.module
```

