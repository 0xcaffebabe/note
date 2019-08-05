> Java数据库连接，（Java Database Connectivity，简称JDBC）是Java语言中用来规范客户端程序如何来访问数据库的应用程序接口，提供了诸如查询和更新数据库中数据的方法。JDBC也是Sun Microsystems的商标。JDBC是面向关系型数据库的。

# 常用类

接口或类                | 作用
------------------- | ----------------------------------------------------------------------
DriverManager 类     | 1) 管理和注册数据库驱动 2) 得到数据库连接对象
Connection 接口       | 一个连接对象，可用于创建 Statement 和 PreparedStatement 对象
Statement 接口        | 一个 SQL 语句对象，用于将 SQL 语句发送给数据库服务器。
PreparedStatemen 接口 | 一个 SQL 语句对象，是 Statement 的子接口 ResultSet 接口 用于封装数据库查询的结果集，返回给客户端 Java 程序

*从 JDBC3 开始，目前已经普遍使用的版本。可以不用注册驱动而直接使用。Class.forName 这句话可以省略*


# 数据类型

![批注 2019-08-05 115032](/assets/批注%202019-08-05%20115032.png)

# 经典查询

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

