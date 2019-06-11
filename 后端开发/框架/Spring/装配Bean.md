# Spring的配置方案
- XML
- JAVA
- 自动装配
# 自动化装配
- 组件扫描
- 自动装配
创建一个Bean，加上@Component：
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
实现自动装配：
bean：
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
由于某些类来源于外部，我们无法修改其源码
所以可以使用java代码的方式创建后注入：
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

