# 模块化

JDK8之前jar的缺陷

- jar文件无法控制别人访问其内部的public的类
- 无法控制不同jar包中，相同的类名(包名+类名)
- Java运行时，无法判定classpath路径上的jar中有多少个不同版本
的文件。Java加载第一个符合名字的类
- Java运行时，无法预判classpath路径上是否缺失了一些关键类

## 模块化原则

- 强封装性：一个模块必须能够对其他模块隐藏其部分代码
- 定义良好的接口：模块必须向其他模块公开定义良好且稳定的接口
- 显式依赖：明确一个模块需要哪些模块的支持才能完成工作

## Java 9 Jigsaw 

- 以模块(module)为中心
- JDK 本身进行模块化

### 模块系统

- 在模块中，仍以包-类文件结构存在
- 每个模块中，都有一个module-info.java
- jlink

### 步骤

- 在src下面建立一个目录module.hello(模块名字，可自由定)
- 在module.hello目录下，建立cn\hello目录，再建立HelloWorld.java
- 在module.hello目录下，建立一个module-info.java

### module-info.java

```java
module module.hello { // 模块名
    requires java.base; // 需要的模块
    exports module.hello.wang.ismy.module; // 导出的模块
}
```

- 单纯requires，模块依赖不会传递

```java
requires transitive java.net.http; // 传递依赖
requires java.se; // 调用一个聚合模块
exports module.hello.wang.ismy.module to java.xml; // 导出的模块只限定java.xml用
```

#### open

- exports导出的包的public部分可以反射，其他权限修饰的内容和未导出的内容无法反射(setAccessible(true)也无效)

- opens可以打开一些包，其他模块可以反射调用这些包及内容

```java
open module module.hello { // 开放整个模块
 opens wang.ismy.module; // 开放某个包
}
```

## 服务

- provides提供接口，with实现类(不导出)
- uses消费接口
- ServiceLoader加载接口的实现类

```java
module module1 {

    exports wang.ismy.module1;
    provides wang.ismy.module1.Service with wang.ismy.module1.impl.ServiceImpl,
            wang.ismy.module1.impl.ServiceImpl2;
}
```

```java
module module2 {
    requires module1;
    uses wang.ismy.module1.Service;
}
```

- 使用

```java
ServiceLoader<Service> serviceLoader = ServiceLoader.load(Service.class);

        for (Service service : serviceLoader) {
            service.run();
        }
```

### 特点

- 从根源上对JDK进行模块化，降低最终程序运行时负载
- 在jar层上增加一个module机制
- 引入exports/requires/opens明确模块边界和依赖关系，程序更隐私安全
- 引入服务provides/uses使得程序更解耦
- –jlink制作运行时映像，使运维更高效

## OSGI

- 动态JAVA模块化系统