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

# WebMagic

![](https://camo.githubusercontent.com/06cb8227231a6adf6d2a57b14b60a25389a25fe9/687474703a2f2f636f64653463726166742e6769746875622e696f2f696d616765732f706f7374732f7765626d616769632e706e67)

## 使用

- 实现PageProcessor

```java
public class JobProcessor implements PageProcessor {

    private Site site = Site.me().addHeader("User-Agent","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36");

    @Override
    public void process(Page page) {
        page.putField("div1",page.getHtml().css("#logo-2014").get());
        page.putField("div2",page.getHtml().xpath("//div").get());

    }

    @Override
    public Site getSite() {
        return site;
    }
}
```

- 运行

```java
Spider.create(new JobProcessor())
                .addUrl("https://search.jd.com/Search?keyword=%E6%89%8B%E6%9C%BA&enc=utf-8&wq=%E6%89%8B%E6%9C%BA&pvid=9524dc8e0e2d45f08656f023fa60a0de")
                .run();
```

## 元素抽取

- XPath
- Regex
- CSS

```java
page.putField("div1",page.getHtml().css("#logo-2014").get()); // 获取一条
        page.putField("div2",page.getHtml().xpath("//div[@id=logo-2014]").all());  // 获取全部
```

## 获取链接

```java
page.getHtml().links()
```

- 递归访问

```java
page.addTargetRequests(page.getHtml().links().all());
```

## 输出数据

- PipeLine

```java
Spider.create(new JobProcessor())
                .addUrl("url")
                .addPipeline(new FilePipeline("./result.txt"))
                .run();
```

## Site

## Scheduler

- 使用布隆过滤器

```java
Spider.create(null)
                .setScheduler(new QueueScheduler().setDuplicateRemover(new BloomFilterDuplicateRemover(100000)));
```

### 三种去重方式

- HashSet
- Redis
- 布隆过滤器

## [文档](http://webmagic.io/docs/zh/)

# 爬虫分类

- 通用
- 聚焦
- 增量式
- 深层网络

# 网页去重

- simhash

**海明距离**

> 在信息编码中，两个合法代码对应位上编码不同的位数称为码距，又称海明距离。举例如下：10101和00110从第一位开始依次有第一位、第四、第五位不同，则海明距离为3

# 使用代理

```java
        downloader.setProxyProvider(new SimpleProxyProvider(List.of(new Proxy("116.114.19.211",443))));

        Spider.create(new ProxyProcessor())
                .addUrl("http://ip-api.com/json/?lang=zh-CN")
                .setDownloader(downloader)
                .run();
```


