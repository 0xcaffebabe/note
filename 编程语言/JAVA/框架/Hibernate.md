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