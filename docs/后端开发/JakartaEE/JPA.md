>JPA的全称是Java Persistence API， 即Java 持久化API，是SUN公司推出的一套基于ORM的规范，内部是由一系列的接口和抽象类构成

# Persistence对象

>Persistence对象主要作用是用于获取EntityManagerFactory对象的

# EntityManagerFactory

>EntityManagerFactory 接口主要用来创建 EntityManager 实例

# EntityManager

>在 JPA 规范中, EntityManager是完成持久化操作的核心对象

```
getTransaction : 获取事务对象
persist ： 保存操作
merge ： 更新操作
remove ： 删除操作
find/getReference ： 根据id查询
```

# EntityTransaction

begin,commit,rollback

# 使用

创建classpath:META-INF/persistence.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<persistence xmlns="http://java.sun.com/xml/ns/persistence" version="2.0">

    <!--持久化单元名称-->  <!--事务类型-->
    <persistence-unit  name="jpa" transaction-type="RESOURCE_LOCAL">
        <!--实现方式-->
        <provider>org.hibernate.jpa.HibernatePersistenceProvider</provider>

        <properties>
            <!--数据库信息-->
            <property name="javax.persistence.jdbc.user" value="root"/>
            <property name="javax.persistence.jdbc.password" value="123"/>
            <property name="javax.persistence.jdbc.driver" value="com.mysql.cj.jdbc.Driver"/>
            <property name="javax.persistence.jdbc.url" value="jdbc:mysql:///ssm"/>
            <!--实现方信息-->
            <property name="hibernate.show_sql" value="true"/>
            <!--create:每次启动都会创建（存在则删除） update:不存在表则创建 none:不操作-->
            <property name="hibernate.hbm2ddl.auto" value="update"/>
        </properties>
    </persistence-unit>
</persistence>
```

创建实体类

```java
@Entity
@Table(name = "cst_customer")
@Data
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cust_id")
    /*
    * IDENTITY：底层数据库必须支持自动增长
    * SEQUENCE: 底层数据库必须支持序列
    * TABLE:jpa提供的机制
    * AUTO:由程序自动选择策略
    * */
    private Long custId;

    @Column(name = "cust_name")
    private String custName;

    @Column(name = "cust_source")
    private String custSource;

    @Column(name = "cust_level")
    private String custLevel;

    @Column(name = "cust_industry")
    private String custIndustry;

    @Column(name = "cust_phone")
    private String custPhone;

    @Column(name = "cust_address")
    private String custAddress;
    
}
```

## 操作

- 添加

```java
        EntityManager manager = Persistence
        .createEntityManagerFactory("jpa").createEntityManager();
        EntityTransaction tx = manager.getTransaction();
        tx.begin();

        Customer customer = new Customer();
        customer.setCustName("老王");
        customer.setCustIndustry("隔壁");
        manager.persist(customer);

        tx.commit();
        manager.close();
```

- 根据ID查询

```java
Customer customer = entityManager.find(Customer.class, 1L); // 立即加载
Customer customer = entityManager.getReference(Customer.class, 1L); // 延迟加载
```

- 删除

```java
Customer customer = entityManager.find(Customer.class, 1L);
entityManager.remove(customer);
```

- 更新

```java
Customer customer = entityManager.find(Customer.class, 2L);
customer.setCustName("老王八");
entityManager.merge(customer);
```

# JPQL

>基于首次在EJB2.0中引入的EJB查询语言(EJB QL),Java持久化查询语言(JPQL)是一种可移植的查询语言，旨在以面向对象表达式语言的表达式，将SQL语法和简单查询语义绑定在一起·使用这种语言编写的查询是可移植的，可以被编译成所有主流数据库服务器上的SQL

- 查询全部

```java
String jpql = "FROM Customer ";
List list = entityManager.createQuery(jpql).getResultList();
for (Object o : list) {
    System.out.println(o);
}
```

- 倒序查询

```sql
FROM Customer ORDER BY custId DESC
```

- 统计查询

```sql
SELECT COUNT(custId) FROM Customer
```

- 分页查询

```java
String jpql = "FROM Customer";
List list = entityManager.createQuery(jpql)
                .setFirstResult(0)
                .setMaxResults(2).getResultList();
```

- 条件查询

```java
String jpql = "FROM Customer WHERE custName LIKE ?1";
List list = entityManager.createQuery(jpql)
                .setParameter(1,"%李%")
                .getResultList();
```












