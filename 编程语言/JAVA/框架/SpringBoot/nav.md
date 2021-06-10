# Spring Boot

- 内嵌式容器简化Web项目
- 没有冗余代码生成和XML配置的要求

## 与和SpringCloud

SpringCloud依赖于SpringBoot组件，使用SpringMVC编写HTTP接口，同时SpringCloud是一套完整的微服务解决框架

## 环境搭建

```xml
<parent> <!--继承父工程 -->
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.1.8.RELEASE</version>
</parent>

<dependencies>
    <!--引入依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

```java
@SpringBootApplication
public class Application{
    public static void main(String[] args) {
        SpringApplication.run(Application.class);
    }
}
```

## 热部署

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional>
</dependency>
```

IDEA需要开启自动编译

## 配置

### YML语法

```yml
# 普通数据配置
name: hello

# 对象配置
person:
  name: kb
  age: 3

# 配置数组、集合(字符串)
city:
  - beijing
  - tianjing
  - chongqing

# 配置数组、集合(对象)
student:
  - name: tom
    age: 3
  - name: ll
    age: 2
```

### 属性注入

- @Value

```java
@Value("${name}")
private String name;
```

- @ConfigurationProperties

```java
@RestController
@ConfigurationProperties(prefix = "person")
public class Controller {

    private String name;
    private Integer age;

    @RequestMapping("/hi")
    public String hello(){
        return name+age;
    }

    // 省略setter
}
```

## 全局异常捕获

```java
@ControllerAdvice
public class ErrorHandler {

    @ResponseBody
    @ExceptionHandler(Throwable.class)
    public String error(Exception e){
        return e.getMessage();
    }
}
```

## 异步调用

- 添加`@EnableAsync`
- 在需要异步调用的方法上面添加`@Async`

## 多环境配置

```properties
spring.profiles.active=dev
```

添加开发环境配置文件`application-dev.properties`

## 事务管理

- 依赖

```xml
<dependency>
    <groupId>javax.transaction</groupId>
    <artifactId>javax.transaction-api</artifactId>
    <version>1.3</version>
</dependency>
```

- 添加`@Transactional`

## 多数据源

配置多个DataSource，一个DataSource配置一个事务管理器，声明事务时指定事务管理器， 不同的ORM框架有不同的指定数据源的方式

### jta-atomikos

通过把多个DataSource交给jta事务管理器管理，使用jta事务管理器来解决分布式事务问题

## 打包

### jar

- 添加插件

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
</plugin>
```

- 执行`mvn package`

### war

添加打包插件

- 设置打包方式

```xml
<packaging>war</packaging>
```

- 执行打包命令

## 性能

### 组件自动扫描带来的问题

使用 @SpringBootApplication 注解后，会触发自动配置（ auto-configuration ）和 组件扫描 （ component scanning ）

### JVM参数调整

### 将tomcat改为undertow

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

## 监控中心

Actuator是spring boot的一个附加功能,可在应用程序生产环境时监视和管理应用程序

- 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

- 添加配置

```yml
# 暴露出所有监控接口
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

路径                    | 作用
--------------------- | ----------------------------
/actuator/beans       | 显示应用程序中所有Spring bean的完整列表。
/actuator/configprops | 显示所有配置信息。
/actuator/env         | 陈列所有的环境变量。
/actuator/mappings    | 显示所有@RequestMapping的url整理列表。
/actuator/health      | 显示应用程序运行状况信息 up表示成功 down失败
/actuator/info        | 返回配置中前缀为info的配置项

## 集成其他框架

### 集成freemarker

- 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

- 配置

```properties
spring.freemarker.allow-request-override=false
spring.freemarker.cache=true
spring.freemarker.check-template-location=true
spring.freemarker.charset=UTF-8
spring.freemarker.content-type=text/html
spring.freemarker.expose-request-attributes=false
spring.freemarker.expose-session-attributes=false
spring.freemarker.expose-spring-macro-helpers=false
spring.freemarker.suffix=.ftl
spring.freemarker.template-loader-path=classpath:/templates/
```

- 创建Controller

```java
@Controller
public class HelloController {

    @RequestMapping("hello")
    public String index(ModelMap map){
        map.put("hello","java");
        return "index";
    }
}
```

- 在template目录下创建index.ftl

```html
<body>
    ${hello}
</body>
```

### 集成Mybatis

- 引入依赖

```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.1.0</version>
</dependency>
```

- 配置数据库信息和mybatis配置

```properties
# 数据库连接信息
spring.datasource.username=root
spring.datasource.password=123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql:///ssm
# mybatis相关配置
mybatis.mapper-locations=mappers/*.xml
mybatis.configuration.map-underscore-to-camel-case=true
```

- 配置mybatis包扫描路径

```java
@MapperScan(basePackages = "wang.ismy.springmybatis.mapper")
public class SpringMybatisApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringMybatisApplication.class, args);
    }

}
```

#### 整合PageHelper

- 引入依赖

```xml
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.2.13</version>
</dependency>
```

- 配置

```properties
pagehelper.helperDialect=mysql
pagehelper.reasonable=true
pagehelper.supportMethodsArguments=true
pagehelper.params=count=countSql
pagehelper.page-size-zero=true
```

### 集成Junit

- 导入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

- 建立测试

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class ControllerTest{

    @Autowired
    UserMapper mapper;

    @Test
    public void test(){
        assertNotNull(mapper);
    }
}
```

### 集成Spring data jpa

- 依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

- 配置

```properties
# 数据库连接信息
spring.datasource.username=root
spring.datasource.password=123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql:///ssm

# spring data jpa相关配置
spring.jpa.database=mysql
spring.jpa.show-sql=true
spring.jpa.generate-ddl=true
spring.jpa.hibernate.ddl-auto=update
```

#### 使用通用Mapper

- 依赖

```xml
<dependency>
    <groupId>tk.mybatis</groupId>
    <artifactId>mapper-spring-boot-starter</artifactId>
    <version>2.1.5</version>
</dependency>
```

- 继承

```java
public interface UserMapper extends BaseMapper<User> { }
```

- @MapperScan注解需要使用tk.mybatis包

### 集成Redis

- 依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

- 配置

```properties
# redis相关配置
spring.redis.host=127.0.0.1
spring.redis.port=6379
```

- 使用

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class RedisTest {

    @Autowired
    RedisTemplate<String,String> redisTemplate;

    @Test
    public void test(){
        String name = redisTemplate.boundValueOps("name").get();

        Assert.assertEquals("my",name);
    }
}
```

### 集成swagger

- 依赖

```xml
<dependency>
    <groupId>com.spring4all</groupId>
    <artifactId>swagger-spring-boot-starter</artifactId>
    <version>1.9.1.RELEASE</version>
</dependency>
```

- 配置

```properties
swagger.base-package=wang.ismy.consume
```

```java
@EnableSwagger2Doc
```

#### zuul整合各个微服务文档

- 依赖

```xml
<dependency>
    <groupId>com.spring4all</groupId>
    <artifactId>swagger-spring-boot-starter</artifactId>
    <version>1.9.1.RELEASE</version>
</dependency>
```

- 配置

```java
@Component
@Primary
@EnableSwagger2Doc
class DocumentationConfig implements SwaggerResourcesProvider {
    @Override
    public List<SwaggerResource> get() {
        List resources = new ArrayList<>();

        resources.add(swaggerResource("consumer", "/api-consumer/v2/api-docs", "2.0"));
        return resources;
    }

    private SwaggerResource swaggerResource(String name, String location, String version) {
        SwaggerResource swaggerResource = new SwaggerResource();
        swaggerResource.setName(name);
        swaggerResource.setLocation(location);
        swaggerResource.setSwaggerVersion(version);
        return swaggerResource;
    }
}
```

## 高级

### @ConditionOnXX

条件化注入bean

### 切换内置服务器

- 排除tomcat依赖
- 引入其他内置服务器依赖

### @EnableXX原理

此类注解使用了@Import修饰，通过@Import注解来导入一些配置类

@Import使用：

1. 导入Bean
2. 导入配置类
3. ImportSelector的实现类
    - 自定义需要导入的类逻辑（返回全限定类名）
4. ImportBeanDefinitionRegistrar 实现类
    - 自定义（编程式向IOC容器注册）

### @EnableAutoConfiguration原理

1. @Import AutoConfigurationImportSelector 加载配置类
2. AutoConfigurationImportSelector读取META-INF/spring.factories 加载配置类

### 自定义starter

1. 定义autoconfigure模块
2. 定义starter模块依赖autoconfigure模块
3. 在autoconfigure模块定义META-INF/spring.factories

### 事件监听

- SpringApplicationRunListener
- CommandLineRunner 项目启动后执行（放入ioc容器即可被识别）
- ApplicationRunner 项目启动后执行（放入ioc容器即可被识别）

为了在应用启动成功之后执行某些操作，某些情况下使用InitializingBean接口并不能满足请求，其回调方法afterPropertiesSet在Bean属性被设置后被调用，此时系统的部分组件可能仍处于未初始化状态。

为解决这个问题，可使用Spring的事件监听机制，监听SpringBoot的`AvailabilityChangeEvent<ReadinessState>` 当状态为ReadinessState.ACCEPTING_TRAFFIC，表示应用可以开始准备接收请求了，此时再启动所需要的操作

```java
@EventListener
public void onSystemReady(AvailabilityChangeEvent<ReadinessState> event) {
    if (event.getState().equals(ReadinessState.ACCEPTING_TRAFFIC)) {
        // do something
    }
}
```
