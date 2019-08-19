# 根据条件查询

```xml
<select id="findById" resultType="wang.ismy.mybatis.entity.User">
        SELECT * FROM user WHERE id = #{id}
    </select>
```

## 细节

- resultType 属性： 用于指定结果集的类型。
- parameterType 属性： 用于指定传入参数的类型。
- sql 语句中使用的`#{}`： 它代表占位符，相当于原来 jdbc 部分所学的?，都是用于执行语句时替换实际的数据
- `#{}`中的内容：因为参数只有一个，所以此处可以随意写

# 更新

```xml
<insert id="save" parameterType="wang.ismy.mybatis.entity.User">
        INSERT INTO user(username,address,sex,birthday) 
        VALUES(#{username},#{address},#{sex},#{birthday})
    </insert>
```

```java
int save(User user);
```

**需要注意的是，mybatis的SqlSession关闭了事务的默认提交，当进行完更新操作后，需要手动调用**`sqlSession.commit();`

# 模糊查询字符串拼接问题

```sql
SELECT * FROM user WHERE username LIKE '%' #{name} '%'
```

# 插入数据后返回ID

```xml
<insert id="save" parameterType="wang.ismy.mybatis.entity.User">

        <selectKey keyColumn="id" keyProperty="id" resultType="int">
        select last_insert_id();
        </selectKey>
        INSERT INTO user(username,address,sex,birthday) VALUES(#{username},#{address},#{sex},#{birthday})
    </insert>
```

# 使用resultMap

```xml
<resultMap id="userMap" type="wang.ismy.mybatis.entity.User">
        <!--主键-->
        <id column="id" property="id"/>
        <!--非主键-->
        <result column="username" property="username"/>
    </resultMap>

<select id="findAll" resultMap="userMap">
    select * from user
</select>
```

# Properties标签

```xml
<properties resource="jdbc.cfg">

    </properties>
```

# typeAliases标签

```xml
<typeAliases>
        <!--指定别名，不区分大小写-->
        <typeAlias type="wang.ismy.mybatis.entity.User" alias="user"/>

        <!--指定该包下的所有类为别名，不区分大小写-->
        <package name="wang.ismy.mybatis.entity"/>
    </typeAliases>
```

# mapper

```xml
<mappers>
        <package name="wang.ismy.mybatis.dao">
    </mappers>
```
