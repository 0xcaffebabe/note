> GraphQL 是由 Facebook 创造的用于描述复杂数据模型的一种查询语言。这里查询语言所指的并不是常规意义上的类似 sql 语句的查询语言，而是一种用于前后端数据查询方式的规范

# Restful的不足

- 扩展性，单个RESTful接口返回数据越来越臃肿
- 某个前端展现，实际需要调用多个独立的RESTful API才能获取到足够的数据

# GraphQL的优势

- 按需索取数据
- 一次查询多个数据
- API演进无需划分版本

# 查询规范

## 字段

在GraphQL的查询中，请求结构中包含了所预期结果的结构，这个就是字段。并且响应的结构和请求结构基本一致

```gql
{
  hero {
    name
  }
}
```

```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    }
  }
}
```

## 参数

语法：(参数名:参数值)

```gql
{
  human(id: "1000") {
    name
    height
  }
}
```

```json
{
  "data": {
    "human": {
      "name": "Luke Skywalker",
      "height": 1.72
    }
  }
}
```

## 别名

如果一次查询多个相同对象，但是值不同，这个时候就需要起别名了，否则json的语法就不能通过了

```gql
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}
```

```json
{
  "data": {
    "empireHero": {
      "name": "Luke Skywalker"
    },
    "jediHero": {
      "name": "R2-D2"
    }
  }
}
```

## 片段

查询对的属相如果相同，可以采用片段的方式进行简化定义

```gql
{
  leftComparison: hero(episode: EMPIRE) {
    ...comparisonFields
  }
  rightComparison: hero(episode: JEDI) {
    ...comparisonFields
  }
}

fragment comparisonFields on Character {
  name
  appearsIn
  friends {
    name
  }
}
```

```json
{
  "data": {
    "leftComparison": {
      "name": "Luke Skywalker",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        },
        {
          "name": "C-3PO"
        },
        {
          "name": "R2-D2"
        }
      ]
    },
    "rightComparison": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

## Schema

Schema 是用于定义数据结构的，比如说，User对象中有哪些属性，对象与对象之间是什么关系等

```gql
schema { #定义查询 
    query: UserQuery 
}
type UserQuery { #定义查询的类型 
    user(id:ID) : User #指定对象以及参数类型 
}
type User {#定义对象 
    id:ID! # !表示该属性是非空项 
    name:String age:Int 
}
```

# 类型规范

## 标量类型

- Int ：有符号 32 位整数。
- Float ：有符号双精度浮点值。
- String ：UTF‐8 字符序列。
- Boolean ： true 或者 false 。 ID ：
- ID 标量类型表示一个唯一标识符，通常用以重新获取对象或者作为缓存中的键。

## 枚举类型

枚举类型是一种特殊的标量，它限制在一个特殊的可选值集合内

```gql
enum Episode { # 定义枚举
  NEWHOPE
  EMPIRE
  JEDI
}
type Character { # 使用枚举
  name: String!
  appearsIn: [Episode]!
}
```

## 接口

跟许多类型系统一样，GraphQL 支持接口。一个接口是一个抽象类型，它包含某些字段，而对象类型必须包含这些字段，才能算实现了这个接口

```gql
interface Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
}
type Human implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  starships: [Starship]
  totalCredits: Int
}
```


