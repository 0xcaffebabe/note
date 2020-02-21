# Gradle
[toc]

## Gradle 的安装
安装过程跟Maven类似，Gradle基于JAVA，所以下载完之后将路径添加到环境变量即可
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
## 任务
在Gradle,可以自定义任务。
示例：
```groovy
task "create-dirs" << {
    sourceSets*.java.srcDirs*.each {
        it.mkdirs()
    }
    sourcScts*.resources.srcDirs*.each{
        it.midirs()
    }
}
```
上面是创建一个自动创建目录的任务
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
