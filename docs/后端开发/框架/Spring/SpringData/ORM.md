> ORM（Object-Relational Mapping） 表示对象关系映射。在面向对象的软件开发中，通过ORM，就可以把对象映射到关系型数据库中。只要有一套程序能够做到建立对象与数据库的关联，操作对象就可以直接操作数据库数据，就可以说这套程序实现了ORM对象关系映射

# JPA

# 需要的一些复杂特性

- 延迟加载
- 预先抓取
- 级联

# [集成 Hibernate](/后端开发/JakartaEE/JPA.md)

# Spring与JAVA持久化API

- 配置实体管理器工厂

```java
@Configuration
@ComponentScan("wang.ismy.spring")
@EnableJpaRepositories(basePackages = "wang.ismy.spring",entityManagerFactoryRef = "entityManagerFactoryBean")
public class Config {

    @Bean
    public DataSource dataSourceDev(){

        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUsername("root");
        dataSource.setPassword("Root@@715711877");
        dataSource.setUrl("jdbc:mysql:///manage");
        return dataSource;
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactoryBean(DataSource dataSource,
                                                                           JpaVendorAdapter adapter){
        LocalContainerEntityManagerFactoryBean bean =
                new LocalContainerEntityManagerFactoryBean();
        bean.setDataSource(dataSource);
        bean.setJpaVendorAdapter(adapter);
        bean.setPackagesToScan("wang.ismy.spring");
        return bean;
    }

    @Bean
    public JpaVendorAdapter jpaVendorAdapter(){
        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        adapter.setDatabase(Database.MYSQL);
        adapter.setGenerateDdl(false);
        adapter.setDatabasePlatform("org.hibernate.dialect.MySQL5InnoDBDialect");
        return adapter;
    }

    @Bean(name = "transactionManager")
    public PlatformTransactionManager transactionManager(EntityManagerFactory bean, DataSource dataSource) {
        JpaTransactionManager tm =
                new JpaTransactionManager();
        tm.setEntityManagerFactory(bean);
        tm.setDataSource(dataSource);
        return tm;
    }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:jpa="http://www.springframework.org/schema/data/jpa"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
     https://www.springframework.org/schema/beans/spring-beans.xsd
     http://www.springframework.org/schema/data/jpa
     https://www.springframework.org/schema/data/jpa/spring-jpa.xsd">
    <jpa:repositories base-package="wang.ismy.jms" transaction-manager-ref="transactionManager" entity-manager-factory-ref="entityManagerFactory"/>
    <bean id="transactionManager" class="org.springframework.orm.jpa.JpaTransactionManager">
        <property name="entityManagerFactory" ref="entityManagerFactory"/>
    </bean>
    <bean id="dataSource" class="com.alibaba.druid.pool.DruidDataSource">
        <property name="username" value="root"/>
        <property name="password" value="123"/>
        <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql:///ssm"/>
    </bean>

    <bean id="entityManagerFactory" class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean">
        <property name="dataSource" ref="dataSource"/>
        <!--扫描实体类-->
        <property name="packagesToScan" value="wang.ismy.jms"/>
        <!--服务提供者-->
        <property name="persistenceProvider">
            <bean class="org.hibernate.jpa.HibernatePersistenceProvider"/>
        </property>
        <!--服务提供者适配器-->
        <property name="jpaVendorAdapter">
            <bean class="org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter">
                <property name="generateDdl" value="false" />
                <property name="database" value="MYSQL" />
                <property name="databasePlatform" value="org.hibernate.dialect.MySQLDialect" />
                <property name="showSql" value="true" />
            </bean>
        </property>
        <!--高级特性-->
        <property name="jpaDialect">
            <bean class="org.springframework.orm.jpa.vendor.HibernateJpaDialect"/>
        </property>
    </bean>
</beans>
```

- 从JNDI中获取实体管理器工厂

## 编写基于JPA的Repository

- 实体类

```java
@Data
@Entity
@Table(name = "admin")
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String username;

    private String password;
}
```

- Repository类

```java
public interface AdminRepository extends JpaRepository<Admin,Integer> { }
```

- 使用

```java
adminRepository.findAll();
```

## 自定义查询方法

```java
public interface AdminRepository extends JpaRepository<Admin,Integer> { 

    Admin findbyUsername(String username);
}
```

- 一些关键词

Keyword           | Sample                                  | JPQL
----------------- | --------------------------------------- | ----------------------------------------------------------------
And               | findByLastnameAndFirstname              | ... where x.lastname = ?1 and x.firstname = ?2
Or                | findByLastnameOrFirstname               | ... where x.lastname = ?1 or x.firstname = ?2
Is,Equals         | findByFirstnameIs,findByFirstnameEquals | ... where x.firstname = ?1
Between           | findByStartDateBetween                  | ... where x.startDate between ?1 and ?2
LessThan          | findByAgeLessThan                       | ... where x.age < ?1
LessThanEqual     | findByAgeLessThanEqual                  | ... where x.age ⇐ ?1
GreaterThan       | findByAgeGreaterThan                    | ... where x.age > ?1
GreaterThanEqual  | findByAgeGreaterThanEqual               | ... where x.age >= ?1
After             | findByStartDateAfter                    | ... where x.startDate > ?1
Before            | findByStartDateBefore                   | ... where x.startDate < ?1
IsNull            | findByAgeIsNull                         | ... where x.age is null
IsNotNull,NotNull | findByAge(Is)NotNull                    | ... where x.age not null
Like              | findByFirstnameLike                     | ... where x.firstname like ?1
NotLike           | findByFirstnameNotLike                  | ... where x.firstname not like ?1
StartingWith      | findByFirstnameStartingWith             | ... where x.firstname like ?1 (parameter bound with appended %)
EndingWith        | findByFirstnameEndingWith               | ... where x.firstname like ?1 (parameter bound with prepended %)
Containing        | findByFirstnameContaining               | ... where x.firstname like ?1 (parameter bound wrapped in %)
OrderBy           | findByAgeOrderByLastnameDesc            | ... where x.age = ?1 order by x.lastname desc
Not               | findByLastnameNot                       | ... where x.lastname <> ?1
In                | findByAgeIn(Collection ages)            | ... where x.age in ?1
NotIn             | findByAgeNotIn(Collection age)          | ... where x.age not in ?1
TRUE              | findByActiveTrue()                      | ... where x.active = true
FALSE             | findByActiveFalse()                     | ... where x.active = false
IgnoreCase        | findByFirstnameIgnoreCase               | ... where UPPER(x.firstame) = UPPER(?1)

- 使用SQL

```java
@Query(value = "SELECT * FROM admin WHERE username = 'admin'",nativeQuery = true)
Admin selfCondition();
```

- 使用JPQL

```java
@Query("FROM Customer WHERE custName = ?1")
List<Customer> findByJPQL(String name);

// 更新操作
@Query("UPDATE Customer SET custName = ?2 WHERE custId = ?1")
@Modifying
int update(Long id,String name);
```

## 动态查询

_JpaSpecificationExecutor_

_Specification_

- 示例

```java
        Specification<Customer> spec = (Specification<Customer>) (root/*比较的属性*/, query, cb/*查询方式*/) -> {
            Path<Object> custName = root.get("custName");
            return cb.equal(custName,"老王八");
        };
        Optional<Customer> one = repository.findOne(spec);

        System.out.println(one.get());
```

- 条件拼接

```java
        Specification<Customer> spec = (Specification<Customer>) (root/*比较的属性*/, query, cb/*查询方式*/) -> {
            Path<Object> custName = root.get("custName");
            Path<Object> custIndustry = root.get("custIndustry");

            var p1 = cb.equal(custName,"老王八");
            var p2 = cb.equal(custIndustry,"隔壁");

            return  cb.and(p1,p2);
        };
```

- 模糊查询

```java
        Specification<Customer> spec = (Specification<Customer>) (root/*比较的属性*/, query, cb/*查询方式*/) -> {
            Path<Object> custName = root.get("custName");

            return cb.like(custName.as(String.class),"%老%");
        };
        repository.findAll(spec).forEach(System.out::println);
```

- 排序

```java
repository.findAll(spec, new Sort(Sort.Direction.DESC,"custId")).forEach(System.out::println);
```

- 分页

```java
repository.findAll(PageRequest.of(0,3)).forEach(System.out::println);
```

Page接口

```java
public interface Page<T> extends Slice<T> {

	static <T> Page<T> empty() {
		return empty(Pageable.unpaged());
	}

	static <T> Page<T> empty(Pageable pageable) {
		return new PageImpl<>(Collections.emptyList(), pageable, 0);
	}

	int getTotalPages();

	long getTotalElements();

	<U> Page<U> map(Function<? super T, ? extends U> converter);
}
```

## 多表操作

### 一对多

- 主表

```java
@OneToMany(targetEntity = LinkMan.class)
    @JoinColumn(name = "lkm_cust_id",referencedColumnName = "cust_id")
    private Set<LinkMan> linkMan = new HashSet<>(0);
```

- 从表

```java
   @ManyToOne(targetEntity = Customer.class)
    @JoinColumn(name = "lkm_cust_id",referencedColumnName = "cust_id")
    private Customer customer;
```

- 操作

```java
        Customer customer = new Customer();
        customer.setCustName("20190908");

        LinkMan man = new LinkMan();
        man.setLkmName("小婊砸");
        man.setCustomer(customer);
        customerRepository.save(customer);
        linkManRepository.save(man);
```

- 放弃外键维护

```java
@OneToMany(mappedBy = "customer")
```

- 级联添加

```java
@OneToMany(mappedBy = "customer",cascade = CascadeType.ALL)
```

```java
        Customer customer = new Customer();
        customer.setCustName("20190908");

        LinkMan man = new LinkMan();
        man.setLkmName("小婊砸");
        man.setCustomer(customer);
        customer.getLinkMans().add(man);

        customerRepository.save(customer);
```

- 级联删除

```java
Optional<Customer> cus = customerRepository.findById(1L);
customerRepository.delete(cus.get());
```

### 多对多

```java
    @ManyToMany(targetEntity = Role.class)
    @JoinTable(name = "user_role",joinColumns = {@JoinColumn(name = "user_id",referencedColumnName = "user_id")},
            inverseJoinColumns = {@JoinColumn(name = "role_id",referencedColumnName = "role_id")})
    private Set<Role> roleSet  = new HashSet<>();
```

```java
    @ManyToMany(targetEntity = User.class)
    @JoinTable(name = "user_role",joinColumns ={@JoinColumn(name = "role_id",referencedColumnName = "role_id")},
            inverseJoinColumns =  {@JoinColumn(name = "user_id",referencedColumnName = "user_id")})
    private Set<User> userSet = new HashSet<>();
```

```java
        User user = new User();
        user.setUsername("老王");

        Role role = new Role();
        role.setRoleName("隔壁");
        user.getRoleSet().add(role);
        userDao.save(user);
        roleDao.save(role);
```

- 级联

## 对象导航

```java
public enum FetchType {
    LAZY,EAGER
}
```









