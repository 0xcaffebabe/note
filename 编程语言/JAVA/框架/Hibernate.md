# Hibernate

>Hibernate 是由 Gavin King 于 2001 年创建的开放源代码的对象关系框架。它强大且高效的构建具有关系对象持久性和查询服务的 Java 应用程序。
Hibernate 将 Java 类映射到数据库表中，从 Java 数据类型中映射到 SQL 数据类型中

## 架构

![202022916348](/assets/202022916348.jpg)

## 配置

### ORM元数据配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<!-- 配置表与实体对象的关系 -->
<!-- package属性:填写一个包名.在元素内部凡是需要书写完整类名的属性,可以直接写简答类名了. -->
<hibernate-mapping package="wang.ismy.hibernate.entity" >
    <!--
        class元素: 配置实体与表的对应关系的
            name: 完整类名
            table:数据库表名
     -->
    <class name="Book" table="tb_book" >
        <!-- id元素:配置主键映射的属性
                name: 填写主键对应属性名
                column(可选): 填写表中的主键列名.默认值:列名会默认使用属性名
                type(可选):填写列(属性)的类型.hibernate会自动检测实体的属性类型.
                        每个类型有三种填法: java类型|hibernate类型|数据库类型
                not-null(可选):配置该属性(列)是否不能为空. 默认值:false
                length(可选):配置数据库中列的长度. 默认值:使用数据库类型的最大长度
         -->
        <id name="bid">
            <!-- generator:主键生成策略 -->
            <generator class="native"/>
        </id>
        <!-- property元素:除id之外的普通属性映射
                name: 填写属性名
                column(可选): 填写列名
                type(可选):填写列(属性)的类型.hibernate会自动检测实体的属性类型.
                        每个类型有三种填法: java类型|hibernate类型|数据库类型
                not-null(可选):配置该属性(列)是否不能为空. 默认值:false
                length(可选):配置数据库中列的长度. 默认值:使用数据库类型的最大长度
         -->
        <property name="bname" column="bname" >
            <!--  <column name="bname" sql-type="varchar" ></column> -->
        </property>
        <property name="bauthor" column="bauthor"/>

    </class>
</hibernate-mapping>
```

### 主配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-configuration PUBLIC
	"-//Hibernate/Hibernate Configuration DTD 3.0//EN"
	"http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
	<session-factory>

		 <!-- 数据库驱动 -->
		<property name="hibernate.connection.driver_class">com.mysql.cj.jdbc.Driver</property>
		 <!-- 数据库url -->
		<property name="hibernate.connection.url">jdbc:mysql:///hibernate?characterEncoding=utf8</property>
		 <!-- 数据库连接用户名 -->
		<property name="hibernate.connection.username">root</property>
		 <!-- 数据库连接密码 -->
		<property name="hibernate.connection.password">123</property>
		<!-- 数据库方言
			不同的数据库中,sql语法略有区别. 指定方言可以让hibernate框架在生成sql语句时.针对数据库的方言生成.
			sql99标准: DDL 定义语言  库表的增删改查
					  DCL 控制语言  事务 权限
					  DML 操纵语言  增删改查
			注意: MYSQL在选择方言时,请选择最短的方言.
		 -->
		<property name="hibernate.dialect">org.hibernate.dialect.MySQLDialect</property>
		
		
		<!-- #hibernate.show_sql true 
			 #hibernate.format_sql true
		-->
		<!-- 将hibernate生成的sql语句打印到控制台 -->
		<property name="hibernate.show_sql">true</property>
		<!-- 将hibernate生成的sql语句格式化(语法缩进) -->
		<property name="hibernate.format_sql">true</property>
		<!-- 
		## auto schema export  自动导出表结构. 自动建表
		#hibernate.hbm2ddl.auto create		自动建表.每次框架运行都会创建新的表.以前表将会被覆盖,表数据会丢失.(开发环境中测试使用)
		#hibernate.hbm2ddl.auto create-drop 自动建表.每次框架运行结束都会将所有表删除.(开发环境中测试使用)
		#hibernate.hbm2ddl.auto update(推荐使用) 自动生成表.如果已经存在不会再生成.如果表有变动.自动更新表(不会删除任何数据).
		#hibernate.hbm2ddl.auto validate	校验.不自动生成表.每次启动会校验数据库中表是否正确.校验失败.
		 -->
		<property name="hibernate.hbm2ddl.auto">update</property>

		<mapping resource="Book.hbm.xml" />
		
	</session-factory>
</hibernate-configuration>
```

### 使用

```java
// 加载配置文件
Configuration cfg = new Configuration().configure("hibernate.cfg.xml");
// 创建核心对象session的工厂
SessionFactory factory = cfg.buildSessionFactory();
// 获得session
Session session = factory.openSession();
// 开启事务
Transaction tx = session.beginTransaction();

Book book = new Book();
book.setBname("JAVASCRIPT hight level program");
book.setBauthor("nigolas");

// 保存对象
session.save(book);
// 提交事务
tx.commit();
// 关闭会话
session.close();
factory.close();
```

```java
// 根据ID查询
session.get(Book.class, 6)

// 根据ID修改
Book book = session.get(Book.class, 6);
book.setBauthor("cxk");
session.update(book);

// 根据ID删除
Book book = session.get(Book.class, 6);
session.delete(book);
```

```java
// 回滚事务
tx.rollback();
```

## 实体

### 实体类注意事项

- 持久类提供无参数构造方法
- 成员变量私有,提供有get/set方法访问.需提供属性
- 持久化类中的属性,应尽量使用包装类型
- 持久化类需要提供id.与数据库中的主键列对应
- 不要用final修饰class

### 主键类型

- 自然主键
  - 表的业务列中,有某业务列符合,必须有,并且不重复的特征时,该列可以作为主键使用.
- 代理主键
  - 表的业务列中,没有某业务列符合,必须有,并且不重复的特征时,创建一个没有业务意义的列作为主键

### 主键生成策略

#### 代理主键

identity : 主键自增.由数据库来维护主键值.录入时不需要指定主键.
sequence: Oracle中的主键生成策略.
increment(了解): 主键自增.由hibernate来维护.每次插入前会先查询表中id最大值.+1作为新主键值.
hilo(了解): 高低位算法.主键自增.由hibernate来维护.开发时不使用.
native:hilo+sequence+identity 自动三选一策略.
uuid: 产生随机字符串作为主键. 主键类型必须为string 类型.

#### 自然主键

assigned:自然主键生成策略. hibernate不会管理主键值.由开发人员自己录入.

## 对象状态

- 瞬时状态
  - 没有ID，没有在session缓存中
- 持久化状态
  - 有id,在session缓存中
  - 持久化对象的变化会同步到数据库中
- 游离|托管状态
  - 有id,没有在session缓存中

```java
Book book = new Book(); // 瞬时状态
book.setBauthor("unknown"); // 瞬时状态

session.save(book); // 持久化状态
tx.commit();
// 关闭会话
session.close(); // 游离|托管状态
```

![批注 2020-03-02 102153](/assets/批注%202020-03-02%20102153.png)

## 一级缓存

```java
Book book = session.get(Book.class, 1);
Book book1 = session.get(Book.class, 1);
System.out.println(book == book1); // true
```

### 快照

```java
Book book = session.get(Book.class, 1);
book.setBname("java learning"); 
tx.commit(); // 与快照中对象进行对比，如果对象发生改变，则更新对象
```

## 事务

### 设置事务隔离级别

```xml
<!--	1|2|4|8
	0001 1 读未提交
	0010 2 读已提交
	0100 4 可重复读
	1000 8 串行化
-->
<property name="hibernate.connection.isolation">4</property>
```

### 在项目中管理事务

- 获取线程绑定session

```xml
<!-- 需要配置session上下文 -->
<property name="current_session_context_class">thread</property>
```

```java
// 获取线程绑定session
// 注意，线程绑定的session事务提交后会自动关闭
Session session = factory.getCurrentSession();
```

## 其他方式查询

### HQL查询

```java
String hql = "FROM Book";
Query<Book> query = session.createQuery(hql,Book.class);
System.out.println(query.list());
```

```sql
-- 条件查询
FROM Book where bauthor='unknown'
-- 排序
FROM Book ORDER BY bid DESC
-- 投影
SELECT bname FROM Book
-- 投影封装对象
SELECT new Book(bname) FROM Book
-- 连接Book与Author
FROM Book b INNER JOIN fetch b.authors
```

```java
// 聚合函数
String hql = "SELECT max(bid) FROM Book";
Query query = session.createQuery(hql);
Number number = (Number) query.uniqueResult();
```

```java
// 占位符
String hql = "FROM Book where bauthor=:name";
Query<Book> query = session.createQuery(hql,Book.class);
query.setParameter("name","unknown");
```

```java
// 分页 第一页，每页10条
query.setFirstResult(0);
query.setMaxResults(10);
```

### Criteria查询(单表条件查询)

```java
Criteria criteria = session.createCriteria(Book.class);
System.out.println(criteria.list());
```

```java
// 根据ID查询
criteria.add(Restrictions.idEq(2));
// 条件查询
criteria.add(Restrictions.eq("bname","clean code"));
// 排序
criteria.addOrder(Order.asc("bname"));
// 聚合函数
criteria.setProjection(Projections.max("bid"));
```

#### 离线查询

```java
DetachedCriteria criteria = DetachedCriteria.forClass(Book.class);
criteria.add(Restrictions.eq("bname","clean code"));
List list = criteria.getExecutableCriteria(session).list();
```

### 原生sql查询

```java
String sql = "SELECT * FROM tb_book WHERE bid = ?";
NativeQuery<Book> query = session.createSQLQuery(sql).addEntity(Book.class);
query.setParameter(1,1);
```

## 多表查询

### 一对多|多对一

```xml
<class name="Book" table="tb_book" >
    <id name="bid">
        <generator class="native"/>
    </id>
    <property name="bname" column="bname" />
	<!-- 一对多 -->
    <set name="authors">
        <key column="book"/>
        <one-to-many class="Author"/>
    </set>
</class>
```
```xml
<class name="Author" table="tb_author" >
    <id name="id">
        <generator class="native"/>
    </id>
    <property name="name" column="author_name" />
	<!-- 多对一 -->
    <many-to-one name="book" column="book" class="Book"/>
</class>
```

- 操作

```java
// 新增
Book book = new Book();
book.setBname("java");

Author author1 = new Author();
author1.setName("author1");
author1.setBook(book);
Author author2 = new Author();
author2.setName("author2");
author2.setBook(book);
book.setAuthors(Set.of(author1,author2));

session.save(book);
session.save(author1);
session.save(author2);

// 追加一个多
Book book = session.get(Book.class,1);
Author author3 = new Author();
author3.setName("author3");
author3.setBook(book);
book.getAuthors().add(author3);
session.save(author3);

// 移除一个多
Book book = session.get(Book.class,1);
book.getAuthors().removeIf(a-> "author1".equals(a.getName()));
```

- 级联操作

```xml
<!-- 
 	级联操作:	cascade
 		save-update: 级联保存更新
 		delete:级联删除
 		all:save-update+delete
 	级联操作: 简化操作.目的就是为了少写两行代码.
  -->
  <!-- inverse属性: 配置关系是否维护. 
  		true: book不维护关系
  		false(默认值): book维护关系
  		
  	inverse属性: 性能优化.提高关系维护的性能.
  	原则: 无论怎么放弃,总有一方必须要维护关系.
  	一对多关系中: 一的一方放弃.也只能一的一方放弃.多的一方不能放弃.
  -->
<set name="authors" inverse="true" cascade="save-update">

<many-to-one name="book" column="book" class="Book" cascade="save-update"/>
```

```java
Book book = new Book();
book.setBname("python");

Author author1 = new Author();
author1.setName("authorx");
author1.setBook(book);

book.setAuthors(Set.of(author1));
session.save(book);
```

### 多对多

```xml
<class name="Book" table="tb_book" >
    <id name="bid">
        <generator class="native"/>
    </id>
	<!-- 多对多关系一方要放弃维护关系 -->
    <property name="bname" column="bname" inverse="true"/>

    <set name="authors" table="tb_book_author">
        <key column="bid"/>
        <many-to-many class="Author" column="aid"/>
    </set>
</class>

<class name="Author" table="tb_author" >
    <id name="aid">
        <generator class="native"/>
    </id>
    <property name="name" column="author_name" />
    <set name="book" table="tb_book_author">
        <key column="aid"/>
        <many-to-many class="Book" column="bid"/>
    </set>
</class>
```

- 操作

```java
Book book1 = new Book();
book1.setBname("clean code");
Book book2 = new Book();
book2.setBname("clean coder");

Author author1 = new Author();
author1.setName("martin flower");
Author author2 = new Author();
author2.setName("robert c");

book1.setAuthors(Set.of(author1,author2));
book2.setAuthors(Set.of(author1,author2));
author1.setBook(Set.of(book1,book2));
author2.setBook(Set.of(book1,book2));

session.save(book1);
session.save(book2);
session.save(author1);
session.save(author2);
```

## 加载策略

### 类级别

```java
// 立即加载
Book book = session.get(Book.class, 1);

// 延迟加载 使用时才去数据库查询（动态代理）
// 使用懒加载时要确保,调用属性加载数据时,session还是打开的.不然会抛出异常
Book book = session.load(Book.class, 2);
```

```xml
<class name="Book" table="tb_book" lazy="true">
```

### 关联级别

- 集合

```xml
<!-- 
	lazy
		true:默认值，获取集合时才加载
		false:在get时，立即加载集合数据
		extra:与懒加载效果一致，如果只获取集合size，那就只发起count语句
	fetch
		select:默认值
		join：使用一条语句直接得到所有数据
		subselect: 加载集合时，使用批量子查询
 -->
<set name="authors" table="tb_book_author" inverse="true" lazy="true" fetch="select">
```

- 关联属性

为了提高效率.fetch的选择上应选择select. lazy的取值应选择 true. 全部使用默认值.

### 批量抓取

- batch-size