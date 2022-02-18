---
tags: ['中间件', 'es']
---
# SpringDataElasticSearch

## 配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:jpa="http://www.springframework.org/schema/data/jpa"
       xmlns:elasticsearch="http://www.springframework.org/schema/data/elasticsearch"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
     https://www.springframework.org/schema/beans/spring-beans.xsd
     http://www.springframework.org/schema/data/jpa
     https://www.springframework.org/schema/data/jpa/spring-jpa.xsd http://www.springframework.org/schema/data/elasticsearch http://www.springframework.org/schema/data/elasticsearch/spring-elasticsearch.xsd">

    <elasticsearch:transport-client id="esClient" cluster-name="docker-elasticsearch"
                                    cluster-nodes="my-pc:9300"/>
    <elasticsearch:repositories base-package="wang.ismy.es"/>
    <bean id="elasticsearchTemplate" class="org.springframework.data.elasticsearch.core.ElasticsearchTemplate">
        <constructor-arg name="client" ref="esClient"/>
    </bean>

</beans>
```

```java
@Document(indexName = "index1",type = "article")
@Data
public class Article {

    @Id
    @Field(type = FieldType.Long,store = true)
    private long id;

    @Field(type = FieldType.Text,store = true)
    private String title;

    @Field(type = FieldType.Text,store = true)
    private String content;

}
```

```java
@Repository
public interface ArticleDao extends ElasticsearchRepository<Article,Long> { }
```

## 创建索引

```java
ElasticsearchTemplate template = context.getBean(ElasticsearchTemplate.class);
template.createIndex(Article.class);
```

## 添加文档

```java
Article article = new Article();
article.setId(1L);
article.setTitle("【中国稳健前行】“中国之治”的政治保证");
article.setContent("新中国成立70年来，在中国共产党的坚强领导下，...");
articleDao.save(article);
```

## 删除文档

```java
articleDao.deleteById(1L);
articleDao.deleteAll(); // 全部删除
```

## 修改文档

同添加文档

## 查询

- 查询全部

```java
articleDao.findAll().forEach(System.out::println);
```

- 根据ID

```java
System.out.println(articleDao.findById(2L).get());
```

## 自定义查询

```java
@Repository
public interface ArticleDao extends ElasticsearchRepository<Article,Long> {

    List<Article> findAllByTitle(String title);
}
```

- 分页查询

```java
List<Article> findAllByTitle(String title, Pageable pageable);
articleDao.findAllByTitle("中", PageRequest.of(0,5)).forEach(System.out::println);
```

- 原生查询

```java
NativeSearchQuery query = new NativeSearchQueryBuilder()
        .withQuery(QueryBuilders.queryStringQuery("中国").defaultField("title"))
        .withPageable(PageRequest.of(0,5))
        .build();
template.queryForList(query,Article.class).forEach(System.out::println);
```
