# 环境搭建

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

# 热部署

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional>
</dependency>
```

IDEA需要开启自动编译

# 配置

## YML语法

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

## 属性注入

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

# 集成Mybatis

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

# 集成Junit

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

# 集成Spring data jpa

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

# 集成Redis

- 依赖

```xml
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
            <version>2.1.8.RELEASE</version>
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
