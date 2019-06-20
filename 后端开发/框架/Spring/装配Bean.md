# Spring的配置方案

- XML
- JAVA
- 自动装配

# 自动化装配

- 组件扫描
- 自动装配 创建一个Bean，加上@Component：

  ```java
  @Component
  public class Bean {

    public void say(){
        System.out.println("hi");
    }
  }
  ```

  创建一个组件扫描配置：

  ```java
  @ComponentScan(basePackages = "wang.ismy.spring")
  public class Config {}
  ```

  获取context使用bean：

  ```java
  AnnotationConfigApplicationContext context = 
                new AnnotationConfigApplicationContext(Config.class);

        context.getBean(Bean.class).say();
  ```

  实现自动装配： bean：

  ```java
  @Component
  public class Bean {

    private Bean1 bean1;

    @Autowired
    public Bean(Bean1 bean1) {
        this.bean1 = bean1;
    }

    public void say(){
        System.out.println("hi");
        bean1.run();
    }
  }
  ```

  bean1:

  ```java
  @Component
  public class Bean1 {

    void run(){
        System.out.println("bean1 run");
    }
  }
  ```

  ## JAVA代码装配

  由于某些类来源于外部，我们无法修改其源码 所以可以使用java代码的方式创建后注入：

  ```java
  @Configuration
  public class Config {

    @Bean
    public wang.ismy.spring.Bean bean(Bean1 bean1){
        return new wang.ismy.spring.Bean(bean1);
    }

    @Bean
    public Bean1 bean1(){
        return new Bean1();
    }
  }
  ```

  ## 使用XML配置

  由于spring早期大量使用xml来配置，所以这节的内容还是需要了解一下的。 不过对于新项目，还是推荐使用注解或者java配置

- 创建一个xml ```xml <?xml version="1.0" encoding="UTF-8"?>

  <beans xmlns="http://www.springframework.org/schema/beans" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemalocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
  </beans>

````
- 创建一个bean
```xml
<bean class="wang.ismy.spring.Bean1"/>
````

- - 使用构造器注入

    ```xml
    <bean name="bean1" class="wang.ismy.spring.Bean1"/>

    <bean class="wang.ismy.spring.Bean">
        <constructor-arg ref="bean1"/>
    </bean>
    ```

- - 设置属性 bean1：

    ```java
    public class Bean1 {

    private String name;

    public void run(){
        System.out.println(name);
    }

    public void setName(String name){
        this.name = name;
    }
    }
    ```

    配置：

    ```xml
    <bean class="wang.ismy.spring.Bean1">
        <property name="name" value="hello"/>
    </bean>
    ```

- 使用xml配置：

  ```java
  ClassPathXmlApplicationContext context =
                new ClassPathXmlApplicationContext("classpath:spring.xml");

        context.getBean(Bean1.class).run();
  ```

  ## 导入配置

  ```java
  @ImportResource("classpath:spring.xml") // 导入xml配置
  @Import(Config.class) // 导入java代码配置
  public class Config {}
  ```
