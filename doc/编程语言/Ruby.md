# Ruby

## 起步

使用irb进入交互式命令行

```ruby
puts 'hello world'
name = 'world'
puts "hello #{name}"
```

## 编程模型

Ruby 是一门纯面向对象语言

```ruby
puts 4.class # Integer
puts 4.methods
```

## 判断

```rb
x = 6
if x > 5 # singleif
  puts 'great than 5'
end
unless x < 5 # logic not
  puts 'great than 5'
else
  puts 'less than 5'
end
puts 'hello' if x == 6 # single line if
puts x = x + 1 while x < 10 # single line while
```

除了nil和false之外 其他值都代表true

```rb
puts 'hello' && true # true
```

ruby的逻辑运算可以为and or 或者 && ||

```ruby
puts true && false # false
puts true and false # true
```

## 类型

Ruby是强类型语言 会对某些操作进行类型检查 Ruby是在运行时才检查

```rb
puts 4 + 'hello'
```

## 函数

```rb
def say_sth
  puts 'bark'
end
say_sth
```

## 数组

```rb
list = [1,2,3,4]
puts list[0]
puts list[-1] # desc order first
puts list[0..-1] # 0-end
list.push(5)
puts list.pop
list[10] = [1,2,3]
```

## 散列表

```rb
map = {1 => 'cxk', 2 => 'k'}
puts map[1]

map = {:string => 'string', :array => 'array'} # symbol 表示一种特殊对象
puts map[:string]
puts map[:array]
```

## 代码块与yield

代码块就是一个匿名函数

```rb
3.times {puts 'hello world'} # 传给times一个代码块
3.times {|i| puts i} # 传给代码块一个参数i
```

使用yield实现：

```rb
def f
  i = 0
  while i < 10
    i = i + 1
    yield
  end
end

f {puts 'ddd'}

def condition_yeild
  i = 0
  while i < 10
    i = i + 1
    yield if i > 5 # 条件执行
  end
end

condition_yeild {puts 'ddd'}
```

## 类

```rb
class Animal
  attr_accessor :name
  def initialize(name)
    @name = name
  end
end

dog = Animal.new('dog')
puts dog.name
```

method_mission方法 当调用的方法找不到 该方法会被调用

```rb
class Man
  def self.method_missing name, *args
    puts "oh, no such method:${name}"
  end
end

puts Man.go

```

### Mixin

通过混入模块的方式隐式实现一些功能

```rb
module Human
  def go
    puts 'gogogo'
  end
end

class Person
  include Human
end
p = Person.new
p.go
```

## 集合的可枚举 可比较

```rb
list = [1,2,3,4,5]
puts list.sort
puts list.any? {|i| i> 6}
puts list.all? {|i| i> 6}
puts list.collect {|i| i * 2} # 对每一元素进行此操作
puts list.select {|i| i > 2} # 收集符合这个条件的元素
puts list.member?(2) # 存在一个2

puts list.inject {|sum,i| sum * i} # 求乘积
```

## 应用场景

- 脚本
- web开发

## 不足

- 性能
- 并发与OOP
- 类型安全
