# Neo4j

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
