> 网络爬虫，是一种按照一定的规则，自动地抓取万维网信息的程序或者脚本。另外一些不常使用的名字还有蚂蚁、自动索引、模拟程序或者蠕虫。

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

## 连接池

```java
PoolingHttpClientConnectionManager manager = new PoolingHttpClientConnectionManager();
        // 最大连接数
        manager.setMaxTotal(100);
        // 每个主机最大连接数
        manager.setDefaultMaxPerRoute(10);
        CloseableHttpClient client = HttpClients.custom().setConnectionManager(manager).build();
```

## 请求参数

```java
RequestConfig config = RequestConfig.custom().setConnectTimeout(1000) // 获取连接的最长时间，单位ms
                .setConnectionRequestTimeout(500) // 获取连接的最长时间
                .setSocketTimeout(10000).build(); // 传输数据最长时间
        HttpGet get = new HttpGet();
        get.setConfig(config);
```

# Jsoup

## DOM

```java
Document doc = Jsoup.parse(new URL("http://www.baidu.com"), 10000);
        doc.getElementByXXX();
```

## 元素API

```java
Element e = doc.getElementById("login");
        System.out.println(e.id());
        System.out.println(e.className());
        System.out.println(e.classNames());
        System.out.println(e.text());
        System.out.println(e.attr("style"));
        System.out.println(e.attributes());
```

## 使用CSS选择器

```java
        doc.select("div")
                .forEach(System.out::println);
```