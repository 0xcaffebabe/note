# 中级SQL
## 连接表达式
### 连接条件
JOIN...ON...
```sql
SELECT * FROM 
user JOIN user_info 
ON user.user_info = user_info.user_info_id;
# 连接两个表，查询出用户所有信息
```
上面的查询等价于:
```sql
SELECT * FROM user,user_info
WHERE user.user_info = user_info.user_info_id
```
### 外连接
- 左外连接：只保留出现在左外连接左边的关系中的元组
- 右外连接：只保留出现在右外连接运算右边关系中的元组
- 全外连接：保留出现在两个关系中的元组
左外连接：
```sql
select * from user  
left outer join state on user.user_id = state.user;
# 把user和state进行连接，如果用户没有发表state，则仍保留用户，只是state相关列为NULL
```
右外连接如上取反
全外连接：原理同上，不详细解释（mysql不支持）
### 连接类型和条件
natural join等价于natural inner join
## 视图
定义：不是逻辑模型的一部分，但是作为虚关系对用户可见
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
### SQL查询中使用视图
再查询中，视图能出现在关系名可以出现的任何地方
```sql
SELECT * FROM user_part
```
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


