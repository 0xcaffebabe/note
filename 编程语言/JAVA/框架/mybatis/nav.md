# Mybatis

## 框架

>框架（Framework）是整个或部分系统的可重用设计，表现为一组抽象构件及构件实例间交互的方法;另一种 定义认为，框架是可被应用开发者定制的应用骨架。前者是从应用方面而后者是从目的方面给出的定义。  简而言之，框架其实就是某种应用的半成品，就是一组组件，供你选用完成你自己的系统。简单说就是使用别 人搭好的舞台，你来做表演。而且，框架一般是成熟的，不断升级的软件。 

## Mybatis

- 持久层框架
- 动态sql
- ORM

Mapper 注册中心 -> 执行器 -> StatementHadnler -> ResultsetHandler

## 搭建

- 创建mapper接口

```java
public interface UserDao {

    List<User> findAll();
}
```

- 创建总配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <environments default="development">
        <environment id="development">
            <!--事务类型-->
            <transactionManager type="JDBC"/>

            <!--连接池-->
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql:///mybatis"/>
                <property name="username" value="root"/>
                <property name="password" value="123"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="mappers/user.xml"/>
    </mappers>
</configuration>
```

- 创建映射配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="wang.ismy.mybatis.dao.UserDao">

    <select id="findAll" resultType="wang.ismy.mybatis.entity.User">
    SELECT * FROM user
  </select>
</mapper>
```

## 使用

```java
    @Test
    public void findAll() throws IOException {

        SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(
                Resources.getResourceAsStream("config.xml"));
        SqlSession sqlSession = factory.openSession();

        List<User> list = sqlSession.getMapper(UserDao.class).findAll();
        assertEquals(6,list.size());
    }
```

### 注解

```java
public interface UserDao {

    @Select("SELECT * FROM user")
    List<User> findAll();
}
```

```xml
<!--如果使用注解的话，则指定class属性-->
    <mappers>
        <mapper class="wang.ismy.mybatis.dao.UserDao"/>
    </mappers>
```

## 分析

![自定义Mybatis分析](/assets/自定义Mybatis分析.png)


