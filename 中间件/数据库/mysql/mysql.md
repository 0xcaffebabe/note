# MYSQL

## 存储引擎

### MyISAM存储引擎

1、大文件（达到63位文件长度）在支持大文件的文件系统和操作系统上被支持。
2、当把删除和更新及插入操作混合使用的时候，动态尺寸的行产生更少碎片。这要通过合并相邻被删除的块，以及若下一个块被删除，就扩展到下一块自动完成。 
3、每个MyISAM表最大索引数是64，这可以通过重新编译来改变。每个索引最大的列数是16 4、NULL被允许在索引的列中，这个值占每个键的0~1个字节 5、可以把数据文件和索引文件放在不同目录（InnoDB是放在一个目录里面的）

### InnoDB存储引擎

MySQL 默认的事务型存储引擎，只有在需要它不支持的特性时，才考虑使用其它存储引擎

1、InnoDB给MySQL提供了具有提交、回滚和崩溃恢复能力的事物安全（ACID兼容）存储引擎。InnoDB锁定在行级并且也在SELECT语句中提供一个类似Oracle的非锁定读。这些功能增加了多用户部署和性能。在SQL查询中，可以自由地将InnoDB类型的表和其他MySQL的表类型混合起来，甚至在同一个查询中也可以混合
2、InnoDB是为处理巨大数据量的最大性能设计。它的CPU效率可能是任何其他基于磁盘的关系型数据库引擎锁不能匹敌的
3、InnoDB存储引擎完全与MySQL服务器整合，InnoDB存储引擎为在主内存中缓存数据和索引而维持它自己的缓冲池。InnoDB将它的表和索引在一个逻辑表空间中，表空间可以包含数个文件（或原始磁盘文件）。这与MyISAM表不同，比如在MyISAM表中每个表被存放在分离的文件中。InnoDB表可以是任何尺寸，即使在文件尺寸被限制为2GB的操作系统上
4、InnoDB支持外键完整性约束，存储表中的数据时，每张表的存储都按主键顺序存放，如果没有显示在表定义时指定主键，InnoDB会为每一行生成一个6字节的ROWID，并以此作为主键

### MEMORY存储引擎

1、MEMORY表的每个表可以有多达32个索引，每个索引16列，以及500字节的最大键长度 2、MEMORY存储引擎执行HASH和BTREE缩影 3、可以在一个MEMORY表中有非唯一键值 4、MEMORY表使用一个固定的记录长度格式 5、MEMORY不支持BLOB或TEXT列 6、MEMORY支持AUTO_INCREMENT列和对可包含NULL值的列的索引 7、MEMORY表在所由客户端之间共享（就像其他任何非TEMPORARY表） 8、MEMORY表内存被存储在内存中，内存是MEMORY表和服务器在查询处理时的空闲中，创建的内部表共享 9、当不再需要MEMORY表的内容时，要释放被MEMORY表使用的内存，应该执行DELETE FROM或TRUNCATE TABLE，或者删除整个表（使用DROP TABLE）

### 对比

功能     | MYISAM | Memory | InnoDB | Archive
------ | ------ | ------ | ------ | -------
存储限制   | 256TB  | RAM    | 64TB   | None
支持事务   | No     | No     | Yes    | No
支持全文索引 | Yes    | No     | Yes(5.6之后)    | No
支持数索引  | Yes    | Yes    | Yes    | No
支持哈希索引 | No     | Yes    | No     | No
支持数据缓存 | No     | N/A    | Yes    | No
支持外键   | No     | No     | Yes    | No

![批注 2020-07-30 085703](/assets/批注%202020-07-30%20085703.png)

## 数据类型

### 整型

TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT 分别使用 8, 16, 24, 32, 64 位存储空间，一般情况下越小的列越好

### 浮点数

FLOAT 和 DOUBLE 为浮点类型，DECIMAL 为高精度小数类型，DECIMAL 的计算比浮点类型需要更高的代价

### 字符串

一种是定长的，一种是变长的。
变长类型能够节省空间，因为只需要存储必要的内容，但当变长类型发生UPDATE操作后，需要执行额外的操作
存储和检索时，VARCHAR 末尾的空格会保留下来，而会 CHAR 末尾的空格会被删除

### 时间和日期

- DATETIME

能够保存从 1000 年到 9999 年的日期和时间，精度为秒
时区无关

- TIMESTAMP

和 UNIX 时间戳相同
应该尽量使用 TIMESTAMP，因为它比 DATETIME 空间效率更高

## 用户及权限管理

- 创建一个能在主机登录的用户
  
```sql
create user 'user2'@'%' identified by '123';
```

- 授予权限

```sql
grant all on *.* to 'user2'@'%';
```

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

## 设计规范

### 命名规范

### 数据库

- [a-z ][0-9] _
- 不超过30字符
- 备份数据库可以加自然数

### 表

- [a-z ][0-9] _
- 相同关系的表可以加相同的前缀

### 字段

- [a-z ][0-9] _
- 多个单词使用下划线分割
- 每个表必须有自增主键（默认系统时间）
- 关联字段名尽可能相同

## 字段类型规范

- 使用较少的空间来存储
- ip最好使用int
- 固定长度的类型使用char
- 最好给默认值

## 索引规范

- 加一个index后缀
- 为每个表创建主键索引
- 符合索引慎重

## 范式规范

- 必须满足第二范式
- 尽量满足第三范式

# MYSQL设计原则

## 核心原则

- 不在数据库做运算
- 控制列数量（20以内）
- 平衡范式与冗余
- 禁止大SQL
- 禁止大事务
- 禁止大批量

## 字段原则

- 用好数据类型节约空间
- 字符转为数字
- 避免使用NULL
- 少用text

## 索引原则

- 不在索引列做运算
- innodb主键使用自增
- 不用外键

## SQL原则

- 尽可能简单
- 简单事务
- 避免使用触发器，函数
- 不使用select *
- OR改写成IN或UNION
- 避免前%
- 慎用count（*）
- limit高效分页
- 少用连接join
- group by 
- 使用同类型比较
- 打散批量更新

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