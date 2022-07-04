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

- 删除: update user set deleted=1 where id = 1 and deleted=0
- 查找: select id,name,deleted from user where deleted=0

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

## 字段类型映射器

- 用于 JavaType 与 JdbcType 之间的转换

实现 org.apache.ibatis.type.TypeHandler 接口

```java
@Data
@Accessors(chain = true)
// 使用映射器，就必须开启 autoResultMap = true
@TableName(autoResultMap = true)
public class User {
    ...

    // json
    @TableField(typeHandler = JacksonTypeHandler.class)
    private OtherInfo otherInfo;

}
```

```xml
<result column="other_info" jdbcType="VARCHAR" property="otherInfo" typeHandler="com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler" />
```

## 自动填充

- 在插入或更新的时候自动填充字段

```java
public class User {

    @TableField(.. fill = FieldFill.INSERT)
    private String createTime;

    @TableField(.. fill = FieldFill.UPDATE)
    private String updateTime;
    ....
}
```

自定义填充处理器：

```java
@Slf4j
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now()); // 起始版本 3.3.0(推荐使用)
        // 或者
        this.strictInsertFill(metaObject, "createTime", () -> LocalDateTime.now(), LocalDateTime.class); // 起始版本 3.3.3(推荐)
        // 或者
        this.fillStrategy(metaObject, "createTime", LocalDateTime.now()); // 也可以使用(3.3.0 该方法有bug)
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now()); // 起始版本 3.3.0(推荐)
        // 或者
        this.strictUpdateFill(metaObject, "updateTime", () -> LocalDateTime.now(), LocalDateTime.class); // 起始版本 3.3.3(推荐)
        // 或者
        this.fillStrategy(metaObject, "updateTime", LocalDateTime.now()); // 也可以使用(3.3.0 该方法有bug)
    }
}
```

填充策略：

- DEFAULT：默认不处理
- INSERT：插入填充
- UPDATE：更新填充
- INSERT_UPDATE：插入和更新都填充

## SQL注入器

- 通过实现com.baomidou.mybatisplus.core.injector.ISqlInjector 接口可以实现将一些自定义方法注入到所有mapper里，BaseMapper就是这么实现的

自定义方法则需要继承 com.baomidou.mybatisplus.core.injector.AbstractMethod 实现

具体可以参考 com.baomidou.mybatisplus.core.injector.DefaultSqlInjector 这个类的源代码

## SQL分析打印

- 需要引入p6spy依赖，一般用在开发环境打印出执行的SQL调试使用

[具体配置](https://baomidou.com/pages/833fab/)

## 数据安全

### 配置安全

```yml
# 加密配置 mpw: 开头紧接加密内容（ 非数据库配置专用 YML 中其它配置也是可以使用的 ）
spring:
  datasource:
    url: mpw:qRhvCwF4GOqjessEB3G+a5okP+uXXr96wcucn2Pev6Bf1oEMZ1gVpPPhdDmjQqoM
    password: mpw:Hzy5iliJbwDHhjLs1L0j6w==
    username: mpw:Xb+EgsyuYRXw7U7sBJjBpA==
```

主要是通过16位随机AES密钥对原始内容进行加密：

```java
// 生成 16 位随机 AES 密钥
String randomKey = AES.generateRandomKey();

// 随机密钥加密
String result = AES.encrypt(data, randomKey);
```

指定密钥：

```sh
# Jar 启动参数（ idea 设置 Program arguments , 服务器可以设置为启动环境变量 ）
--mpw.key=d1104d7c3b616f0b
```

### 字段加解密

- 需要引入 mybatis-mate-starter

```java
@FieldEncrypt
private String email;
```

### 字段脱敏

```java
@FieldSensitive("testStrategy")
private String username;
```

自定义脱敏策略：

```java
@Configuration
public class SensitiveStrategyConfig {

    /**
     * 注入脱敏策略
     */
    @Bean
    public ISensitiveStrategy sensitiveStrategy() {
        // 自定义 testStrategy 类型脱敏处理
        return new SensitiveStrategy().addStrategy("testStrategy", t -> t + "***test***");
    }
}
```

跳过脱敏处理：

```java
RequestDataTransfer.skipSensitive();
```

## 插件

Mybatis 要自定义插件需要实现 org.apache.ibatis.plugin.Interceptor

而MybatisPlus 在较新的版本中，使用自己的接口：com.baomidou.mybatisplus.extension.plugins.inner.InnerInterceptor 这个接口的扩展点更加齐全

MP自带的一些插件：

- 自动分页: PaginationInnerInterceptor
- 多租户: TenantLineInnerInterceptor
- 动态表名: DynamicTableNameInnerInterceptor
- 乐观锁: OptimisticLockerInnerInterceptor
- sql 性能规范: IllegalSQLInnerInterceptor
- 防止全表更新与删除: BlockAttackInnerInterceptor