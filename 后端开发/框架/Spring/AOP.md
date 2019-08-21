# 动态代理

- 基于接口
- 基于子类

```java
public class Main {

    public static void main(String[] args) {
        Bean bean = (Bean) Enhancer.create(Bean.class, new MethodInterceptor() {
            private Bean bean = new Bean();
            @Override
            public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
                System.out.println(method);
                return method.invoke(bean,objects);
            }
        });

        bean.run();
    }
}

class Bean{
    public void run(){
        System.out.println("bean run");
    }
}
```

# AOP

## AOP简介

![enter image description here](https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=764221332,501156740&fm=26&gp=0.jpg)

## AOP术语

- 通知(Advice):所谓通知是指拦截到Joinpoint之后所要做的事情就是通知

  - 前置通知（before）:执行前执行
  - 后置通知（after）：执行后执行
  - 返回通知（after returning）
  - 异常通知（after throwing）
  - 环绕通知（around）

_使用xml时，后置通知与返回通知以及异常通知的执行顺序取决于配置顺序_

- 连接点(Joinpoint):所谓连接点是指那些被拦截到的点。在spring中,这些点指的是方法,因为spring只支持方法类型的连接点。
- 切点(Pointcut):所谓切入点是指我们要对哪些Joinpoint进行拦截的定义。
- 切面(Aspect):是切入点和通知（引介）的结合。
- 引入(Introduction):引介是一种特殊的通知在不修改类代码的前提下, Introduction可以在运行期为类动态地添加一些方法或Field。
- 织入(Weaving):是指把增强应用到目标对象来创建新的代理对象的过程。

## 编写切点

- AspectJ指示器

![enter image description here](https://oscimg.oschina.net/oscnet/48381d18d1889691ae28357968adbfa3408.jpg)

- 一个简单的切点实例

```
execution(* wang.ismy.spring.service.Service.doSth(..))
```

### execution

![](https://img2018.cnblogs.com/blog/475392/201810/475392-20181031104431559-1365885037.png)

## 创建切面

```java
@Aspect
@Component
@Slf4j
public class ErrorPageAspect {

    @Pointcut("@annotation(wang.ismy.zbq.annotations.ErrorPage)")
    public void pointCut(){}

    @Around("pointCut()")
    public Object around(ProceedingJoinPoint joinPoint){
        try {
            return joinPoint.proceed();
        } catch (Throwable throwable) {

            ModelAndView modelAndView = new ModelAndView();
            modelAndView.setViewName("error");
            modelAndView.addObject("error",throwable.getMessage());

            return modelAndView;
        }

    }
}
```

### 使用xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/aop
        https://www.springframework.org/schema/aop/spring-aop.xsd">

    <aop:config>
        <!--配置切面-->
        <aop:aspect id="loggerAdvice" ref="logger">
            <aop:around method="log" pointcut="execution(* wang.ismy.spring.service.Service.doSth(..))"/>
        </aop:aspect>
    </aop:config>

    <bean class="wang.ismy.spring.service.impl.ServiceImpl"/>
    <bean id="logger" class="wang.ismy.spring.Logger"/>
</beans>
```

# 事务

## 属性

- read-only：是否是只读事务。默认false，不只读。
- isolation：指定事务的隔离级别。默认值是使用数据库的默认隔离级别。
- propagation：指定事务的传播行为。
- timeout：指定超时时间。默认值为：-1。永不超时。
- rollback-for：用于指定一个异常，当执行产生该异常时，事务回滚。产生其他异常，事务不回滚。没有默认值，任何异常都回滚。
- no-rollback-for：用于指定一个异常，当产生该异常时，事务不回滚，产生其他异常时，事务回滚。没有默认值，任何异常都回滚。

## 使用xml进行配置

- 声明式事务

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop" xmlns:tx="http://www.springframework.org/schema/tx"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/aop
        https://www.springframework.org/schema/aop/spring-aop.xsd http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx.xsd">

    <bean class="wang.ismy.spring.Dao">
        <constructor-arg ref="template"/>
    </bean>

    <bean id="dataSource" class="org.springframework.jdbc.datasource.DriverManagerDataSource">
        <property name="username" value="root"/>
        <property name="password" value="123"/>
        <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql:///mybatis"/>
    </bean>

    <bean id="template" class="org.springframework.jdbc.core.JdbcTemplate">
        <constructor-arg name="dataSource" ref="dataSource"/>
    </bean>

    <bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource"/>
    </bean>

    <!--配置事务的通知-->
    <tx:advice id="txAdvice" transaction-manager="transactionManager">
        <tx:attributes>
            <tx:method name="transfer" propagation="REQUIRED" read-only="false"/>
        </tx:attributes>
    </tx:advice>

    <!--配置aop-->
    <aop:config>
        <aop:pointcut id="txPt" expression="execution(* wang.ismy.spring.Dao.*(..))"/>
        <!--建立切入点表达式与事务通知的关系-->
        <aop:advisor advice-ref="txAdvice" pointcut-ref="txPt"/>
    </aop:config>
</beans>
```

```java
public class Dao {

    private JdbcTemplate jdbcTemplate;

    public Dao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void transfer(){
        String sql = "UPDATE account SET money = money -200 WHERE uid = 41";
        String sql1 = "UPDATE account SET money = money +200 WHERE uid = 45";
        jdbcTemplate.update(sql);
        jdbcTemplate.update(sql1);
    }
}
```

## 注解配置

```java
@Configuration
@EnableTransactionManagement
public class Config {

    @Bean
    public DataSource dataSource(){
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUsername("root");
        dataSource.setPassword("123");
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql:///mybatis");
        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource){
        return new JdbcTemplate(dataSource);
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource){
        return new DataSourceTransactionManager(dataSource);
    }
}
```

```java
@Service
public class Dao {

    private JdbcTemplate jdbcTemplate;

    public Dao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(rollbackFor = Exception.class)
    public void transfer(){
        String sql = "UPDATE account SET money = money -200 WHERE uid = 41";
        String sql1 = "UPDATE account SET money = money +200 WHERE uid = 45";

        jdbcTemplate.update(sql);
        jdbcTemplate.update(sql1);
    }
}
```

- 编程式事务

```java
    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager manager){
        return new TransactionTemplate(manager);
    }
```

```java
@Service
public class Dao {

    private JdbcTemplate jdbcTemplate;

    private TransactionTemplate transactionTemplate;

    public Dao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void transfer(){
        transactionTemplate.execute((TransactionCallback<Void>) status -> {
            String sql = "UPDATE account SET money = money -200 WHERE uid = 41";
            String sql1 = "UPDATE account SET money = money +200 WHERE uid = 45";
            jdbcTemplate.update(sql);
            jdbcTemplate.update(sql1);
            return null;
        });
    }

    @Autowired
    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }
}
```

