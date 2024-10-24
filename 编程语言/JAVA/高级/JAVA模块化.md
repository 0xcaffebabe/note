# 模块化

模块化的访问控制通过类加载过程来完成

JDK8之前jar的缺陷

- jar文件无法控制别人访问其内部的public的类
- 无法控制不同jar包中，相同的类名(包名+类名)
- Java运行时，无法判定classpath路径上的jar中有多少个不同版本
的文件。Java加载第一个符合名字的类
- Java运行时，无法预判classpath路径上是否缺失了一些关键类

## 兼容Java9 之前

- 所有类路径下的JAR文件及其他资源文件，都被视为自动打包在一个匿名模块（Unnamed Module）里，这个匿名模块几乎是没有任何隔离的，它可以看到和使用类路径上所有的包、JDK系统模块中所有的导出包，以及模块路径上所有模块中导出的包
- 模块路径下的具名模块（Named Module）只能访问到它依赖定义中列明依赖的模块和包，匿名模块里所有的内容对具名模块来说都是不可见的
- 如果把一个传统的、不包含模块定义的JAR文件放置到模块路径中，它就会变成一个自动模块（Automatic Module）。尽管不包含module-info.class，但自动模块将默认依赖于整个模块路径中的所有模块

## 模块化下的类加载器

扩展类加载器（Extension Class Loader）被平台类加载器（Platform Class Loader）取代

新版的JDK也没了jre 现在可以用过jlink打包出一个jre：

```sh
jlink -p $JAVA_HOME/jmods --add-modules java.base --output jre
```

平台类加载器和应用程序类加载器都不再派生自java.net.URLClassLoader

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