> ElasticSearch是一个基于Lucene的搜索服务器。它提供了一个分布式多用户能力的全文搜索引擎，基于RESTful web接口

# 安装

> 使用 docker

```shell
docker run elasticsearch:7.3.1
```

```shell
docker network create somenetwork;
docker run -d --name elasticsearch --net somenetwork -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.3.1
```

# 图形化管理界面

- [head](https://github.com/mobz/elasticsearch-head)

# 概念

索引（indices）--------------------------------Databases 数据库

​类型（type）-----------------------------Table 数据表

​文档（Document）----------------Row 行

​字段（Field）-------------------Columns 列

- 索引 index
- 类型 type
- 字段 field
- 映射 mapping
- 文档 document
- 集群 cluster
- 节点 node
- 分片与复制

# 创建索引

```json
PUT /blog
{
    "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 2
      }
}
```

- 获取索引库信息

`GET /blog`

- 删除索引库

`DELETE /blog`

# 添加映射

```json
PUT /索引库名/_mapping/类型名称
{
  "properties": {
    "字段名": {
      "type": "类型",
      "index": true，
      "store": true，
      "analyzer": "分词器"
    }
  }
}
```

- 查看映射关系

`GET /索引库名/_mapping`

- 更新索引

`POST http://my-pc:9200/blog/{indexName}`

# 添加文档

`POST http://my-pc:9200/blog/{documentName}/1`

```json
{
    "id":1,
    "title":"标题1",
    "content":"内容1"
}
```

# 删除文档

`DELETE http://my-pc:9200/blog/hello/1`

# 修改文档

`UPDATE http://my-pc:9200/blog/hello/1`

# 查询

- 根据ID查询

`GET http://my-pc:9200/blog/hello/1`

- 根据关键词查询

`GET http://my-pc:9200/blog/hello/_search`

```json
{
    "query":{
        "term":{
            "content":"内"
        }
    }
}
```

- queryString查询

```json
{
    "query":{
        "query_string":{
            "default_field":"content",
            "query":"内容"
        }
    }
}
```

# 测试分词

`GET http://my-pc:9200/_analyze`

```json
{
  "analyzer": "standard",
  "text": "中文测试分词"
}
```

## 中文分词器

[下载](https://github.com/medcl/elasticsearch-analysis-ik)

```shell
docker run --name elasticsearch --net somenetwork -v /root/plugin:/usr/share/elasticsearch/plugins -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.3.1
```

`GET http://my-pc:9200/_analyze`

```json
{
  "analyzer": "ik_max_word",
  "text": "中文测试分词"
}
```

# ES集群

_集群_

## 搭建

- 配置

```yml
# 集群名称，必须保持一致
cluster.name:  elasticsearch
# 节点的名称
node.name: node-1
# 监听网段
network.host: 0.0.0.0
# 本节点rest服务端口
http.port: 9201
# 本节点数据传输端口
transport.tcp.port: 9301
# 集群节点信息
discovery.seed_hosts: ["127.0.0.1:9301","127.0.0.1:9302","127.0.0.1:9303"]
cluster.initial_master_nodes: ["node-1","node-2","node-3"]
```

另外两个节点配置省略...

# JAVA客户端

- 依赖

```xml
<dependency>
            <groupId>org.elasticsearch</groupId>
            <artifactId>elasticsearch</artifactId>
            <version>7.3.1</version>
        </dependency>

        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>transport</artifactId>
            <version>7.3.1</version>
        </dependency>
```

- 连接

```java
Settings settings = Settings.builder()
                .put("cluster.name","docker-cluster")
                .build();

TransportClient client = new PreBuiltTransportClient(settings);
client.addTransportAddress(
            new TransportAddress(InetAddress.getByName("my-pc"),9300));
```

- 创建索引

```java
client.admin().indices().prepareCreate("index").get();
```

- 设置映射

```java
XContentBuilder builder = XContentFactory.jsonBuilder()
                .startObject()
                .startObject("article")
                .startObject("properties")
                .startObject("id")
                .field("type", "long")
                .field("store", true)
                .endObject()
                .startObject("title")
                .field("type", "text")
                .field("store", true)
                .field("analyzer", "ik_smart")
                .endObject()
                .startObject("content")
                .field("type", "text")
                .field("store", true)
                .field("analyzer", "ik_smart")
                .endObject()
                .endObject()
                .endObject()
                .endObject();
        client.admin().indices().preparePutMapping("index")
                .setType("article")
                .setSource(builder)
                .get();
```

- 添加文档

```java
XContentBuilder builder = XContentFactory.jsonBuilder()
                .startObject()
                    .field("id",1L)
                    .field("title","央视快评：勇做敢于斗争善于斗争的战士")
                    .field("content","9月3日，习近平总书记在中央党校（国家行政学院）中青年干部培训班开班式上发表重要讲话强调，广大干部特别是年轻干部要经受严格的思想淬炼、政治历练、实践锻炼，发扬斗争精神，增强斗争本领，为实现“两个一百年”奋斗目标、实现中华民族伟大复兴的中国梦而顽强奋斗。")
                .endObject();
        client.prepareIndex("index","article","1")
                .setSource(builder)
                .get();
```

- POJO添加文档

```java
Article article = new Article();
        article.setId(3L);
        article.setTitle("3央视快评：勇做敢于斗争善于斗争的战士");
        article.setContent("9月3日3333，（国家行政学院）中青年干部培训班开班式上发表重要讲话强调，广大干部特别是年");
        String json = new ObjectMapper().writeValueAsString(article);

        client.prepareIndex("index","article","3")
                .setSource(json, XContentType.JSON)
                .get();
```

## 查询

- 根据ID

```java
QueryBuilder queryBuilder = QueryBuilders.idsQuery().addIds("1","2");
        SearchResponse response = client.prepareSearch("index")
                .setTypes("article")
                .setQuery(queryBuilder)
                .get();
        SearchHits hits = response.getHits();

        System.out.println("总记录:"+hits);
        SearchHit[] ret = hits.getHits();

        for (SearchHit documentFields : ret) {
            Map<String, Object> map = documentFields.getSourceAsMap();
            System.out.println("id:"+map.get("id"));
            System.out.println("title:"+map.get("title"));
            System.out.println("content:"+map.get("content"));
            System.out.println("-------------------");
        }
```

- 根据term

```java
QueryBuilder queryBuilder = QueryBuilders.termQuery("title","斗争");
```

- 根据queryString

```java
QueryBuilder queryBuilder = QueryBuilders.queryStringQuery("青年强调")
                .defaultField("content");
```

- 分页查询

```java
SearchResponse response = client.prepareSearch("index")
                .setTypes("article")
                .setQuery(queryBuilder)
                .setFrom(10)
                .setSize(5)
                .get();
```

- 高亮显示结果

```java
HighlightBuilder highlightBuilder = new HighlightBuilder();
        highlightBuilder.field(highlight);
        highlightBuilder.preTags("<em>");
        highlightBuilder.postTags("</em>");

        SearchResponse response = client.prepareSearch("index")
                .setTypes("article")
                .setQuery(queryBuilder)
                .highlighter(highlightBuilder)
                .get();
        SearchHits hits = response.getHits();

        System.out.println("总记录:"+hits.getTotalHits());
        SearchHit[] ret = hits.getHits();

        for (SearchHit documentFields : ret) {
            Map<String, Object> map = documentFields.getSourceAsMap();

            System.out.println("id:"+map.get("id"));
            System.out.println("content:"+map.get("content"));
            Map<String, HighlightField> highlightFields = documentFields.getHighlightFields();
            System.out.println(highlightFields.get(highlight).getFragments()[0]);
            System.out.println("-------------------");

        }
```

# kibana

Kibana是一个基于Node.js的Elasticsearch索引库数据统计工具，可以利用Elasticsearch的聚合功能，生成各种图表，如柱形图，线状图，饼图等。

而且还提供了操作Elasticsearch索引数据的控制台，并且提供了一定的API提示，非常有利于我们学习Elasticsearch的语法。

## 安装

- docker

```shell
docker pull kibana:5.6.8 # 拉取镜像
docker run -d --name kibana --net somenetwork -p 5601:5601 kibana:5.6.8 # 启动
```
