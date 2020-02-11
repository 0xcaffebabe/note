>对象关系映射（Object Relational Mapping，简称ORM）是通过使用描述对象和数据库之间映射的元数据，将面向对象语言程序中的对象自动持久化到关系数据库中

- JDBC操作的繁琐

# Hibernate

- 依赖

```xml
<dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-core</artifactId>
            <version>6.0.0.Alpha2</version>
        </dependency>
```

- 配置

```xml

<?xml version='1.0' encoding='UTF-8'?>
<!-- hibernate.cfg.xml -->
<!DOCTYPE hibernate-configuration PUBLIC
        "-//Hibernate/Hibernate Configuration DTD 3.0//EN"
        "http://hibernate.sourceforge.net/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
    <session-factory>
        <property name="connection.url">jdbc:mysql:///hibernate</property>
        <property name="connection.driver_class">com.mysql.cj.jdbc.Driver</property>
        <property name="connection.username">root</property>
        <property name="connection.password">123</property>

        <property name="hibernate.hbm2ddl.auto">update</property>
        <property name="dialect">org.hibernate.dialect.MySQL57Dialect</property>
        <property name="show_sql">true</property>

        <mapping class="wang.ismy.orm.entity.Book"/>
    </session-factory>
</hibernate-configuration>
```

- 实体类

```java
@Entity
@Table(name = "tb_book")
public class Book {

    @Id
    @Column(name = "bid")
    @GeneratedValue(strategy = GenerationType.TABLE)
    private Integer id;

    @Column(name = "bname")
    private String name;

    @Column(name = "bauthor")
    private String author;
}
```

- 使用

```java
        Configuration cfg = new Configuration().configure();

        SessionFactory sessionFactory = cfg.buildSessionFactory();

        Session session = sessionFactory.openSession();
        Transaction tx = session.beginTransaction();

        Book book = new Book();
        book.setName("cxk 篮球入门指南");
        book.setAuthor("cxk");
        session.save(book);

        tx.commit();

        session.close();
        sessionFactory.close();
```

- 查询

```java
        Session session = sessionFactory.openSession();
        Book book = new Book();
        book.setId(2);
        session.get(Book.class, 2);
```

- 删除

```java
        Book book = new Book();
        book.setId(2);
        session.delete(book);
```

## 运行原理

![](https://img-blog.csdn.net/20170921205322084?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvcXFfMzY3NDgyNzg=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)


# Mybatis

## 运行原理

![](https://img-blog.csdn.net/20150427151555111?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaml1cWl5dWxpYW5n/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)


