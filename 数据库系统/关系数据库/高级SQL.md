# 高级SQL

## 使用程序设计语言访问数据库
- 动态SQL:运行时构建SQL语句字符串与数据库进行交互
- 嵌入式SQL:SQL语句必须在编译时全部确定，由预处理器来连接宿主语言与数据库
### JDBC
一段经典的JDBC代码：
```java
// 加载驱动
        Class.forName("com.mysql.jdbc.Driver");
        // 获取连接
        Connection connection =
                DriverManager.getConnection("jdbc:mysql:///test","root","Root@@715711877");
        // 执行SQL

       ResultSet resultSet = connection.prepareStatement("SELECT * FROM test").executeQuery();

        //取回结果集
        while (resultSet.next()){
            System.out.println(resultSet.getInt("id")+"|"
                    +resultSet.getString("name"));
        }
        connection.close();
```