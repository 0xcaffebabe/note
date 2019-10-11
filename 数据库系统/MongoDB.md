> 文档数据库

# 基础概念

SQL术语/概念    | MongoDB术语/概念 | 解释/说明
----------- | ------------ | --------------------------
database    | database     | 数据库
table       | collection   | 数据库表/集合
row         | document     | 数据记录行/文档
column      | ﬁeld         | 数据字段/域
index       | index        | 索引
table joins |              | 表连接（MongoDB不支持）
primary key | primary key  | 主键,MongoDB自动在每个集合中添加_id的主键

# 操作

```shell
show dbs #列出所有数据库
use test #使用数据库（不存在会自动创建，新创建的数据库不显示（至少包含一个集合））
db.dropDatabase() #删除当前数据库
```

```shell
 db.createCollection("student")  # 创建集合
 db.collection.drop() #删除集合
```

```shell
db.student.insert({"name":"cxk","age":25}) # 插入文档
db.student.update({"name":"cxk"},{"name":"xkc"}) #更新文档（替换文档）
```

```shell
db.student.find() # 查询全部
db.student.find({"name":"cxk"}) # 按条件查询
db.student.find({"name":"cxk"},{name:1,age:1,_id:0}) # 投影
```

```shell
# 创建用户
db.createUser(      {       
     user:"root",        
      pwd:"root",        
      roles:[
          {role:"root",db:"admin"}
          ]     
       }   
)
```

# GridFS

