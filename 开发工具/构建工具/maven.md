# Maven

## 简介

项目管理工具。 基于项目对象模型（POM）， 可以通过一小段描述信息管理项目的构建。

## 下载与安装

下载地址'<https://maven.apache.org/>'

- 配置环境变量

新增'M2_HOME'

![批注 2019-06-20 131454](/assets/批注%202019-06-20%20131454.png)

将`%M2_HOME%\bin`添加到Path环境变量下

## 目录结构

- src

  - main

    - java

      - package

    - resources

  - test

    - java

      - package

    - resources

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
mvn install # 将本项目安装到本地仓库
mvn compile # 编译
mvn test # 执行测试
mvn package #打包
```

### 添加依赖

```xml
<dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>

</dependencies>
```

### 自动生成目录结构

```shell
mvn archetype:generate
```

## 坐标与构件

## 仓库

- 本地仓库

  - 修改本地仓库地址 ![批注 2019-06-21 135628](/assets/批注%202019-06-21%20135628.png)

- 远程仓库

- 镜像仓库

  - 配置镜像仓库 ![批注 2019-06-21 135418](/assets/批注%202019-06-21%20135418.png)

## 生命周期

- clean 清理项目

  - pre-clean
  - clean
  - post-clean

- default 构件项目

  - compile
  - test
  - package
  - install
  - deploy

- site 生成项目站点

  - pre-site
  - site
  - post-site
  - site-deploy 打包插件

    ```xml
    <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-source-plugin</artifactId>
                <version>3.0.0</version>
                <configuration>
                    <attach>true</attach>
                </configuration>
                <executions>
                    <execution>
                        <phase>compile</phase>
                        <goals>
                            <goal>jar-no-fork</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
    ```

    ## POM元素

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>pom版本</modelVersion>


    <groupId>反写的网址+项目名</groupId>
    <artifactId>项目名+模块名</artifactId>
    <!--    第一个 表示大版本号-->
    <!--    第二个 表示分支版本号-->
    <!--    第三个 表示小版本-->
    <!--    snapshot 快照-->
    <!--    alpha 内部测试-->
    <!--    beta 公测-->
    <!--    release 稳定-->
    <!--    GA 正式分布-->
    <version>1.0-SNAPSHOT</version>
    <!--    war zip pom jar 默认是jar-->
    <packaging></packaging>

    <name>项目描述名</name>
    <url>项目地址</url>
    <description>项目描述</description>
    <licenses>证书信息</licenses>
    <organization>组织信息</organization>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <encoding>UTF-8</encoding>
        <java.version>12</java.version>
        <maven.compiler.source>12</maven.compiler.source>
        <maven.compiler.target>12</maven.compiler.target>
    </properties>

    <!--    依赖列表-->
    <dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
            <type></type>
            <!--设置依赖是否可选 默认false-->
            <optional></optional>
            <!--排除依赖传递列表-->
            <exclusions></exclusions>
        </dependency>

    </dependencies>

<!--    依赖的管理-->
    <dependencyManagement>

        <dependencies>
            <dependency>

            </dependency>
        </dependencies>
    </dependencyManagement>


    <build>

        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-source-plugin</artifactId>
                <version>3.0.0</version>
                <configuration>
                    <attach>true</attach>
                </configuration>
                <executions>
                    <execution>
                        <phase>compile</phase>
                        <goals>
                            <goal>jar-no-fork</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

        </plugins>
    </build>

<!--    父模块-->
    <parent></parent>

<!--    指定多个模块进行编译-->
    <modules></modules>
</project>
```

## 依赖范围

![批注 2019-06-21 143028](/assets/批注%202019-06-21%20143028.png)

## 依赖传递

> A->B(compile) 第一关系: a依赖b compile B->C(compile) 第二关系: b依赖c compile

## 依赖冲突

- 短路优先

  > A->B->C->X(1.0) A->D->X(2.0) 由于只能引入一个版本的包，此时Maven按照最短路径选择导入x(2.0) A->B->X(1.0) A->D->X(2.0) 路径长度一致，则优先选择第一个，此时导入x(1.0)

```xml
<!--排除B对C的依赖-->

<dependency>  
            <groupId>B</groupId>  
            <artifactId>B</artifactId>  
            <version>0.1</version>  
            <exclusions>
                 <exclusion>
                    <groupId>C</groupId>  
                    <artifactId>C</artifactId><!--无需指定要排除项目的版本号-->
                 </exclusion>
            </exclusions>
</dependency>
```

## 聚合与继承

- 聚合

  ```xml
  <modules>
        <module>study-common</module>
        <module>study-plugin</module>
        <module>study-blog</module>
        <module>study-web</module>
    </modules>
  ```

- 继承

  ```xml
  <parent>  
    <groupId>com.tiantian.mavenTest</groupId>  
    <artifactId>projectA</artifactId>  
    <version>1.0-SNAPSHOT</version>  
  </parent>
  ```

## 创建web项目
