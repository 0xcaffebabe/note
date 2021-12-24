---
tags: ['数据库']
---
# MYSQL

## 逻辑架构

![MySQL逻辑架构](/assets/屏幕截图%202020-08-23%20142118.png)

## 日志机制

- redo log
	- innodb 的日志
	- 记录的是修改后的值 无论是否提交都会被记录
	- 先写日志 再刷磁盘
- undo log
	- innodb 的日志
	- 事务发生前的数据版本
	- 用于回滚
	- 提供MVVC下的读 即非锁定读
- bin log
	- 可用于主从复制
	- 二进制形式记录操作
	- 可用于数据快照还原
	- 提交事务记录binlog 定时刷磁盘

## 并发控制

- 读写锁
  - 共享锁与独占锁
- 锁粒度

### 锁机制

- MyISAM采用表级锁(table-level locking)。
- InnoDB支持行级锁(row-level locking)和表级锁,默认为行级锁

对比

- 表级锁： MySQL中锁定 粒度最大 的一种锁，对当前操作的整张表加锁，实现简单，资源消耗也比较少，加锁快，不会出现死锁。其锁定粒度最大，触发锁冲突的概率最高，并发度最低，MyISAM和 InnoDB引擎都支持表级锁。
- 行级锁： MySQL中锁定 粒度最小的一种锁，只针对当前操作的行进行加锁。 行级锁能大大减少数据库操作的冲突。其加锁粒度最小，并发度高，但加锁的开销也最大，加锁慢，会出现死锁。

MySQL的锁释放是在COMMIT或者ROLLBACK时释放的。隐式锁定是存储引擎根据隔离级别自动进行，但也可以进行显式锁定：

```sql
SELECT ... LOCK IN SHARE MODE; -- 任何时候都不要手动加锁
```

InnoDB存储引擎的锁的算法

- Record lock：单个行记录上的锁
- Gap lock：间隙锁，锁定一个范围，不包括记录本身 防止这个区间的数据插入 解决幻读问题
	- 要有索引
- Next-key lock：record+gap 锁定一个范围，包含记录本身
- Insert Intention Locks: 插入意向锁 insert前执行
- AUTO-INC Locks：自增锁
- Predicate Locks 谓词锁

### 锁分析

#### 锁相关统计信息

```sql
show status like '%innodb_row_lock%';
```

- Innodb_row_lock_current_waits：当前正在等待锁的事务数量
- Innodb_row_lock_time：从系统启动到现在发生锁定的总时间
- Innodb_row_lock_time_avg：从系统启动到现在发生锁等待的平均时间
- Innodb_row_lock_time_max：从系统启动到现在发生锁等待的最大时间
- Innodb_row_lock_waits：从系统启动到现在发生等待的次数

```sql
SHOW ENGINE INNODB STATUS; -- 关注结果中 TRANSACTIONS 段落
```

#### 锁、事务相关的表

当前事务执行情况：

- [INFORMATION_SCHEMA.INNODB_TRX](https://dev.mysql.com/doc/refman/5.7/en/information-schema-innodb-trx-table.html) 5.7
- [INFORMATION_SCHEMA.INNODB_TRX](https://dev.mysql.com/doc/refman/8.0/en/information-schema-innodb-trx-table.html) 8.0

锁信息：

- [INFORMATION_SCHEMA.INNODB_LOCKS](https://dev.mysql.com/doc/refman/5.7/en/information-schema-innodb-locks-table.html) 5.7
- [PERFORMANCE.DATA_LOCKS](https://dev.mysql.com/doc/refman/8.0/en/performance-schema-data-locks-table.html) 8.0

锁等待信息：

- [INFORMATION_SCHEMA.INNODB_LOCK_WAITS](https://dev.mysql.com/doc/refman/5.7/en/information-schema-innodb-lock-waits-table.html) 5.7	
- [PERFORMANCE.DATA_LOCKS_WAITS](https://dev.mysql.com/doc/refman/8.0/en/performance-schema-data-lock-waits-table.html) 8.0

##### 事务与锁情况分析

```sql
SELECT
  waiting_trx_id,
  waiting_pid,
  waiting_query,
  blocking_trx_id,
  blocking_pid,
  blocking_query
FROM sys.innodb_lock_waits;
```

## 多版本并发控制(MVCC)

行级锁的变种 避免了加锁操作 通过保存数据在某个时间点的快照来实现的

实现：

每行有两个额外字段：创建版本号、删除版本号

每个事务都拥有一个系统版本号，每次开始新的事务，版本号就会递增

1. SELECT时 满足以下两个条件的行才会被返回
	1. 行的版本号小于等于当前版本号
	2. 删除版本号为空或者大于当前版本号
2. UPDATE、DELETE、INSERT时 写入新版本号

### 隐藏字段

每条记录的一些隐式字段：

- DB_TRX_ID 最后一次修改该记录的事务ID
- DB_ROLL_PTR 指向这条记录的上一个版本
- DB_ROW_ID 隐式自增ID（没有主键时 innodb 根据这个生成聚簇索引）
- 创建版本号
- 删除版本号

### 当前读/快照读

- 当前读 ：读取记录最新版本 读取时会加锁 select for update
- 快照读：不会加锁 读取的是历史版本 select

数据可见性算法：

![屏幕截图 2021-07-12 214235](/assets/屏幕截图%202021-07-12%20214235.png)

## 用户及权限管理

- 创建一个能在主机登录的用户
  
```sql
create user 'user2'@'%' identified by '123';
```

- 授予权限

```sql
grant all on *.* to 'user2'@'%';
```

## 事务

MySQL使用一个变量控制是否采用自动提交：

```sql
SHOW VARIABLES LIKE 'AUTOCOMMIT';
```

但对于不支持事务的引擎，如MyISAM或者内存表，或者执行DDL等操作，默认也会自动提交。

MySQL设置隔离级别：

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### 问题

#### Lock wait timeout exceeded

该问题是由于某个事务执行时间过长，而导致其他事务无法获取相对应的锁，其他事务在等待一定时间后，则会出现这个问题。

可通过调高 innodb_lock_wait_timeout 变量来增加超时时间。

但为了解决根本问题，还是要避免长事务的出现，可以考虑通过缩小事务的粒度以及减少事务的执行时间来解决，尽量避免在事务里执行耗时的操作，如大量调用远程接口。

#### Spring的事务与MySQL的事务

Spring所表达的含义就是根据规则来决定要不要事务，怎么创建事务。

1、spring里面，方法嵌套调用外层读取数据和内层读取数据效果与数据库隔离级别的关系。

#### 可重复读是默认，可不一定是常用的。乐观锁必不可少。

#### 实现

常用代理方式实现，代理服务器根据传进来的请求，决定将请求转发到哪台服务器

![202031020242](/assets/202031020242.png)

## 相关文件说明

文件名                | 类型  | 说明
------------------ | --- | --------------------------------------------------------------------
performance_schema | 文件夹 | 数据库， MySQL 的数据字典
mysql              | 文件夹 | 数据库，MySQL 的数据字典
sys                | 文件夹 | 数据库， SQL 数据字典
my.cnf             | 文件  | 参数文件，默认是从/etc/my.cnf中读取 也可自定义
auto.cnf           | 文件  | MySQL 启动时如果没有UUID就会生成这个文件
binlog.00000x      | 文件  | 二进制日志，即binlog ，数据变化都会在里面记录。如果是在从库，还会有相应的relay log
binlog.index       | 文件  | binlog的索引文件，里面记录相应的bin log名称
mysqld.pid         | 文件  | MySQL服务的进程号
mysqld.log         | 文件  | MySQL日志，记录数据库启动日志、服务端日志，有的公司会将其命名为error.log
Ibtmpx             | 文件  | 临时表的表空间，由innodb_temp_data_file_path变量控制
ibdata1            | 文件  | 系统表空间，由innodb_data_file_path变量控制
undo_00x           | 文件  | undo表空间
mysql.ibd          | 文件  | mysql库中系统表与数据字典的表空间
ib_logfilex        | 文件  | InnoDB特有，redo文件
ib_buffer_pool     | 文件  | 关闭MySQL时，会把内存中的热数据保存在该文件中，从而提高使用率和性能
slow.log           | 文件  | 慢查询日志
xxx.pem            | 文件  | SSL相关文件
mysql.sock         | 文件  | 本地服务器的套接字文件使用UNIX domain socket作为通讯协议的载体，比TCP更快 用于从客户端到本地服务器来进行交换数据。
ib_16384_x.dblwr   | 文件  | doublewrite 文件，格式为#ib_page_size_file_number.dblwr

## 内存结构

[MySQL内存结构](https://www.cnblogs.com/kissdb/p/4009614.html)

## 参数设置

### general

- datadir=/var/lib/mysql
	- 数据文件存放的目录
- socket=/var/lib/mysql/mysql.sock
	- mysql.socket表示server和client在同一台服务器，并且使用localhost进行连接，就会使用socket进行连接
- pid_file=/var/lib/mysql/mysql.pid
	- 存储mysql的pid
- port=3306
	- mysql服务的端口号
- default_storage_engine=InnoDB
	- mysql存储引擎
- skip-grant-tables
	- 当忘记mysql的用户名密码的时候，可以在mysql配置文件中配置该参数，跳过权限表验证，不需要密码即可登录mysql


### character

- character_set_client
	- 客户端数据的字符集
- character_set_connection
	- mysql处理客户端发来的信息时，会把这些数据转换成连接的字符集格式
- character_set_results
	- mysql发送给客户端的结果集所用的字符集
- character_set_database
	- 数据库默认的字符集
- character_set_server
	- mysql server的默认字符集

### connection

- max_connections
	- mysql的最大连接数，如果数据库的并发连接请求比较大，应该调高该值
- max_user_connections
	- 限制每个用户的连接个数
- back_log
	- mysql能够暂存的连接数量，当mysql的线程在一个很短时间内得到非常多的连接请求时，就会起作用，如果mysql的连接数量达到max_connections时，新的请求会被存储在堆栈中，以等待某一个连接释放资源，如果等待连接的数量超过back_log,则不再接受连接资源
- wait_timeout
	- mysql在关闭一个非交互的连接之前需要等待的时长
- interactive_timeout
	- 关闭一个交互连接之前需要等待的秒数

### log

- log_error
	指定错误日志文件名称，用于记录当mysqld启动和停止时，以及服务器在运行中发生任何严重错误时的相关信息
- log_bin
	指定二进制日志文件名称，用于记录对数据造成更改的所有查询语句
- binlog_do_db
	指定将更新记录到二进制日志的数据库，其他所有没有显式指定的数据库更新将忽略，不记录在日志中
- binlog_ignore_db
	指定不将更新记录到二进制日志的数据库
- sync_binlog
	指定多少次写日志后同步磁盘
- general_log
	是否开启查询日志记录
- general_log_file
	指定查询日志文件名，用于记录所有的查询语句
- slow_query_log
	是否开启慢查询日志记录
- slow_query_log_file
	指定慢查询日志文件名称，用于记录耗时比较长的查询语句
- long_query_time
	设置慢查询的时间，超过这个时间的查询语句才会记录日志
- log_slow_admin_statements
	是否将管理语句写入慢查询日志

### cache

- key_buffer_size
	索引缓存区的大小（只对myisam表起作用）
- sort_buffer_size
	每个需要排序的线程分派该大小的缓冲区
- max_allowed_packet=32M
	限制server接受的数据包大小
- join_buffer_size=2M
	表示关联缓存的大小
- thread_cache_size
	- Threads_cached：代表当前此时此刻线程缓存中有多少空闲线程
	- Threads_connected：代表当前已建立连接的数量
	- Threads_created：代表最近一次服务启动，已创建现成的数量，如果该值比较大，那么服务器会一直再创建线程
	- Threads_running：代表当前激活的线程数

### innodb

- innodb_buffer_pool_size=
	该参数指定大小的内存来缓冲数据和索引，最大可以设置为物理内存的80%
- innodb_flush_log_at_trx_commit
	主要控制innodb将log buffer中的数据写入日志文件并flush磁盘的时间点，值分别为0，1，2
- innodb_thread_concurrency
	设置innodb线程的并发数，默认为0表示不受限制，如果要设置建议跟服务器的cpu核心数一致或者是cpu核心数的两倍
- innodb_log_buffer_size
	此参数确定日志文件所用的内存大小，以M为单位
- innodb_log_file_size
	此参数确定数据日志文件的大小，以M为单位
- innodb_log_files_in_group
	以循环方式将日志文件写到多个文件中
- read_buffer_size
	mysql读入缓冲区大小，对表进行顺序扫描的请求将分配到一个读入缓冲区
- read_rnd_buffer_size
	mysql随机读的缓冲区大小
- innodb_file_per_table
	此参数确定为每张表分配一个新的文件