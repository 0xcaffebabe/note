# 体系结构

![](https://img2018.cnblogs.com/blog/1521884/201811/1521884-20181124140508709-929928271.png)

# 基本操作

- 创建表空间

```sql
create tablespace test 
datafile 'd:\test.dbf' 
size 100m 
autoextend on 
next 10m
```

- 删除表空间

```sql
drop tablespace test
```

- 创建用户

```sql
create user root 
identified by root 
default tablespace test
```

## 角色

- CONNECT角色： --是授予最终用户的典型权利，最基本的
- RESOURCE角色： --是授予开发人员的
- DBA角色：拥有全部特权，是系统最高权限，只有DBA才可以创建数据库结构，并且系统权限也需要DBA授出，且DBA用户可以操作全体用户的任意基表，包括删除

## 授权

```sql
grant dba to root
```

# 数据类型

数据类型              | 描述
----------------- | ---------------------------------------------------------
Varchar， varchar2 | 表示一个字符串
NUMBER            | NUMBER(n)表示一个整数，长度是n,NUMBER(m,n):表示一个小数，总长度是m，小数是n，整数是m-n
DATA              | 表示日期类型
CLOB              | 大对象，表示大文本数据类型，可存4G
BLOB              | 大对象，表示二进制数据，可存4G

# 序列

- 创建序列

```sql
create sequence s_person
```

- 使用

```sql
select s_person.nextval from dual;
insert into person values(s_person.nextval,'123');
```

# 查询

## 单行函数

- upper
- lower
- ROUND:四舍五入
- trunc
- MONTHS_BETWEEN
- TO_CHAR
- nvl

## 条件表达式

```sql
select t.empno, t.ename, 
case when t.job = 'CLERK' then '业务员' when t.job = 'MANAGER' then '经理' when t.job = 'ANALYST' then '分析员' when t.job = 'PRESIDENT' then '总裁' when t.job = 'SALESMAN' then '销售' else '无业' end 
from emp t
```

![批注 2019-08-23 153323](/assets/批注%202019-08-23%20153323.png)

## 多行函数

**聚合函数**

## 分页查询

```sql
select * from (select rownum r ,emp.* from emp) b where b.r >5 and b.r <11
```

# 视图

# 索引

# [PLSQL](./PLSQL.md)

