# Bean 注册

Spring的配置方案

- XML
- JAVA
- 自动装配

## 自动化装配

自动化装配指的是通过一系列描述性代码，描述Bean对象之间的依赖关系，从而交由Spring自动组装出来，目前有两种方式：

- 组件扫描
- 自动装配

### @Component注解

```java
@Component // 将当前类对象存入容器
public class Tea {...}
```

Spring自动注入

```java
@Component
  public class Cup {

    private Tea tea;

    @Autowired
    public Cup(Tea tea) {
        this.tea = tea;
    }
  }
```

其他功能一样，但语义不同的注解：

- @Controller
- @Service
- @Repository

### @ComponentScan注解

创建一个组件扫描配置：

```java
@ComponentScan(basePackages = "wang.ismy.spring")
public class Config {}
```

#### 指定扫描策略

```java
@ComponentScan(value = "*",
        excludeFilters = {
                @Filter(type = FilterType.ANNOTATION,
                        classes = {Controller.class, Repository.class}),
                @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = User.class)
        })
```

1. 根据注解来排除（type = FilterType.ANNOTATION）,这些注解的类型为classes = {Controller.class, Repository.class}。即Controller和Repository注解标注的类不再被纳入到IOC容器中。

2. 根据指定类型类排除（type = FilterType.ASSIGNABLE_TYPE），排除类型为User.class，其子类，实现类都会被排除。

#### 自定义扫描策略

```java
@ComponentScan(value = "*",
        excludeFilters = {
            @Filter(type = FilterType.CUSTOM, classes = MyTypeFilter.class)
        })
...
public class MyTypeFilter implements TypeFilter {
    @Override
    public boolean match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory) {...}
}
```

### 获取context使用bean

```java
AnnotationConfigApplicationContext context = 
                new AnnotationConfigApplicationContext(Config.class);
context.getBean(Bean.class).say();
```

### 处理自动装配歧义性

- @Resource注解：使用该注解可以直接指定bean name，该注解非spring提供

- 标示首选bean @Primary注解

```java
@Bean
@Primary // 当有多个可选项时，将优先使用这个bean
public Bean1 bean1(){
    Bean1 bean1 = new Bean1();
    bean1.setName("pro");
    return bean1;
}
```

- 限定自动装配的bean

```java
@Autowired
@Qualifier("bean1f") // 当有多个可选项时，将使用名为bean1f的bean
public void setBean1(Bean1 bean1){}
```

*@Qualifier也可以用在方法参数上*

## 导入

```java
@ImportResource("classpath:spring.xml") // 导入xml配置
@Import(Config.class) // 导入java代码配置
@Import(MyImportSelector.class) // 自定义导入策略
public class Config {}

public class MyImportSelector implements ImportSelector {
    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        return new String[]{
                "*",
                "*",
                "*"
        };
    }
}
```

## 使用FactoryBean注册组件

```java
public class CherryFactoryBean implements FactoryBean<Cherry> {
    @Override
    public Cherry getObject() {
        return new Cherry();
    }

    @Override
    public Class<?> getObjectType() {
        return Cherry.class;
    }

    @Override
    public boolean isSingleton() {
        return false;
    }
}
```

如果我们要获取cherryFactoryBean本身，则可以这样做：

```java
context.getBean("&cherryFactoryBean");
```

## @Profile

通过编写不同的profile，以此达到切换不同的profile，装配不同Bean的功能

- 手动编写不同profile的配置

```java
@Configuration
@Profile("pro")
public class Config1 {
  @Bean
  public Bean1 bean1(){
      Bean1 bean1 = new Bean1();
      bean1.setName("pro");
      return bean1;
  }
}
```
```java
@Configuration
@Profile("dev")
public class Config {
  @Bean
  public Bean1 bean1(){
      Bean1 bean1 = new Bean1();
      bean1.setName("dev");
      return bean1;
  }
}
```

- 激活profile

```java
System.setProperty("spring.profiles.active","pro");
AnnotationConfigApplicationContext context =
        new AnnotationConfigApplicationContext(MasterConfig.class);
context.getBean(Bean1.class).run();
```

## 条件化装配

@Conditional注解

```java
@Bean
  @Conditional(MyConditional.class)
  public Bean1 bean1(){
      Bean1 bean1 = new Bean1();
      bean1.setName("pro");
      return bean1;
  }
```

只要自定实现Condition接口，就可以控制bean的装配：

```java
public class MyConditional implements Condition {

  @Override
  public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
      // ...
      return true;
  }
}
```

## JAVA代码装配

由于某些类来源于外部，我们无法修改其源码如在类上加上@Component注解来注入容器，所以可以使用java代码的方式创建后注入

```java
@Configuration
public class Config {

    @Bean // 默认值是方法名称
    public wang.ismy.spring.Bean bean(Bean1 bean1){return new wang.ismy.spring.Bean(bean1);}

    @Bean
    public Bean1 bean1(){return new Bean1();}
}
```

## 作用域

- singleton：单例
- prototype：每次获取都会创建实例
- session：每个会话一个bean
- request：每个请求一个bean
- global session：应用在Portlet环境.如果没有Portlet环境那么globalSession相当于session

### 使用

```java
@Component
@Scope("prototype")
public class Bean { }
```

```xml
<bean scope="prototype" class="wang.ismy.spring.Bean"/>
```

### 懒加载@Lazy

使用该注解后，Bean只有在真正需要时才会被初始化，而非在容器启动后就被初始化

## 使用XML配置

由于spring早期大量使用xml来配置，所以这节的内容还是需要了解一下的。 不过对于新项目，还是推荐使用注解或者java配置

- 创建一个xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

</beans>
```

- 创建一个bean

```xml
<!--方式1-->
<bean class="wang.ismy.spring.Bean"/>
<!--方式2：普通工厂创建-->
<bean id="factory" class="wang.ismy.spring.Factory"/>
<bean factory-bean="factory" factory-method="get"/>
<!--方式3：静态工厂-->
<bean class="wang.ismy.spring.Factory" factory-method="get"/>
```

- 生命周期方法回调

```xml
<!--只有作用范围是单例时destroy才会被调用-->
<bean scope="singleton" class="wang.ismy.spring.Bean" 
init-method="init" destroy-method="destroy"/>
```

- 属性注入

```java
public class Bean1 {

    private String name;

    public void setName(String name){ this.name = name;}
}
```

```xml
<bean class="wang.ismy.spring.Bean1">
        <property name="name" value="hello"/>
</bean>
```

- 构造器注入

  - constructor-arg标签

    - index:指定参数在构造函数参数列表的索引位置
    - type:指定参数在构造函数中的数据类型
    - name:指定参数在构造函数中的名称
    - value:它能赋的值是基本数据类型和String类型
    - ref:它能赋的值是其他bean类型，也就是说，必须得是在配置文件中配置过的bean

```xml
<bean class="wang.ismy.spring.Bean">
    <constructor-arg name="name" value="abc"/>
    <constructor-arg name="value" value="-1"/>
</bean>

<bean name="bean1" class="wang.ismy.spring.Bean1"/>
<bean class="wang.ismy.spring.Bean">
    <constructor-arg ref="bean1"/>
</bean>
```

- 集合注入

```xml
<bean class="wang.ismy.spring.Bean">
        <!--注入数组-->
        <property name="array">
            <array> <value>AAA</value> <value>BBB</value> <value>CCC</value> </array>
        </property>
        <!--注入集合-->
        <property name="set">
            <set> <value>AAA</value> <value>BBB</value> <value>CCC</value> </set>
        </property>
        <!--注入list-->
        <property name="list">
            <list> <value>AAA</value> <value>BBB</value> <value>CCC</value> </list>
        </property>
        <!--注入map-->
        <property name="map">
            <map>
                <entry key="a" value="a"/>
                <entry key="b" value="b"/>
            </map>
        </property>
        <!--注入properties-->
        <property name="prop">
            <props>
                <prop key="a">a</prop>
                <prop key="b">b</prop>
            </props>
        </property>
    </bean>
```

- 使用xml配置运行：

```java
ClassPathXmlApplicationContext context =
                new ClassPathXmlApplicationContext("classpath:spring.xml");
context.getBean(Bean1.class).run();
```

## 运行时值注入

```java
@Configuration
@ComponentScan(basePackages = "wang.ismy.spring")
@PropertySource("classpath:config.properties")
public class Config { }
```

config.properties

```properties
name=my
```

```java
@Component
public class Bean {
  @Value("${name}")
  String name;
}
```

### Spring EL表达式

- 使用

```java
@Component
public class Bean {
  @Value("#{T(System).currentTimeMillis()}")
  long time;

  public void run(){
      System.out.println(time);
  }
}
```

## 循环依赖

当一个对象依赖的对象间接或直接又依赖其本身时，就是循环依赖。

针对于这种依赖情况，对于属性注入或者方法注入，Spring通过先创建对象实例，后填充其属性的方式来解决循环依赖，但对于通过构造器注入的情况，Spring则无法解决。

![202153193741](/assets/202153193741.svg)

![202153193815](/assets/202153193815.svg)
