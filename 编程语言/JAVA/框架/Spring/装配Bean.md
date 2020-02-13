# Spring的配置方案

- XML
- JAVA
- 自动装配

# 自动化装配

- 组件扫描
- 自动装配

```java
@Component // 将当前类对象存入容器
public class Bean {...}
```

## 延伸

- @Controller
- @Service
- @Repository

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

自动注入

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

## JAVA代码装配

由于某些类来源于外部，我们无法修改其源码 所以可以使用java代码的方式创建后注入

```java
@Configuration
public class Config {

    @Bean // 默认值是方法名称
    public wang.ismy.spring.Bean bean(Bean1 bean1){return new wang.ismy.spring.Bean(bean1);}

    @Bean
    public Bean1 bean1(){return new Bean1();}
}
```

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

## 导入配置

```java
@ImportResource("classpath:spring.xml") // 导入xml配置
@Import(Config.class) // 导入java代码配置
public class Config {}
```
