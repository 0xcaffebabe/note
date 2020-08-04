# JDBC

> Java数据库连接，（Java Database Connectivity，简称JDBC）是Java语言中用来规范客户端程序如何来访问数据库的应用程序接口，提供了诸如查询和更新数据库中数据的方法。JDBC也是Sun Microsystems的商标。JDBC是面向关系型数据库的。

## 常用类

接口或类                | 作用
------------------- | ----------------------------------------------------------------------
DriverManager 类     | 1) 管理和注册数据库驱动 2) 得到数据库连接对象
Connection 接口       | 一个连接对象，可用于创建 Statement 和 PreparedStatement 对象
Statement 接口        | 一个 SQL 语句对象，用于将 SQL 语句发送给数据库服务器。
PreparedStatemen 接口 | 一个 SQL 语句对象，是 Statement 的子接口 ResultSet 接口 用于封装数据库查询的结果集，返回给客户端 Java 程序

_从 JDBC3 开始，目前已经普遍使用的版本。可以不用注册驱动而直接使用。Class.forName 这句话可以省略_

## 数据类型

![批注 2019-08-05 115032](/assets/批注%202019-08-05%20115032.png)

## 经典查询

```java
try(Connection connection = DriverManager.getConnection("jdbc:mysql:///test?user=root&password=123")){
            ResultSet rs = connection.createStatement().executeQuery("select * from account");
            while (rs.next()){
                System.out.println(rs.getString("name")+"|"+rs.getDouble("balance"));
            }
        }catch (SQLException e){
            e.printStackTrace();
        }
```

## SQL注入与PreparedStatement

使用 PreparedStatement 避免 SQL注入

## 事务控制

```java
connection.setAutoCommit(false);
            connection.commit();
            connection.rollback();
```

## 数据库连接池

> 数据库连接池负责分配、管理和释放数据库连接，它允许应用程序重复使用一个现有的数据库连接，而不是再重新建立一个；释放空闲时间超过最大空闲时间的数据库连接来避免因为没有释放数据库连接而引起的数据库连接遗漏。这项技术能明显提高对数据库操作的性能。

- c3p0
- druid

## 参数

- 空闲线程数：初始化线程，还没被使用
- 活动线程数：正在被使用的
- 最大线程数：限制最多只能创建的线程数


## JDBCUtils

- 提供静态代码块加载配置文件，初始化连接池对象
- 提供方法

  - 获取连接方法：通过数据库连接池获取连接
  - 释放资源
  - 获取连接池的方法
