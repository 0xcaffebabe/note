# xxl-job

## 传统定时任务

- 单机（无集群）

## 定时任务的问题

- 高并发下

请求量大的情况下，独立的job服务器宕机之后如何处理未完成的任务

- 分布式下

分布式集群的情况下，怎么保证定时任务不被重复执行

## 分布式定时任务解决方案

- 集群节点读入一个全局共享变量来决定是否运行任务
  - 分布式锁
  - 数据库
  - 配置文件
- 分布式任务调度平台

## 架构

![202031144254](/assets/202031144254.png)

## 工作原理

![批注 2020-03-01 153716](/assets/批注%202020-03-01%20153716.png)

## 执行器

- 依赖

```xml
<dependency>
    <groupId>com.xuxueli</groupId>
    <artifactId>xxl-job-core</artifactId>
    <version>2.1.2</version>
</dependency>
```

- 配置

```properties
xxl.job.admin.addresses=http://127.0.0.1:8080/xxl-job-admin

xxl.job.executor.appname=xxl-job-executor-sample
xxl.job.executor.ip=
xxl.job.executor.port=7777

### xxl-job, access token
xxl.job.accessToken=

### xxl-job log path
xxl.job.executor.logpath=/data/applogs/xxl-job/jobhandler
### xxl-job log retention days
xxl.job.executor.logretentiondays=30
```

```java
@Configuration
public class XxlJobConfig {
    private Logger logger = LoggerFactory.getLogger(XxlJobConfig.class);

    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;

    @Value("${xxl.job.executor.appname}")
    private String appName;

    @Value("${xxl.job.executor.ip}")
    private String ip;

    @Value("${xxl.job.executor.port}")
    private int port;

    @Value("${xxl.job.accessToken}")
    private String accessToken;

    @Value("${xxl.job.executor.logpath}")
    private String logPath;

    @Value("${xxl.job.executor.logretentiondays}")
    private int logRetentionDays;


    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        logger.info(">>>>>>>>>>> xxl-job config init.");
        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);
        xxlJobSpringExecutor.setAppName(appName);
        xxlJobSpringExecutor.setIp(ip);
        xxlJobSpringExecutor.setPort(port);
        xxlJobSpringExecutor.setAccessToken(accessToken);
        xxlJobSpringExecutor.setLogPath(logPath);
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);

        return xxlJobSpringExecutor;
    }
}
```

- 编写处理器

```java
@XxlJob("demoJobHandler")
public ReturnT<String> demoJobHandler(String param) throws Exception {
    XxlJobLogger.log("XXL-JOB, Hello World.");

    for (int i = 0; i < 5; i++) {
        XxlJobLogger.log("beat at:" + i);
        TimeUnit.SECONDS.sleep(2);
    }
    return ReturnT.SUCCESS;
}
```

- 执行器集群

可以配置多个同appname的执行器，来实现定时任务执行器负载均衡

## 路由策略

- 分片广播
  - 集群多台机器同时进行

## 调度中心集群

需要注意的是，调度中心是一主多备的关系，只有一台调度中心进行调度任务

- 启动多台调度中心
- 执行器配置多个调度中心地址

```properties
xxl.job.admin.addresses=http://127.0.0.1:8080/xxl-job-admin,http://127.0.0.1:8079/xxl-job-admin
```