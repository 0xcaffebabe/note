# Gradle

Gradle 的核心在于基于 Groovy 的丰富而可扩展的域描述语言(DSL)

## 目录结构

```
├── build.gradle  用于配置当前项目的Gradle构建脚本
├── gradle 
│   └── wrapper
│       ├── gradle-wrapper.jar  	Gradle Wrapper可执行jar 文件
│       └── gradle-wrapper.properties  	Gradle Wrapper 配置
├── gradlew  类unix下的Gradle Wrapper启动脚本
├── gradlew.bat  windows下的Gradle Wrapper启动脚本
└── settings.gradle 用于配置Gradle构建的Gradle设置脚本
```

## 构建基础

- project：我们的应用
- task：每个 project 都由多个 tasks 组成。每个 task 都代表了构建执行过程中的一个原子性操作。如编译，打包，生成

### 第一个构建脚本

```groovy
// build.gradle
task hello {
    doLast {
        println 'hello world'
    }
}
```
```sh
gradle -q hello
```

- 声明任务依赖关系

```groovy
task hello {
    doLast {
        print 'hello,'
    }
}
task world(dependsOn: hello) {
    doLast {
        print 'world'
    }
}
// gradle -q world : hello,world
```

## Groovy

>Groovy 是JVM 的一个替代语言—替代是指可以用Groovy 在Java 平台上进行Java 编程，使用方式基本与使用Java 代码的方式相同

程序示例：
```groovy
class Foo {
  doSomething() {
    data = ["name": "James", "location": "London"]
    for (e in data) {
      println("entry ${e.key} is ${e.value}")
    }
  }

  closureExample(collection) {
    collection.each { println("value ${it}") }
  }

  static void main(args) {
    values = [1, 2, 3, "abc"]
    foo = new Foo()
    foo.closureExample(values)
    foo.doSomething()
  }
}
```
## 生命周期
初始化->配置->执行
## 依赖管理
### 添加依赖
```groovy
dependencies {
    testCompile group: 'junit', name: 'junit', version: '4.12'
    compile group: 'com.google.guava', name: 'guava', version: '27.1-jre'
}
```
### 依赖冲突
- 排序
- 强制
### 多项目构建
### 自动化测试
### 发布
