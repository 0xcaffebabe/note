---
tags: ['数据库']
---

# PostgreSQL

## 事务

### MVCC

相比于 MySQL，PostgreSQL 的 MVCC 不是把旧版本放到 undo log，而是把多个版本直接存在表的 heap（行里），每个行版本包含创建/删除事务信息（xmin/xmax 等）

#### 内部结构

每个 heap tuple（行版本）头部包含用于 MVCC 的关键信息（简化表达）：

- xmin：创建该版本的事务 ID（XID）。
- xmax：使该版本失效的事务 ID（若被删除或被更新时设置）。
- ctid：物理行标识（行在表中的位置）。
- cmin/cmax：同一事务内的命令序号（决定同一事务内多次操作可见性的细节）。
- infomask / hint bits：记录该 XID 的提交/回滚状态（便于后续扫描快速判断，减少访问 pg_xact）。

另外还有 visibility map（标记某页是否“all-visible”或“all-frozen”），用于加速 VACUUM 和索引优化。

#### 可见性规则

当事务（或语句，见隔离级别差异）开始读数据时，会创建一个快照，快照里会包含：xmin（低界）、xmax（高界）以及一个活跃事务 ID 列表（在 xmin 到 xmax 范围内的活跃事务）

快照定义了“谁在我看数据时还没完成”，只有在创建时间点之前完成的创建/删除会被视作可见/不可见

#### 更新删除细节

- UPDATE：Postgres 不在原地修改行，而是写入一个新的 heap tuple（新版本），并把旧版本的 xmax 设置为当前事务 ID（表示旧版本被本事务删除/无效化）。新版本的 xmin 设置为当前事务 ID。
- DELETE：相当于把原版本的 xmax 设置为当前事务 ID（没有产生新有效版本）。直到 VACUUM 回收这些死版本，物理空间不会被完全回收（除非 VACUUM FULL 或行被 HOT 合并回收）。

HOT（Heap Only Tuple）优化：如果 UPDATE 只修改非索引列，且页中有足够空间插入新版本，Postgres 可以将新版本放在同一页并利用 HOT 链接，避免更新索引（避免索引膨胀），性能和空间效率都高

#### VACUUM

为什么要 VACUUM？ 因为旧的 tuple 版本占空间并且持有 XID 元信息，如果不清理会导致表膨胀（bloat），并最终因 XID 回绕（wraparound）导致数据丢失风险

InnoDB 把旧版本存在 undo log 中；Postgres 把旧版本存在表 heap。结果是：Postgres 依赖 VACUUM 回收死版本

### 锁机制

#### 行级锁

- FOR UPDATE：锁住行，其他事务不能修改。
- FOR SHARE：共享锁，其他事务可以读，不能修改。

#### 表级锁

支持 ACCESS SHARE / ROW EXCLUSIVE / ACCESS EXCLUSIVE 等多种模式

#### Advisory Lock

PostgreSQL 还支持 用户自定义锁（Advisory Lock），可以在应用层用来控制逻辑

## 索引机制


PostgreSQL 的索引是独立于表的数据结构，索引不会覆盖表中的所有数据（不像 MySQL 的 InnoDB 聚簇索引）

### 索引类型

- B-Tree 索引：默认索引类型。适合等值查询、范围查询
- Hash 索引：只适合 = 查询
- GIN 索引：适合全文搜索，类似于搜索引擎的倒排索引
- GiST 索引：用途：模糊查询、相似度查询、地理空间（PostGIS）、全文搜索
- BRIN 索引：适合大表（TB 级别）+ 按时间或顺序存储的数据（如日志）
- SP-GiST 索引：用于非平衡数据结构（四叉树、k-d 树）。常用于多维数据（空间、地理）

### 索引特性

```sql
# 部分索引
CREATE INDEX idx_active_user ON users(last_login) WHERE active = true;
# 表达式索引
CREATE INDEX idx_lower_name ON users(LOWER(name));
# 覆盖索引，可以再索引里包含额外的列
CREATE INDEX idx_orders_user ON orders(user_id) INCLUDE(total_amount);
# 并发创建索引 不阻塞读写
CREATE INDEX CONCURRENTLY
```

### 索引扫描方式

- Index Scan：逐条查索引 + 回表。
- Bitmap Index Scan：先批量查索引，生成位图，再批量回表（适合大范围查询）。
- Index Only Scan：索引覆盖了查询所需的列，无需回表
