# MybatisPlus

## 基本配置

### spring boot 添加依赖

```xml
<dependency>
  <groupId>com.baomidou</groupId>
  <artifactId>mybatis-plus-boot-starter</artifactId>
  <version>3.1.2</version>
</dependency>
```

### 定义mapper接口

```java
public interface UserMapper extends BaseMapper<User> { }
```

继承 com.baomidou.mybatisplus.core.mapper.BaseMapper 接口后，无需编写 mapper.xml 文件，即可获得[CRUD功能](https://baomidou.com/pages/49cc81/#service-crud-%E6%8E%A5%E5%8F%A3)

### 定义实体类

```java
@TableName("sys_user")
public class User {
    @TableId
    private Long id;
    @TableField("nickname")
    private String name;
    private Integer age;
    private String email;
}
```

[MybatisPlus的注解](https://baomidou.com/pages/223848)

### 使用

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

## 查询

### 普通查询

### 条件构造器查询

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

#### [AbstractWrapper](https://baomidou.com/pages/10c804/#abstractwrapper)

- [规格模式](/软件工程/领域驱动设计.md#隐式概念)

QueryWrapper(LambdaQueryWrapper) 和 UpdateWrapper(LambdaUpdateWrapper) 的父类

#### [QueryWrapper](https://baomidou.com/pages/10c804/#querywrapper)

相比 AbstractWrapper 多了select接口

#### LambdaQueryWrapper

```java
LambdaQueryWrapper<FzWarn> lqw = new LambdaQueryWrapper<FzWarn>()
        .eq(FzWarn::getSspt, "10");
// 等价于
new QueryWrapper<FzWarn>()
        .eq("sspt", "10");
```

好处是可以利用编译期的类型检查，避免写错字段

#### [UpdateWrapper](https://baomidou.com/pages/10c804/#updatewrapper)

相比 AbstractWrapper 多了 set 接口, 用来描述要更新哪些字段为什么值

#### 自定义SQL

- 注解查询

```java
@Select("select * from mysql_data ${ew.customSqlSegment}")
List<MysqlData> getAll(@Param(Constants.WRAPPER) Wrapper wrapper);
```

- xml查询

```java
List<MysqlData> getAll(Wrapper ew);
```

```xml
<select id="getAll" resultType="MysqlData">
	SELECT * FROM mysql_data ${ew.customSqlSegment}
</select>
```

### 注解查询

```java
public interface UserMapper extends BaseMapper<User> {

  @Select("SELECT * FROM user ")
  List<User> selectAll();
}
```

### 分页查询

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

## 更新

```java
@Test
public void test5(){
    UpdateWrapper<User> wrapper = new UpdateWrapper<User>().eq("username","root");
    User user = new User();
    user.setPassword("5678");
    userMapper.update(user, wrapper);
}
```

## 删除

```java
UpdateWrapper<User> wrapper = new UpdateWrapper<User>()
    .eq("username","root");
userMapper.delete(wrapper);
```

## AR模式

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

## 主键策略

```java
@KeySequence(value = "SEQ_ORACLE_STRING_KEY", clazz = String.class)
public class YourEntity {
    // 必须使用 INPUT
    @TableId(value = "ID_STR", type = IdType.INPUT)
    private String idStr;

}

/* 
DB2KeyGenerator
H2KeyGenerator
KingbaseKeyGenerator
OracleKeyGenerator
PostgreKeyGenerator
实现 com.baomidou.mybatisplus.core.incrementer.IdentifierGenerator 接口自定义主键策略
*/
@Bean
public IKeyGenerator keyGenerator() {
    return new H2KeyGenerator();
}
```

## 逻辑删除

删除: update user set deleted=1 where id = 1 and deleted=0
查找: select id,name,deleted from user where deleted=0

```yml
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: flag # 全局逻辑删除的实体字段名(since 3.3.0,配置后可以忽略不配置步骤2)
      logic-delete-value: 1 # 逻辑已删除值(默认为 1)
      logic-not-delete-value: 0 # 逻辑未删除值(默认为 0)
```

```java
@TableLogic
private Integer deleted;
```
