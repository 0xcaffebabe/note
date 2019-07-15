# 基本配置

- spring boot 添加依赖

  ```xml
  <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.1.2</version>
  </dependency>
  ```

- 定义mapper接口

```java
public interface UserMapper extends BaseMapper<User> { }
```

- 使用

```java
@Autowired
    UserMapper userMapper;

    @Test
    public void test(){
        User user = new User();
        user.setUsername("root");
        user.setPassword("123");
        user.setAge(15);
        user.setCreateTime(LocalDate.now());
        assertEquals(1,userMapper.insert(user));
    }
```

# 查询
- 普通查询
- 条件构造器查询
