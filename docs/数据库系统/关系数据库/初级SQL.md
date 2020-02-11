# 初级SQL
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
### 基本模式定义
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
    dept_name VARCHAR(20),
    building VARCHAR(15),
    budget NUMERIC(12,2),
    PRIMARY KEY(dept_name)
);
```
#### 完整性约束：
- PRIMARY KEY：取值唯一
- FOREIGN KEY:外键约束
- NOT NULL :非空约束
## SQL查询的基本结构
### 单关系查询
示例：
```sql
SELECT name FROM instructor
```
- distnct 去除重复元组
- SELECT子句还可进行加减乘除运算
- WHERE子句选出满足条件的元组
### 多关系查询
示例：
```sql
SELECT name,instructor.dept_name,building
FROM instructor , department
WHERE instructor.dept_name = department.dept_name
```
典型的SQL查询语句形式：
```sql
SELECT A1,A2,A3,...,AN
FROM R1,R2,...,RN
WHERE P
```
笛卡尔积：
表1：

name|age
----|----
小明|15
小红|16

表2：

grade|school
----|----
5|中心小学
6|中心小学

两张表的笛卡尔积是：

name|age|grade|school
----|----|----|----
小明|15|5|中心小学
小红|16|6|中心小学
小明|15|6|中心小学
小红|16|5|中心小学

### 自然连接
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
### 附加的基本运算
### 更名运算
AS 关键字：可以修改列名
### 字符串运算
- upper()
- lower()
- trim()
LIKE 关键字：
- %表示匹配任何字符（包括什么都没有）
- _表示匹配一个字符
示例：
```sql
SELECT name FROM user WHERE name LIKE 'user%' 
# 查找用户名以user开头的用户
```
escape :用来标志逃逸字符
```sql
LIKE 'ab\\cd%' escape '\' #匹配所有以ab\cd开头的字符串
```
SQL1999 中提供了similar to操作，语法类似于正则表达式
### SELECT子句中的属性说明
可以用*代表所有列
### 排列元组的显示次序
ORDER BY 子句
- DESC 降序
- ASC 升序
```sql
SELECT name,age FROM student ORDER BY age DESC
# 根据学生的年龄进行降序排序
```
### WHERE 子句谓词
BETWEEN ... AND ...
```sql
money BETWEEN 9000 AND 10000
```
等价于
```sql
money >= 9000 AND money <= 10000
```
NOT BETWEEN ... AND ...
上面的取反
## 集合运算
### 并运算
UNION关键字
```sql
SELECT name FROM student WHERE age = 15
UNION
SELECT name FROM student WHERE age = 16
```
### 交运算
INTERSECT关键字
用法同上
### 差运算
EXCEPT 关键字
同上
## 空值
- IS NULL 判断是空值
- IS NOT NULL 判断非空
## 聚集函数
- AVG:求平均值
- MIN:求最小值
- MAX:求最大值
- SUM:求和
- COUNT:计数
### 分组聚集
GROUP BY 子句：
根据后面的列进行分组
```sql
select TO_DAYS(create_time),COUNT(1) 
FROM web_log GROUP BY TO_DAYS(create_time)
# 查询每天的访问次数
```
### HAVING子句
满足HAVING后的条件才会被选择
```sql
select TO_DAYS(create_time),COUNT(1) 
FROM web_log GROUP BY TO_DAYS(create_time) HAVING COUNT(1)>1000
# 查询访问次数1000的那些天
```
## 嵌套子查询
```sql
SELECT username FROM user WHERE user_id IN 
(SELECT user FROM state);
# 查询发表过动态的用户
```
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
# 查询每个用户的用户名及其发表的动态条数
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
INSERT INTO user VALUES(1,'username',15);
# 这种方式需要指定全部列
INSERT INTO user(username,age) VALUES('username',15);
# 这种方式不需要指定全部列
INSERT INTO user SELECT * FROM user;
# 插入查询出来的元组
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

