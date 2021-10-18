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
task copy(type: Copy, group: "Custom", description: "从一个地方复制到另一个地方") {
    from "src"
    into "dest"
}
```
```sh
# 执行任务
./gradlew copy
```

- 使用插件定义任务

```groovy
plugins {
    id "base"
}
task zip(type: Zip, group: "Archive", description: "Archives sources in a zip file") {
    from "src"
    archiveName "basic-demo-1.0.zip"
}
```

- 查看可用任务

```sh
.\gradlew tasks
```

## 构建java项目

```
├── build.gradle
├── gradle    
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java  
    │   │   └── demo
    │   │       └── App.java
    │   └── resources
    └── test      
        ├── java
        │   └── demo
        │       └── AppTest.java
        └── resources
```

```groovy
// settings.gradle
rootProject.name = 'gradle-java' // 项目名
```

```groovy
// build.gradle
plugins {
    // 使用java插件
    id 'java'
    // application插件
    id 'application'
}
repositories {
    // 远程仓库
    jcenter()
}
// 一些依赖
dependencies {
    implementation 'com.google.guava:guava:28.2-jre'
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.6.0'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.6.0'
}
application {
    // 定义main类
    mainClassName = 'gradle.java.App'
}
test {
    // 使用junit5测试
    useJUnitPlatform()
}
```
```sh
# 构建项目
./gradlew build
```

## 构建JAVA库文件

```groovy
plugins {
    // 使用java-library插件
    id 'java-library'
}
repositories {
    jcenter()
}
dependencies {
    // 这个依赖会暴露给消费者，也就是说，这个依赖可以在消费者的classpath下找到
    api 'org.apache.commons:commons-math3:3.6.1'
    // 内部使用的依赖 不会暴露给消费者
    implementation 'com.google.guava:guava:28.2-jre'
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.6.0'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.6.0'
}
test {
    useJUnitPlatform()
}
```

- 自定义

```groovy
// build.gradle
version = '0.1.0' // 定义jar包版本
// 自定义manifest属性
jar {
    manifest {
        attributes('Implementation-Title': project.name,
                'Implementation-Version': project.version)
    }
}
repositories {
    // 自定义仓库
    ivy {
        // URL可以是一个本地目录
        url "../local-repo"
    }
    // 可以指定多个仓库
    jcenter()
}
```

## 多项目

```groovy
// 查看子项目任务
gradlew :service:tasks
// 执行子任务测试
gradle :service:test
```

## 构建spring boot项目

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '2.2.6.RELEASE'
    id 'io.spring.dependency-management' version '1.0.9.RELEASE'
}

repositories {
    maven { url 'https://maven.aliyun.com/repository/jcenter/'}
    maven { url 'https://maven.aliyun.com/repository/spring/'}
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-dependencies:2.2.6.RELEASE'
    implementation 'org.springframework.boot:spring-boot-starter-web'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'

    components {
        withModule('org.springframework:spring-beans') {
            allVariants {
                withDependencyConstraints {
                    // Need to patch constraints because snakeyaml is an optional dependency
                    it.findAll { it.name == 'snakeyaml' }.each { it.version { strictly '1.19' } }
                }
            }
        }
    }
}

bootJar {
    // Define the main class for the application.
    mainClassName = 'gradle.spring.boot.App'
}
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
