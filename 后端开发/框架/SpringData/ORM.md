# 需要的一些复杂特性

- 延迟加载
- 预先抓取
- 级联

# 集成 Hibernate

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
return adminRepository.findAll();
```

## 自定义查询方法
```java
public interface AdminRepository extends JpaRepository<Admin,Integer> { 
    
    Admin findbyUsername(String username);
}
```
- 一些关键词
![批注 2019-06-20 143319](/assets/批注%202019-06-20%20143319.png)
![批注 2019-06-20 143412](/assets/批注%202019-06-20%20143412.png)

- 自定义SQL查询
```java
@Query(value = "SELECT * FROM admin WHERE username = 'admin'",nativeQuery = true)
    Admin selfCondition();
```



