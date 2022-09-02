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
// 演员keanu通过关系 role 与电影 matrix 连接
CREATE (keanu:Person:Actor {name: 'Keanu Reeves'})-[role:ACTED_IN {roles: ['Neo']}]->(matrix:Movie {title: 'The Matrix'}) 
RETURN keanu,role,matrix
```
