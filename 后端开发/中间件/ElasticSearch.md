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

- 索引 index
- 类型 type
- 字段 field
- 映射 mapping
- 文档 document
- 集群 cluster
- 节点 node
- 分片与复制

# 添加索引

`PUT http://my-pc:9200/blog1`

```json
{
    "mappings":{
            "properties":{
                "id":{
                    "type":"long",
                    "store":true
                }
                ,
                "title":{
                    "type":"text",
                    "store":true,
                    "index":true,
                    "analyzer":"standard"
                }
                ,
                "content":{
                    "type":"text",
                    "store":true,
                    "index":true,
                    "analyzer":"standard"
                }
            }
        }
}
```

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

*集群*

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











