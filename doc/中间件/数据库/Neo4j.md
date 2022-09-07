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
