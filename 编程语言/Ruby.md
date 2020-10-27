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
