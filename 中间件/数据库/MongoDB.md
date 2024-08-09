# mongodb

> MongoDB 是一个跨平台的，面向文档的数据库，是当前 NoSQL 数据库产品中最热 门的一种。它介于关系数据库和非关系数据库之间，是非关系数据库当中功能最丰富，最 像关系数据库的产品。它支持的数据结构非常松散，是类似 JSON 的 BSON 格式，因此可以 存储比较复杂的数据类型。

## 基础概念

SQL术语/概念    | MongoDB术语/概念 | 解释/说明
----------- | ------------ | --------------------------
database    | database     | 数据库
table       | collection   | 数据库表/集合
row         | document     | 数据记录行/文档
column      | ﬁeld         | 数据字段/域
index       | index        | 索引
table joins |              | 表连接（MongoDB不支持）
primary key | primary key  | 主键,MongoDB自动在每个集合中添加_id的主键

## 数据类型

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

## 操作

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

## JAVA操作

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

### Spring data mongodb

## node操作

- 连接

```js
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/db1', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
       console.log('连接成功')
    })
    .catch(e => console.log(e))
```

- 创建集合

```js
const userSchema = new mongoose.Schema({
    name: String,
    age: Number
})
// 返回一个构造函数
const User = mongoose.model('User',userSchema)
```

- 插入文档

```js
const user = new User({
    name:'cxk',age:18
})
user.save()
```

```js
User.create({name:'gdf',age:15},(err,doc)=>{
    if (!err){
        console.log('插入成功',doc)
    }
})
```

- 查询

```js
// 查询全部
User.find().then(result=>console.log(result))
// 根据ID查询
User.findById('5c09f236aeb04b22f8460967').then(result=>console.log(result))
// 根据条件查询
User.find({password:'123456'}).then(result=>console.log(result))
User.find({ age: { $gt: 20, $lt: 40 } }).then(result => console.log(result))
User.find({ hobbies: { $in: ['打豆豆'] } }).then(result => console.log(result))
// 投影
User.find().select('name password -_id').then(result => console.log(result))
// 排序
User.find().sort('age').then(result => console.log(result))
User.find().sort('-age').then(result => console.log(result)) // 降序
// 分页
User.find().skip(2).limit(5).then(result => console.log(result))
```

- 删除

```js
// 删除符合条件的第一个文档
User.findOneAndDelete({name:'cxk'}).then(res=>console.log(res))
// 删除符合条件的全部文档
User.deleteMany({name:'gdf'}).then(res=>console.log(res))
```

- 更新

```js
// 更新符合条件中的第一个
User.updateOne({ name: 'gdf' }, { name: 'cxk' }).then(res => console.log(res))
// 更新全部符合调价你的
User.updateMany({ password: '123456' }, { name: 'cxk' }).then(res => console.log(res))
```

### 验证

```js
const userSchema = new mongoose.Schema({
    // name必传，否则会报错
    name: {
        type: String,
        required: true
    },
    age: Number
})
```
其他的验证规则
```
required: true 必传字段
minlength：3 字符串最小长度
maxlength: 20 字符串最大长度
min: 2 数值最小为2
max: 100 数值最大为100
enum: ['html', 'css', 'javascript', 'node.js']
trim: true 去除字符串两边的空格
validate: 自定义验证器
default: 默认值
```

### 集合关联

```js
// 用户集合
const User = mongoose.model('User', new mongoose.Schema({ name: { type: String } }));
// 文章集合
const Post = mongoose.model('Post', new mongoose.Schema({
    title: { type: String },
    // 使用ID将文章集合和作者集合进行关联
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));
```

```js
Post.find().populate('author').then(r => console.log(r))
```

## GridFS

