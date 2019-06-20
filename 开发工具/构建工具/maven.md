# Maven

[toc]

## 简介

项目管理工具。 基于项目对象模型（POM）， 可以通过一小段描述信息管理项目的构建。

## 下载与安装

下载地址'<https://maven.apache.org/>'

- 配置环境变量

新增'M2_HOME'

![批注 2019-06-20 131454](/assets/批注%202019-06-20%20131454.png)

将'%M2_HOME%\bin'添加到Path环境变量下

## 目录结构

- src

  - main

    - java

      - package

  - test

    - java

      - package

### 一些喜欢忘记的知识点

- 指定JDK版本：

```xml
<properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <encoding>UTF-8</encoding>
        <java.version>12</java.version>
        <maven.compiler.source>12</maven.compiler.source>
        <maven.compiler.target>12</maven.compiler.target>
</properties>
```

## 常用命令

```shell
mvn clean # 清理target目录下的类文件
mvn install # 将本项目安装到仓库
```
