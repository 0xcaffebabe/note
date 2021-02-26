# SQL

## SQL查询语言概览

- 数据定义语言（DDL）
- 数据操纵语言（DML）
- 完整性
- 视图定义
- 事务控制
- 嵌入式SQL和动态SQL
- 授权

## SQL数据定义

### 基本类型

- char(n):固定长度的字符串（会追加空格）
- varchar(n):可变长度的字符串
- int：整数类型
- smallint：小整数类型（和机器相关）
- numeric(p,d):定点数，p位数，d位小数
- real，double，precision：浮点数与双精度浮点数，精度与机器相关
- float(n)：精度至少为n位的浮点数

### 表定义

create table 命令的通用形式

```sql
CREATE TABLE r
(
    A1 D1,
    A2 D2,
    AN DN,
    <完整性约束1>,
    <完整性约束K>
);
```

示例：

```sql
CREATE TABLE department(
    dept_name VARCHAR(20) NOT NULL,
    building VARCHAR(15), -- 如果不指定 默认为NULL
    budget NUMERIC(12,2) DEFAULT 999, -- 指定默认值
    PRIMARY KEY(dept_name)
);
```

### 表更新

DBMS对表更新的约束既复杂又不统一

```sql
ALTER TABLE vendors ADD vend_phone CHAR(20); -- 增加字段
ALTER TABLE vendors DROP COLUMN vend_phone; -- 删除字段
```

SQLite不支持使用ALTER TABLE 语句定义主键跟外键。在使用ALTER TABLE语句应极为小心，使用前应对表进行备份

### 删除表

```sql
DROP TABLE cust_copy;
```

### 重命名表

RENAME/sp_rename/ALTER TABLE

#### 完整性约束

- PRIMARY KEY：取值唯一
- FOREIGN KEY:外键约束
- NOT NULL :非空约束

## SQL查询

```sql
SELECT prod_name FROM products; -- 查询单列
SELECT prod_name, prod_price FROM products; -- 查询多列
SELECT * FROM products; -- 检索所有列
SELECT DISTINCT vend_id FROM products; -- 结果去重（DISTINCT作用在整行上，不针对某个具体列）
```

SQL关键字不区分大小写，但对象名区分，在不同的DBMS跟操作系统区分大小写可能会有不同。

*通配符通常会降低检索性能，但好处就是能匹配未知列。

- SELECT子句还可进行加减乘除运算
- WHERE子句选出满足条件的元组

### 分页

不同的数据库分页不尽相同

```sql
SELECT TOP 5 * FROM products; -- SQL Server
SELECT * FROM products FETCH FIRST 5 ROWS ONLY; -- DB2
SELECT * FROM products WHERE ROWNUM <= 5; -- Oracle
SELECT * FROM products LIMIT 0,5; -- MySQL
```

### 排序

```sql
SELECT * FROM products ORDER BY prod_name; -- 单列排序
SELECT * FROM products ORDER BY prod_price, prod_name; -- 多列排序
SELECT * FROM products ORDER BY 1,2; -- 使用列的相对位置指定排序 使用这种方式只能针对出现在SELECT中的列进行排序
SELECT * FROM products ORDER BY prod_price DESC; -- 降序排序 默认为ASC升序排序
SELECT * FROM products ORDER BY prod_price DESC, prod_name DESC; -- 多列降序排序需要每列都指定DESC
```

使用ORDER BY 子句时，应该保证其实SELECT 语句的最后一条子句。

### 数据过滤

```sql
SELECT * FROM products WHERE prod_price=3.49;
```

WHERE子句操作符

操作符      | 说明
-------- | ------
= or ==  | 等于
<> or != | 不等于
<        | 小于
<=       | 小于等于
!<       | 不小于
>        | 大于
>=       | 大于等于
!>       | 不大于
BETWEEN  | 在两个值之间
IS NULL  | 为NULL值

#### 高级数据过滤

```sql
SELECT * FROM products WHERE prod_price=3.49 OR prod_price = 5.99; -- 逻辑OR
SELECT * FROM products WHERE prod_price=3.49 AND prod_price < 5.99; -- 逻辑AND
SELECT * FROM products WHERE prod_price IN (3.49, 5.99); -- IN操作符 相比OR更清晰同时有更好的性能 也可以动态包含SELECT语句
SELECT * FROM products WHERE NOT prod_price IN (3.49, 5.99); -- 逻辑NOT
```

SQL处理AND的优先级比OR高，所以同时使用OR和AND有必要使用括号来明确求值顺序。

#### 通配符过滤

LIKE 关键字：

- %表示匹配任何字符（包括什么都没有，但不匹配NULL）,在ACCESS中使用*
- _表示匹配一个字符，DB2不支持，ACCESS使用?

示例：

```sql
SELECT name FROM user WHERE name LIKE 'user%'; --查找用户名以user开头的用户
```

escape :用来标志逃逸字符

```sql
LIKE 'ab\\cd%' escape '\' #匹配所有以ab\cd开头的字符串
```

SQL1999 中提供了similar to操作，语法类似于正则表达式。

这些通配符匹配在一定程度上会影响性能，这点需要注意。

### 计算字段

```sql
-- 字符串连接
SELECT vend_name + '(' + vend_country + ')' AS name FROM vendors; -- Access SqlServer
SELECT vend_name || '(' || vend_country || ')' AS name FROM vendors; -- DB2 Oracle...
SELECT CONCAT(vend_name,'(',vend_country,')') AS name FROM vendors; -- MySQL
```

使用AS关键字被视为最佳实践。别名也被称为导出列，Oracle不支持AS关键字

```sql
-- 数值计算
SELECT prod_id, quantity * item_price AS total FROM orderitems;
SELECT 2 * 6; -- 当省略子句时，就代表计算这个表达式并展现
```

### 函数

- 文本处理函数

```sql
SELECT SOUNDEX("meet"), SOUNDEX("meat"); -- SOUNDEX函数将字母描述为字母数字模式 Access和PostgreSQL不支持
```

函数                           | 作用
---------------------------- | ----------
LEFT ( 或使用子字符串函数)            | 返回字符串左边的字符
LENGTH (也使用DATALENGTH或LEN) ) | 返回字符串的长度
LOWER ( Access使用LCASE )      | 将字符串转换为小写
LTRIM                        | 去掉字符串左边的空格
RICHT (或使用子字符串函数)            | 返回字符串右边的字符
RTRIM                        | 去掉字符串右边的空格
UPPER ( Access使用UCASE )      | 将字符串转换为大写

- 日期和时间处理函数

不同DBMS很不一致 可移植性最差

```sql
SELECT YEAR(NOW()); -- MySQL
SELECT to_char(CURRENT_DATE,'YYYY') FROM dual; -- Oracle
```

- 数值计算函数

函数   | 作用
---- | ---------
ABS  | 返回一个数的绝对值
COS  | 返回一个角度的余弦
EXP  | 返回一个数的指数值
PI   | 返回圆周率
SIN  | 返回一个角度的正弦
SQRT | 返回一个数的平方根
TAN  | 返回一个角度的正切

### 聚合数据

- 聚合函数

```sql
SELECT AVG(prod_price) FROM products; -- 求平均值，AVG函数忽略NULL

SELECT COUNT(cust_email) FROM customers; -- 对列计算，忽略NULL
SELECT COUNT(*) FROM customers; -- 对列计算，不忽略NULL

SELECT MAX(prod_price) FROM products; -- 求最大值 忽略NULL
SELECT MIN(prod_price) FROM products; -- 求最小值 忽略NULL

SELECT SUM(item_price * quantity) FROM orderitems; -- 求和，忽略NULL

SELECT SUM(DISTINCT item_price) FROM orderitems; -- 只对不同的结果进行求和
```

### 分组查询

- GROUP BY 子句

根据后面的列进行分组

```sql
SELECT TO_DAYS(create_time),COUNT(1) FROM web_log GROUP BY TO_DAYS(create_time)
-- 查询每天的访问次数
```

GROUP BY子句的一些规则：

可以包含任意数目的列

子句的每一列都必须是检索列或者有效的表达式（但不能使聚集函数），除了聚集函数，SELECT 中的每一列，GROUP BY子句中都必须有

NULL会被分为一组

GROUP BY必须在WHERE之后 ORDER BY之前

HAVING子句：

WHERE在分组前过滤 HAVING在分组后过滤行，满足HAVING后的条件的分组才会被选择

```sql
SELECT TO_DAYS(create_time),COUNT(1) 
FROM web_log GROUP BY TO_DAYS(create_time) HAVING COUNT(1)>1000
-- 查询访问次数1000的那些天
```

### 子查询

*MySQL4.1后才支持子查询*

```sql
SELECT username FROM user WHERE user_id IN 
(SELECT user FROM state);
-- 查询发表过动态的用户
```

作为子查询的SQL只能查询单个列

```sql
SELECT cust_name,
  (SELECT COUNT(*) FROM orders WHERE orders.cust_id = customers.cust_id)
FROM customers;
-- 将子查询作为计算字段
```

### 联结

联结是一种机制，用来在一条SELECT语句中关联表

```sql
SELECT name,instructor.dept_name,building
FROM instructor , department
WHERE instructor.dept_name = department.dept_name; -- 在联结中，特别需要注意列的全限定名
```

上面的这种联结叫做等值联结，等值联结等同于内联结：

```sql
SELECT name,instructor.dept_name,building
FROM instructor INNER JOIN department
ON instructor.dept_name = department.dept_name;
```

笛卡尔积：

表1：

name | age
---- | ---
小明   | 15
小红   | 16


表2：

grade | school
----- | ------
5     | 中心小学
6     | 中心小学


两张表的笛卡尔积是：

name | age | grade | school
---- | --- | ----- | ------
小明   | 15  | 5     | 中心小学
小红   | 16  | 6     | 中心小学
小明   | 15  | 6     | 中心小学
小红   | 16  | 5     | 中心小学

笛卡尔积也被称为叉联结(cross join)

联结可以跨多张表：

```sql
SELECT * FROM orderitems, products, vendors;
```

但联结表越多，性能下降越厉害，基于此，许多DBMS都对联结的表数量做了限制，[阿里的p3c中也规定联结表的数量不得超过3张](编程语言/JAVA/p3c.md#索引规约)

#### 自连接

```sql
SELECT * FROM customers AS c1, customers AS c2
WHERE C1.cust_name = c2.cust_name
AND c2.cust_contact = 'Jim Jones'; -- 查出与Jim Jones同公司的顾客
```

许多DBMS处理自联结往往比子查询快得多

#### 自然连接

```sql
SELECT name,instructor.dept_name,building
FROM instructor , department
WHERE instructor.dept_name = department.dept_name
```

上面那条SQL可以简化成下列形式：

```sql
SELECT name,instructor.dept_name,building
FROM instructor NATURAL JOIN department
```

#### 外连接

- 左外连接：只保留出现在左外连接左边的关系中的元组（如果没有符合连接条件的元组，左表的元组还是会被展示出来）
- 右外连接：只保留出现在右外连接运算右边关系中的元组
- 全外连接：保留出现在两个关系中的元组

左外连接：

```sql
select * from user  
left outer join state on user.user_id = state.user;
-- 把user和state进行连接，如果用户没有发表state，则仍保留用户，只是state相关列为NULL
```

右外连接如上取反

全外连接可以包含两个表中不关联的行，许多DBMS不支持

natural join等价于natural inner join

### 集合运算

- 并运算

```sql
SELECT name FROM student WHERE age = 15
UNION
SELECT name FROM student WHERE age = 16
```

每个UNION SELECT语句的列都必须相同，类型必须兼容

UNION会自动去除重复行，如果需要保留重复行，则使用UNION ALL

如果UNION语句需要排序，则在最后一条SELECT语句加上ORDER BY子句，ORDER BY作用于所有UNION语句

- 交运算

INTERSECT关键字 用法同上

- 差运算

EXCEPT 关键字
同上

## 空值

- IS NULL 判断是空值
- IS NOT NULL 判断非空

### 集合比较

- some:某一些满足即可
- all：全部满足

```sql
SELECT username FROM user
WHERE age > all 
(SELECT age FROM user WHERE sex = '女')
# 查询出年龄大于全部女性年龄的用户
```

### 空关系测试

EXIST 关键字：
当改关键字后面的关系非空时返回true，反之返回false
相关子查询：

```sql
SELECT user_id FROM user 
WHERE EXISTS (SELECT * FROM state WHERE user = user_id);
# 查询发表过动态的用户ID
```

### 重复元组存在性测试

UNIQUE 关键字：
查询是否存在重复的元组

### FROM子句中的子查询

```sql
SELECT * FROM (SELECT username FROM user) AS T;
# 使用FROM子句子查询，有些数据库要求FROM后面的子查询需要指定一个别名
```

### WITH子句

提供定义临时关系的方法

### 标量子查询

如果一个子查询的结果只有一个元组，那么可以放在单个值能出现的任何地方：

```sql
SELECT username,(SELECT COUNT(1) 
FROM state WHERE state.user = user.user_id) FROM user;
-- 查询每个用户的用户名及其发表的动态条数
```

## 数据库的修改

### 删除
```sql
DELETE FROM r
WHERE p
```

示例:

```sql
DELETE FROM user
WHERE username = 'root'
# 删除用户名为root的用户
```

### 插入

```sql
INSERT INTO user VALUES(1,'username',15);-- 这种方式需要指定全部列，每次插入数据，应尽可能提供所有列名
INSERT INTO user(username,age) VALUES('username',15);-- 这种方式不需要指定全部列，允许为NULL值或者表定义有默认值的列可以被省略
INSERT INTO user SELECT * FROM user;-- 插入查询出来的数据，根据列的位置进行插入，列名可以不匹配
-- 某些SQL实现INTO是可选的
SELECT * INTO cust_copy FROM customers; -- 复制数据到新表
CREATE TABLE cust_copy AS  SELECT * FROM customers; -- MySQL Oracle PostgreSQL的语法
```

### 更新

```sql
UPDATE r
SET k1=v1,k2=v2,...,kn=vn
WHERE p
```
```sql
UPDATE user
SET username = 'abc'
WHERE username = 'root'
```

## 视图

定义：不是逻辑模型的一部分，但是作为虚关系对用户可见

Access 不支持视图 MySQL从5之后才支持视图 SQLite只支持只读视图

### 视图定义

```sql
CREATE VIEW v AS <查询表达式>
```

创建一个部分用户视图：

```sql
CREATE VIEW user_part 
AS
SELECT * FROM user LIMIT 10
```

如果视图使用了复杂的联结或者对视图进行了嵌套，性能会下降的很厉害,同时视图也不支持创建索引

### SQL查询中使用视图

再查询中，视图能出现在关系名可以出现的任何地方

```sql
SELECT * FROM user_part
```

对于视图的使用：

1. 使用视图隐藏复杂的联结
2. 使用视图格式化查询的数据
3. 过滤掉不想要的数据

可以极大简化复杂数据的处理

### 物化视图

如果用于定义视图的实际关系改变，视图也跟着修改。这样的视图称为物化视图

### 视图更新

一般来说，满足下列所有条件，则视图是可更新的
- FROM子句中只有一个数据库关系
- SELECT子句只包含关系的属性名，不包含任何表达式聚集或DISTINCT声明
- 没有出现在SELECT子句中的属性可以去空值，也不是主码的一部分
- 查询中没有GROUP BY 和HAVING子句

## 事务

定义：事务内的所有语句要么全部执行，要么全部不执行

- Commit work:提交当前事务
- Rollback work：回滚当前事务

MySQL：

```sql
START TRANSACTION; -- 开始一个事务
DELETE FROM orderitems; -- 执行事务操作
ROLLBACK; -- 回滚事务
COMMIT; -- 提交事务
```

Oracle:

```sql
SET TRANSACTION;
...
COMMIT;
```

对于没有明确标志事务结束的语句，事务将一直存在。

默认没有开启的事务的执行语句都是隐式提交

为了实现部分回滚的功能，这里引入一个叫做保存点的东西，回滚可以回滚到保存点，放弃回滚点后的所有更改

```sql
START TRANSACTION;
SAVEPOINT p1;
DELETE FROM orderitems;
ROLLBACK TO p1;
COMMIT;
```

## 游标

在检索出来的行中前进或者后退。

Access不支持 MySQL5之后才支持 SQLite的游标称为步骤。

相较而言，游标对对于Web应用用处不大

## 完整性约束

完整性约束防止的是对数据的意外破坏。

### 单个关系上的约束

### NOT NULL约束

```sql
 CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password` varchar(32) NOT NULL,
  `user_info` int(11) NOT NULL,
  `permission` int(11) NOT NULL,
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=293 DEFAULT CHARSET=utf8
```

表示禁止在该属性上插入NULL值

### UNIQUE 约束

被该约束修饰的属性在单个关系上是唯一的，由于NULL != NULL ，所以一个关系上允许存在多个NULL值

### CHECK 子句

check(p) 指定一个谓词P，只有当该谓词满足时，数据库才允许插入

### 参照完整性

一个关系中给定属性集上的取值在另一关系的特定属性集的取值中出现，这种情况称为参照完整性

```sql
CREATE TABLE test(
user_id INT,
FOREIGN KEY (user_id) REFERENCES user(user_id)
);
```

test表中的user_id参照user表的user_id

### 事务中对完整性约束的违反

如果事务中的某条SQL语句违反了完整性约束，则会马上进行检查。有些DBS支持将initially deferred加入到约束中，这样完整性约束检查就会在事务结束的时候进行。

### 复杂CHECK条件与断言

比如CHECK后面的谓词可以使用子查询：

```sql
CREATE TABLE test(
user_id INT 
CHECK(user_id IN( SELECT user.user_id FROM user))
)
```
这样在插入test表时，只有在user表中出现的user_id才被允许插入，但是大多数数据库还不支持
断言：
```sql
CREATE ASSERTION <name> CHECK <p>
```
任何在断言中涉及到的关系发生变动，都会触发断言。

## SQL中的数据类型与模式

### SQL中的日期和时间类型

- DATE:日历日期，包括年月日
- TIME :一天中的时间
- TIMESTAMP ：DATE+TIME

#### 与时间相关的函数：

- CURRENT_DATE：返回当前日期
- CURRENT_TIME：返回当前时间

### 默认值

如
```sql
CREATE TABLE test(
  user_id INT DEFAULT 0
);
```
当user_id未指定时，默认为0

### 创建索引

```sql
CREATE INDEX index_1 ON test(id)
```

### 大对象类型

- BLOB
- CLOB

### 用户定义的类型

### CREATE TABLE 的扩展

创建两个模式相同的表：

```sql
CREATE TABLE test1 LIKE test
```

从查询中创建表：

```sql
CREATE TABLE test2 AS 
(
SELECT * FROM test
)
WITH DATA;
# mysql不支持
```

### 模式、目录与环境

当代数据库提供了三层结构的关系命名机制，最顶层由**目录**构成，每个目录当中可以包含**模式**，目录 == 数据库。
默认目录和模式是为每个连接建立的SQL环境的一部分。

## 授权

- 授权读取
- 授权插入
- 授权更新
- 授权删除

### 权限的授予与收回

```sql
GRANT <权限列表>
ON <关系或视图>
TO <用户或角色列表>
```

```sql
GRANT SELECT ON department TO user1
# 授予user1查询department表的权限
```

public:代表当前系统的所有用户以及未来用户

```sql
REVOKE <权限列表>
ON <关系名或视图名>
FROM <用户/角色列表>
```

```sql
REVOKE SELECT ON department FROM user1
# 收回user1的查询权限
```

### 角色

创建角色：

```sql
CREATE ROLE <角色名>
```

```sql
GRANT admin to user1;
# 将admin角色授予user1
```

### 视图的授权

同上

### 模式的授权

```sql
GRANT REFERENCES (dept_name) ON department TO user1
# 允许user1创建这样的关系：它能参照department的dept_name
```

### 权限的转移

在授权语句最后加上 WITH GRANT OPTION
即允许用户可将权限授予给其他用户

### 权限的收回

默认情况下，多数DBS都会级联收回用户的权限
如果在收回语句最后加上 RESTRICT关键字，可以防止级联收回

## 存储过程

存储过程可以看成是对一系列 SQL 操作的批处理

Access 与 SQLite 不支持，MySQL5之后才支持

- 代码复用
- 比较安全
- 性能较高

不同DBMS存储和调用存储过程的方式都很不一致

## 使用程序设计语言访问数据库

- 动态SQL:运行时构建SQL语句字符串与数据库进行交互
- 嵌入式SQL:SQL语句必须在编译时全部确定，由预处理器来连接宿主语言与数据库

### JDBC

一段经典的JDBC代码：

```java
// 加载驱动
 Class.forName("com.mysql.jdbc.Driver");
 // 获取连接
 Connection connection =
         DriverManager.getConnection("jdbc:mysql:///test","root","Root@@715711877");
 // 执行SQL

ResultSet resultSet = connection.prepareStatement("SELECT * FROM test").executeQuery();

//取回结果集
while (resultSet.next()){
    System.out.println(resultSet.getInt("id")+"|"
            +resultSet.getString("name"));
}
connection.close();
```