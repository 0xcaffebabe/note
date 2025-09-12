# Mybatis

- 持久层框架
- 动态sql
- ORM

## 快速开始

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

### 使用xml

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

#### 根据条件查询

```xml
<select id="findById" resultType="wang.ismy.mybatis.entity.User">
        SELECT * FROM user WHERE id = #{id}
    </select>
```

细节：

- resultType 属性： 用于指定结果集的类型。
- parameterType 属性： 用于指定传入参数的类型。
- sql 语句中使用的`#{}`： 它代表占位符，相当于jdbc 中的?，都是用于执行语句时替换实际的数据
- `#{}`中的内容：因为参数只有一个，所以此处可以随意写

#### 更新

```xml
<insert id="save" parameterType="wang.ismy.mybatis.entity.User">
    INSERT INTO user(username,address,sex,birthday) 
    VALUES(#{username},#{address},#{sex},#{birthday})
</insert>
```

```java
int save(User user);
```

**需要注意的是，mybatis的SqlSession关闭了事务的默认提交，当进行完更新操作后，需要手动调用**`sqlSession.commit();`

#### 模糊查询字符串拼接问题

```sql
SELECT * FROM user WHERE username LIKE '%' #{name} '%'
```

#### 插入数据后返回ID

```xml
<insert id="save" parameterType="wang.ismy.mybatis.entity.User">

    <selectKey keyColumn="id" keyProperty="id" resultType="int">
    select last_insert_id();
    </selectKey>
    INSERT INTO user(username,address,sex,birthday) VALUES(#{username},#{address},#{sex},#{birthday})
</insert>
```

#### 使用resultMap

```xml
<resultMap id="userMap" type="wang.ismy.mybatis.entity.User">
    <!--主键-->
    <id column="id" property="id"/>
    <!--非主键-->
    <result column="username" property="username"/>
</resultMap>

<select id="findAll" resultMap="userMap">
    select * from user
</select>
```

#### Properties标签

```xml
<properties resource="jdbc.cfg">

    </properties>
```

#### typeAliases标签

```xml
<typeAliases>
    <!--指定别名，不区分大小写-->
    <typeAlias type="wang.ismy.mybatis.entity.User" alias="user"/>

    <!--指定该包下的所有类为别名，不区分大小写-->
    <package name="wang.ismy.mybatis.entity"/>
</typeAliases>
```

#### mapper

```xml
<mappers>
    <package name="wang.ismy.mybatis.dao">
</mappers>
```

### 使用注解

```java
public interface UserDao {

    @Select("SELECT * FROM user")
    List<User> findAll();
}
```

注解              | 作用
--------------- | -----------------------
@Insert         | 实现新增
@Update         | 实现更新
@Delete         | 实现删除
@Select         | 实现查询
@Result         | 实现结果集封装
@Results        | 可以与@Result 一起使用，封装多个结果集
@ResultMap      | 实现引用@Results 定义的封装
@One            | 实现一对一结果集封装
@Many           | 实现一对多结果集封装
@SelectProvider | 实现动态 SQL 映射
@CacheNamespace | 实现注解二级缓存的使用

#### Result注解使用

```java
@Select("SELECT * FROM user")
@Results({
        @Result(id=true,column = "id",property ="id"),
        @Result(column = "username",property ="username"),
        @Result(column = "sex",property ="sex"),
        @Result(column = "address",property ="address"),
        @Result(column = "birthday",property ="birthday")
})
List<User> find();
```

##### 一对一查询

```java
@Select("SELECT * FROM account")
@Results({
        @Result(id=true,column = "id",property = "id"),
        @Result(column = "uid",property = "uid"),
        @Result(column = "money",property = "money"),
        @Result(column = "uid",property = "user",one = @One(select = "wang.ismy.mybatis.dao.UserDao.findById",fetchType = FetchType.LAZY))
})
List<Account> findAll();
```

#### 一对多查询

```java
@Select("SELECT * FROM user")
@Results({
        @Result(id=true,column = "id",property ="id"),
        @Result(column = "username",property ="username"),
        @Result(column = "sex",property ="sex"),
        @Result(column = "address",property ="address"),
        @Result(column = "birthday",property ="birthday"),
        @Result(column = "id",property = "account",
                many = @Many(select = "wang.ismy.mybatis.dao.AccountDao.findById",fetchType = FetchType.LAZY))
})
List<User> find();
```

#### 开启二级缓存

```java
@CacheNamespace
public interface UserDao {}
```

```xml
<!--如果使用注解的话，则指定class属性-->
<mappers>
    <mapper class="wang.ismy.mybatis.dao.UserDao"/>
</mappers>
```

## 原理及源码分析

![自定义Mybatis分析](/assets/自定义Mybatis分析.png)

Mapper 注册中心 -> 执行器 -> StatementHadnler -> ResultsetHandler

核心接口：

- SqlSession
- SqlSessionFactory
- ResultHandler

XML相关：

- XMLConfigBuilder：读取XML配置文件
  - XPathParser：根据XPath解析

重点：

- MapperRegistry：负责Mapper接口处理
  - MapperAnnotationBuilder
- Configuration

MapperProxy:

- invoke

MapperMethod

ParamNameResolver

MappedStatement

Executor

StatementHandler

MetaObject：拦截器元数据

## 缓存机制

### 延迟加载

>就是在需要用到数据时才进行加载，不需要用到数据时就不加载数据。延迟加载也称懒加载. 

- 开启延迟加载

```xml
<settings>
    <setting name="logImpl" value="STDOUT_LOGGING" />
    <!--延迟加载相关-->
    <setting name="lazyLoadingEnabled" value="true"/>
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

- 修改连接

```xml
<resultMap id="userMap" type="user">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result property="address" column="address"/>
    <result property="birthday" column="birthday"/>
    <result property="sex" column="sex"/>
    <collection property="account" ofType="Account" select="wang.ismy.mybatis.dao.AccountDao.findById" column="id">
        <id column="account_id" property="id"/>
        <result column="uid" property="uid"/>
        <result column="money" property="money"/>
    </collection>
</resultMap>
```

*使用的动态代理实现的延迟加载*

### 缓存

![](/assets/202336145345.png)

![批注 2020-05-18 103307](/assets/批注%202020-05-18%20103307.png)

#### 一级缓存

>一级缓存是 SqlSession 范围的缓存，当调用 SqlSession 的修改，添加，删除，commit()，close()等方法时，就会清空一级缓存。 

命中原则：

- statementId相同
- 查询参数相同（hash的方式）
- 分页参数
- sql语句
- 同一环境（environment属性）

生命周期：

缓存销毁：
- session close
- commit
- clearCache主动清除

设计理念：

- 不过期
- 不更新
- 不限制

#### 二级缓存

>二级缓存是 mapper 映射级别的缓存，多个 SqlSession 去操作同一个 Mapper 映射的 sql 语句，多个 SqlSession 可以共用二级缓存，二级缓存是跨 SqlSession 的。 

**二级缓存中存放的是数据而不是对象**

##### 开启

- 第一步：在 SqlMapConfig.xml 文件开启二级缓存

```xml
<!--默认为true，可以省略-->
<setting name="cacheEnabled" value="true"/>
```
- 第二步：配置相关的 Mapper 映射文件 

```xml
<cache/>
```
- 第三步：配置 statement 上面的 useCache 属性 

```xml
<select id="findAll" resultMap="userMap" useCache="true">
    SELECT * FROM user
</select>
```

##### 命中原则

- 同一 session factory
- statement id 相同
- 参数相同
- environment 环境相同
- sql session close 或 commit

##### 生命周期

创建:

- sql session close 或 commit

销毁：

- sql session update

#### 缓存清除策略

![批注 2020-05-18 105408](/assets/批注%202020-05-18%20105408.png)

## 多表查询

### 一对一

- 定义结果映射

```xml
<resultMap id="accountMap" type="Account">
    <id column="account_id" property="id"/>
    <result column="UID" property="uid"/>
    <result column="MONEY" property="money"/>
    <association property="user" javaType="User">
        <id column="id" property="id"/>
        <result column="username" property="username"/>
        <result property="address" column="address"/>
        <result property="birthday" column="birthday"/>
        <result property="sex" column="sex"/>
    </association>
</resultMap>
```

- 多表查询设置结果映射

```xml
<select id="findAll" resultMap="accountMap">
     SELECT account.ID AS account_id,
     account.UID,
     account.MONEY,
     user.*
     FROM account,user
     WHERE account.UID = user.id
</select>
```

- 实体类

```java
@Data
public class Account {

    private Integer id;

    private Integer uid;

    private Double money;

    private User user;
}
```

### 一对多

```xml
<resultMap id="userMap" type="user">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result property="address" column="address"/>
    <result property="birthday" column="birthday"/>
    <result property="sex" column="sex"/>
    <collection property="account" ofType="Account">
        <id column="account_id" property="id"/>
        <result column="uid" property="uid"/>
        <result column="money" property="money"/>
    </collection>
</resultMap>
<select id="findAll" resultMap="userMap">
   SELECT user.*,
    account.ID as account_id,
    account.uid,
    account.money
    FROM user LEFT OUTER JOIN account ON user.id = account.UID
</select>
```

```java
@Data
public class User {

    private Integer id;

    private String username;

    private LocalDate birthday;

    private String sex;

    private String address;

    private List<Account> account;
}
```

*左外连接的使用*

### 多对多

多对多的映射关系，可以拆分成两个一对多的关系

## 动态SQL

### if

```xml
<if test="username != null">
    #{username} 'abc'
</if>
```

### where 标签

```xml
<where>
    <if test="...">
        ...
    </if>
</where>
```

这样就不用写`where 1=1`前缀

### foreach标签

- collection:代表要遍历的集合元素，注意编写时不要写`#{}`
- open:代表语句的开始部分
- close:代表结束部分
- item:代表遍历集合的每个元素，生成的变量名
- sperator:代表分隔符

```xml
<foreach collection="ids" open="id in ( " close=")" item="uid"  separator=",">
      #{uid}     
</foreach>
```

### SQL重用

```xml
<sql id="sql">
    SELECT * FROM user WHERE id = #{id}
</sql>
<select id="findById" resultType="wang.ismy.mybatis.entity.User">
    <include refid="sql"/>
</select>
```

## 连接池与事务

连接池：

- UNPOOLED:不使用连接池的数据源
- POOLED:使用连接池的数据源
- JNDI:使用 JNDI 实现的数据源

事务：

```java
/*提交事务*/
sqlSession.commit();
/*回滚事务*/
sqlSession.rollback();
```

## 分页插件

- 引入依赖

```xml
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper</artifactId>
    <version>5.1.10</version>
</dependency>

```

- 配置

```xml
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <property name="dataSource" ref="dataSource" />
    <property name="plugins">
        <array>
            <bean class="com.github.pagehelper.PageInterceptor">
                <property name="properties">
                    <props>
                        <prop key="helperDialect">oracle</prop>
                        <prop key="reasonable">true</prop>
                        
                    </props>
                </property>
            </bean>
        </array>
    </property>
</bean>
```

- 使用

```java
@Override
public List<Order> findAll() {
    PageHelper.startPage(1,5);
    return orderDao.findAll();
}
```


