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

  ```java
  @Test
    public void test2(){
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.like("username","roo")
                .lt("age",50);
        var list = userMapper.selectList(queryWrapper);
        assertEquals(2,list.size());
        assertEquals("root",list.get(0).getUsername());
        assertEquals("rood",list.get(1).getUsername());
    }
  ```

# 自定义SQL

- 注解

  ```java
  public interface UserMapper extends BaseMapper<User> {

    @Select("SELECT * FROM user ")
    List<User> selectAll();
  }
  ```

- xml 同mybatis

- 分页查询

  - 配置分页插件

    ```java
    @Bean
    public PaginationInterceptor paginationInterceptor(){
        return new PaginationInterceptor();
    }
    ```

  - 查询

    ```java
    @Test
    public void test4(){
        Page<User> page = new Page<>(1,2);

        var list = userMapper.selectPage(page,null).getRecords();
        assertEquals(2,list.size());

    }
    ```

# 更新

```java
@Test
public void test5(){
    UpdateWrapper<User> wrapper = new UpdateWrapper<User>().eq("username","root");
    User user = new User();
    user.setPassword("5678");
    userMapper.update(user, wrapper);
}
```

# 删除

```java
UpdateWrapper<User> wrapper = new UpdateWrapper<User>()
    .eq("username","root");
userMapper.delete(wrapper);
```

# AR模式

- 实体类继承Model

```java
@Data
public class User extends Model<User> {

    private String username;

    private String password;

    private Integer age;

    private LocalDate createTime;
}
```

```java
@Test
    public void test6(){
        User user = new User();
        user.setUsername("20190716");
        user.setPassword("123");
        user.setCreateTime(LocalDate.now());
        user.setAge(111);
        assertTrue(user.insert());
    }
```

# 主键策略

- 设置策略

```java
@TableId(type = IdType.UUID)
private String username;
```

```java
User user = new User();
user.setPassword("1111");
assertTrue(user.insert());
```

# 通过Service



