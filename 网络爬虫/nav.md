>网络爬虫，是一种按照一定的规则，自动地抓取万维网信息的程序或者脚本。另外一些不常使用的名字还有蚂蚁、自动索引、模拟程序或者蠕虫。

# HttpClient

## Get请求

```java
        HttpGet get = new HttpGet("http://www.baidu.com");

        try (CloseableHttpClient client = HttpClients.createDefault();
             CloseableHttpResponse response = client.execute(get)) {
            String s = EntityUtils.toString(response.getEntity(), "utf8");

            System.out.println(s);
        }
```

- 设置参数

```java
URIBuilder uriBuilder = new URIBuilder("http://www.baidu.com/s").addParameter("wd", "关键词");
HttpGet get = new HttpGet(uriBuilder.build());
```

## POST请求

```java
        var request = new HttpPost("http://example");
        var pairs = List.of(new BasicNameValuePair("keys", "java"), new BasicNameValuePair("keys", "python"));
        UrlEncodedFormEntity entity = new UrlEncodedFormEntity(pairs, "utf8");
        request.setEntity(entity);
```