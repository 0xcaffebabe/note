# JDK8之前jar的缺陷

- jar文件无法控制别人访问其内部的public的类
- 无法控制不同jar包中，相同的类名(包名+类名)
- Java运行时，无法判定classpath路径上的jar中有多少个不同版本
的文件。Java加载第一个符合名字的类
- Java运行时，无法预判classpath路径上是否缺失了一些关键类

# 模块化原则

- 强封装性：一个模块必须能够对其他模块隐藏其部分代码
- 定义良好的接口：模块必须向其他模块公开定义良好且稳定的接口
- 显式依赖：明确一个模块需要哪些模块的支持才能完成工作

# Java 9 Jigsaw 

- 以模块(module)为中心
- JDK 本身进行模块化

## 模块系统

- 在模块中，仍以包-类文件结构存在
- 每个模块中，都有一个module-info.java
- jlink

### 步骤

- 在src下面建立一个目录module.hello(模块名字，可自由定)
- 在module.hello目录下，建立cn\hello目录，再建立HelloWorld.java
- 在module.hello目录下，建立一个module-info.java