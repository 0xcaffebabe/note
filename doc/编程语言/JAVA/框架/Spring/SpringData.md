# Spring Data

- Spring的数据访问哲学

![202081191941](/assets/202081191941.png)

## Spring的数据访问异常体系

**SQLException**

- 提供了挺多的异常
- 数据访问模板化

## 配置数据源

- 使用JNDI
- 使用数据源连接池

```java
@Bean
public DataSource dataSource(){
    DruidDataSource dataSource = new DruidDataSource();
    dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
    dataSource.setUsername("root");
    dataSource.setPassword("Root@@715711877");
    dataSource.setUrl("jdbc:mysql:///manage");
    return dataSource;
}
```

- 使用嵌入式数据源

## 使用profile选择数

```java
@Profile("product")
    @Bean
    public DataSource dataSource(){

        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setUrl("jdbc:h2:~/test");
        return dataSource;
    }

    @Profile("dev")
    @Bean
    public DataSource dataSourceDev(){

        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUsername("root");
        dataSource.setPassword("Root@@715711877");
        dataSource.setUrl("jdbc:mysql:///manage");
        return dataSource;
    }
```

## 在Spring 当中使用JDBC

### JDBC模板

*JdbcDaoSupport*

- update():执行DML语句。增、删、改语句
- queryForMap():查询结果将结果集封装为map集合，将列名作为key，将值作为value 将这条记录封装为一个map集合

  - 注意：这个方法查询的结果集长度只能是1

- queryForList():查询结果将结果集封装为list集合

  - 注意：将每一条记录封装为一个Map集合，再将Map集合装载到List集合中

- query():查询结果，将结果封装为JavaBean对象

  - query的参数：RowMapper

    - 一般我们使用BeanPropertyRowMapper实现类。可以完成数据到JavaBean的自动封装
    - new BeanPropertyRowMapper<类型>(类型.class)

- queryForObject：查询结果，将结果封装为对象

  - 一般用于聚合函数的查询

- 配置模板

```java
@Bean
    public JdbcTemplate jdbcTemplate(){
        JdbcTemplate jdbcTemplate = new JdbcTemplate();
        jdbcTemplate.setDataSource(dataSourceDev());
        return jdbcTemplate;
    }
```

- 执行操作

```java
@org.springframework.stereotype.Service
public class Service {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void insert(Admin admin){
        jdbcTemplate.update("INSERT INTO admin(username,password) VALUES(?,?)",
                admin.getUsername(),
                admin.getPassword());
    }
}
```

#### 使用Lambda表达式

```java
jdbcTemplate.query("select * from admin",r->{

    do{
        System.out.println(
                r.getString("username")+"||"+r.getString("password")
        );
    }while (r.next());

});
```

#### 使用命名参数

```java
public void insert(Admin admin){
    jdbcTemplate.update("INSERT INTO admin(username,password) VALUES(:username,:password)",
            Map.of("username",admin.getUsername(),
                    "password",admin.getPassword()));
}
```

## JPA

需要的一些复杂特性

- 延迟加载
- 预先抓取
- 级联

### [集成 Hibernate](/编程语言/JAVA/JakartaEE/JPA.md)

### Spring与JAVA持久化API

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

#### 自定义查询方法

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

#### 动态查询

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

#### 多表操作

##### 一对多

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

##### 多对多

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

#### 对象导航

```java
public enum FetchType {
    LAZY,EAGER
}
```

## 缓存数据

### 启用缓存支持

```java
@Configuration
@ComponentScan("wang.ismy.spring")
@EnableCaching
public class Config {

    @Bean
    public CacheManager cacheManager(){
        return new ConcurrentMapCacheManager();
    }

}
```

- Spring 提供的几个缓存管理器 ![批注 2019-06-21 150246](/assets/批注%202019-06-21%20150246.png)

#### 让方法支持缓存

```java
@Cacheable(value = "find",key = "#id")
public String find(Integer id){
    System.out.println("real find");
    return "hello world"+id;
}
```

- 将值放到缓存当中

  ```java
  /**
  * 该方法肯定会被执行，但是返回结果会放到缓存当中
  */
  @CachePut(value = "find",key = "#id")
  public String put(Integer id){
    return "new"+id;
  }
  ```

- 条件化缓存

  - unless : 阻止将对象放入缓存，但是还会进行缓存查找
  - condition : 不会进行缓存查找，也不会将结果放入缓存

在id等于10时不会进行缓存

```java
@Cacheable(value = "find",key = "#id",condition = "#id != 10")
public String find(Integer id){
    System.out.println("real find");
    return "hello world"+id;
}
```

- 移除缓存

```java
@CacheEvict(value = "find",key = "#id")
public void remove(Integer id){}
```

### 使用xml添加缓存
