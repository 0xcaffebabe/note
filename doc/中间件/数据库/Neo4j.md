# Neo4j

![202292172629](/assets/202292172629.jpg)

- 节点：用来描述领域实体，可以有一个或多个标签（类型化）来标识节点的类型
- 关系：用来描述源节点与目标节点，总是有向的，并且必须要有一个类型

节点与关系都可以有属性，也就是KV对

创建关系的同时需要列出源节点与目标节点

```cypher
CREATE ()-[:ACTED_IN {roles: ['Forrest'], performance: 5}]->()
```

neo4j 不强制要求schema

## 命名公约

- 节点标签：大写驼峰，:ProjectConsumer
- 关系类型：大写驼峰，:CompanyEmploye
- 属性：小写驼峰，:userAge

## Cypher

- neo4j的声明式图查询语言

```cypher
// 一个标签为Movie叫matrix的节点 有title released两个属性
(matrix:Movie {title: 'The Matrix', released: 1997})
// 一个类型为ACTED_IN叫role的关系 有 roles一个属性
-[role:ACTED_IN {roles: ['Neo']}]->
```

### 语法

#### MATCH

```cypher
// 创建一个节点
CREATE (:Movie {title: 'The Matrix', released: 1997})
// 创建节点与关系
CREATE (cxk:Person {name: "蔡徐坤", playAge: "两年半"})-[:PLAYED_IN {name: "打"}]->(ball:Basketball {name: "篮球"})
CREATE (cxk)-[:SING_IN {name: "rap"}]->(song:Song {name: "鸡你太美"})
RETURN cxk,ball,song
```

```cypher
// 查询所有标签为Person的节点
MATCH (p:Person) RETURN p
// 查询指定属性满足的节点
MATCH (p:Person {name: "蔡徐坤"}) RETURN p
// 查询指定节点关系
MATCH (p:Person)-[:SING_IN]->(s:Song) RETURN p,s
```

```cypher
// 创建新关系
MATCH (p: Person)
CREATE (p)-[:LIVE_IN]->(:Earth)
// 不存在就创建 存在就更新 在大图里，这种操作需要扫描大量节点，即使加上索引或约束，仍有一定开销
MERGE (p: Person {name: "蔡徐坤2号"})
ON CREATE SET p.age = 18
RETURN p
// MERGE 关系
MATCH (p: Person {name: "蔡徐坤2号"})
MATCH (b: Basketball)
MERGE (p)-[:PLAYED_IN]->(b)
```

```cypher
// 查询身份证为xxx 的 PERSON 与 PERSON、THING拥有rytcx、yysj最多二度关系的图
MATCH (p:PERSON  {fq_gmsfhm: "350500196306111518"})<-[:rytcx|yysj*..2]->(n) WHERE (n: PERSON OR n: THING)
RETURN p,n
// 查询身份证为xxx 的 PERSON到手机号为17750052235的THING之间的路径
MATCH p=(n: PERSON {fq_gmsfhm: "350521195607060010"})-[*]->(m: THING {sjhm: "17750052235"})
RETURN p
```

#### CASE

```cypher
MATCH (p: Person {name: "蔡徐坤"})
RETURN 
CASE p.age
    WHEN 18 THEN "两年半"
    WHEN 20 THEN "四年半"
    ELSE "UNKNOW"
END

MATCH (p: Person {name: "蔡徐坤"})
WITH p,
CASE p.age
    WHEN p.age IS NULL THEN "UNKNOW"
    WHEN p.age = 18 THEN "两年半"
END AS a
RETURN a
```

#### 参数

```cypher
MATCH (p: Person {name: $name})
```

#### 操作符

##### 聚合操作符

```cypher
// 去重
MATCH (p: Person)
RETURN DISTINCT p.name
```

##### 属性操作符

```cypher
RETURN p["name"] // 等同于p.name

// 添加属性
MATCH (p:Person {name: "蔡徐坤2号"})
SET p+= {gender: "female"}
```

##### 比较运算符

```cypher
// between
MATCH (n) WHERE 21 < n.age <= 30 RETURN n
// 排序
MATCH (p:Person)
RETURN p ORDER BY p.name
```

##### 使用正则表达式

```cypher
MATCH (p:Person) WHERE p.name =~ '.徐.'
RETURN p
```

##### 日期时间操作

```cypher
WITH date({year: 2022, month:9, day: 21}) AS a,duration({days: 9}) AS b
RETURN a-b
```

##### 列表操作

```cypher
// 连接
RETURN [1,2,3,4,5] + [6,7]
// 包含
RETURN 1 IN [1,2,3]
// 切片
RETURN [1,2,3,4,5][1..3]
```

#### 空间数据类型

```cypher
// 84坐标系
WITH point({latitude: 24, longitude: 118}) AS p1,point({latitude: 25, longitude: 117}) AS p2
RETURN point.distance(p1,p2)/1000 + 'km'
// 笛卡尔坐标系
WITH point({x:1,y:2}) AS p1, point({x:3,y:4}) AS p2
RETURN point.distance(p1,p2)
```

## 数据建模

- 节点：一般就是领域中的名词
- 标签：代表节点的通用名词
- 关系：
- 属性：
