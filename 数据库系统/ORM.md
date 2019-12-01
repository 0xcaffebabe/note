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

        <mapping package="wang.ismy.orm.entity"/>
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "bname")
    private String name;

    @Column(name = "bauthor")
    private String author;
}
```

