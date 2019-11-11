> MongoDB 是一个跨平台的，面向文档的数据库，是当前 NoSQL 数据库产品中最热 门的一种。它介于关系数据库和非关系数据库之间，是非关系数据库当中功能最丰富，最 像关系数据库的产品。它支持的数据结构非常松散，是类似 JSON 的 BSON 格式，因此可以 存储比较复杂的数据类型。

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

# 数据类型

- null：用于表示空值或者不存在的字段，{“x”:null}
- 布尔型：布尔类型有两个值true和false，{“x”:true}
- 数值：shell默认使用64为浮点型数值。{“x”：3.14}或{“x”：3}
  - 对于整型值，可以使用 NumberInt（4字节符号整数）或NumberLong（8字节符号整数）， {“x”:NumberInt(“3”)}{“x”:NumberLong(“3”)}
- 字符串：UTF-8字符串都可以表示为字符串类型的数据，{“x”：“呵呵”}
- 日期：日期被存储为自新纪元依赖经过的毫秒数，不存储时区，{“x”:new Date()}
- 正则表达式：查询时，使用正则表达式作为限定条件，语法与JavaScript的正则表达式相 同，`{“x”:/[abc]/}`
- 数组：数据列表或数据集可以表示为数组，{“x”： [“a“，“b”,”c”]}
- 内嵌文档：文档可以嵌套其他文档，被嵌套的文档作为值来处理，{“x”:{“y”:3 }}
- 对象Id：对象id是一个12字节的字符串，是文档的唯一标识，{“x”: objectId() }
- 二进制数据：二进制数据是一个任意字节的字符串。它不能直接在shell中使用。如果要 将非utf-字符保存到数据库中，二进制数据是唯一的方式。
- 代码：查询和文档中可以包括任何JavaScript代码，{“x”:function(){/…/}}

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

# JAVA操作

- 依赖

```xml
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongo-java-driver</artifactId>
            <version>3.11.0</version>
        </dependency>
```

- 使用

```java
        MongoClient client = new MongoClient("my-pc");
        MongoDatabase db = client.getDatabase("db");

        MongoCollection<Document> spit = db.getCollection("spit");
        Document d = new Document();
        d.append("name","jntm");
        spit.insertOne(d);
        for (Document document : spit.find()) {
            System.out.println(document.getString("name"));
        }
        client.close();
```

## Spring data mongodb




# GridFS

