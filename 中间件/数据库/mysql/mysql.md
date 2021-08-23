# MYSQL

## 逻辑架构

![屏幕截图 2020-08-23 142118](/assets/屏幕截图%202020-08-23%20142118.png)

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
- Gap lock：间隙锁，锁定一个范围，不包括记录本身
- Next-key lock：record+gap 锁定一个范围，包含记录本身

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


## 复制

### 主从复制

![2020310201955](/assets/2020310201955.png)

- binlog线程：将master服务器上的数据写入binlog
- io线程：读取master的binlog到replica的relay log（中继日志）
- sql线程：读取中继日志，将数据写入到replica

**半同步复制与并行复制**

主库上并行的操作，在从库上会串行执行，所以从库会有一定的数据延迟
半同步复制是主库接收到一个写命令会将这个写命令同步给从库，只有当收到至少一个从库的ack确认，才会认为写操作完成
并行复制，指的是从库开启多个线程，并行读取 relay log 中不同库的日志，然后并行重放不同库的日志

由于这个特性，所以做主从分离写代码可能需要注意插入的数据，可能不一定能马上查到

**搭建**

- master配置

```conf
server_id=177  ###服务器id
log-bin=mysql-bin   ###开启日志文件
```

```sh
show master status; # 查看master日志与当前日志位置
```

- slave配置

```conf
server_id=178  ###从服务器server_id
log-bin=mysql-bin  ###日志文件同步方式
binlog_do_db=test   ###同步数据库
```

```sh
show slave status;
```

- 从服务器执行

```sh
change master to master_host='192.168.182.131',master_user='root',master_password='123',   master_log_file='mysql-bin.000002',master_log_pos=0;
```

```sh
start slave
```

### 读写分离

主服务器处理写操作以及实时性要求比较高的读操作，而从服务器处理读操作

读写分离提高性能的原因：

- 缓解了锁的争用
- 从服务器只做读，资源利用率更高
- 增加冗余数据，提高可用性

#### 实现

常用代理方式实现，代理服务器根据传进来的请求，决定将请求转发到哪台服务器

![202031020242](/assets/202031020242.png)

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

key_buffer_size
	索引缓存区的大小（只对myisam表起作用）
query cache
	query_cache_size
		查询缓存的大小，未来版本被删除
			show status like '%Qcache%';查看缓存的相关属性
			Qcache_free_blocks：缓存中相邻内存块的个数，如果值比较大，那么查询缓存中碎片比较多
			Qcache_free_memory：查询缓存中剩余的内存大小
			Qcache_hits：表示有多少此命中缓存
			Qcache_inserts：表示多少次未命中而插入
			Qcache_lowmen_prunes：多少条query因为内存不足而被移除cache
			Qcache_queries_in_cache：当前cache中缓存的query数量
			Qcache_total_blocks：当前cache中block的数量
	query_cache_limit
		超出此大小的查询将不被缓存
	query_cache_min_res_unit
		缓存块最小大小
	query_cache_type
		缓存类型，决定缓存什么样的查询
			0表示禁用
			1表示将缓存所有结果，除非sql语句中使用sql_no_cache禁用查询缓存
			2表示只缓存select语句中通过sql_cache指定需要缓存的查询
sort_buffer_size
	每个需要排序的线程分派该大小的缓冲区
max_allowed_packet=32M
	限制server接受的数据包大小
join_buffer_size=2M
	表示关联缓存的大小
thread_cache_size
	Threads_cached：代表当前此时此刻线程缓存中有多少空闲线程
	Threads_connected：代表当前已建立连接的数量
	Threads_created：代表最近一次服务启动，已创建现成的数量，如果该值比较大，那么服务器会一直再创建线程
	Threads_running：代表当前激活的线程数

### innodb

innodb_buffer_pool_size=
	该参数指定大小的内存来缓冲数据和索引，最大可以设置为物理内存的80%
innodb_flush_log_at_trx_commit
	主要控制innodb将log buffer中的数据写入日志文件并flush磁盘的时间点，值分别为0，1，2
innodb_thread_concurrency
	设置innodb线程的并发数，默认为0表示不受限制，如果要设置建议跟服务器的cpu核心数一致或者是cpu核心数的两倍
innodb_log_buffer_size
	此参数确定日志文件所用的内存大小，以M为单位
innodb_log_file_size
	此参数确定数据日志文件的大小，以M为单位
innodb_log_files_in_group
	以循环方式将日志文件写到多个文件中
read_buffer_size
	mysql读入缓冲区大小，对表进行顺序扫描的请求将分配到一个读入缓冲区
read_rnd_buffer_size
	mysql随机读的缓冲区大小
innodb_file_per_table
	此参数确定为每张表分配一个新的文件