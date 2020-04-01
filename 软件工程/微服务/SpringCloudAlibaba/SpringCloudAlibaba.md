# SpringCloudAlibaba

>Spring Cloud Alibaba 致力于提供微服务开发的一站式解决方案。此项目包含开发分布式应用微服务的必需组件，方便开发者通过 Spring Cloud 编程模型轻松使用这些组件来开发分布式应用服务

## SpringCloud 第二代

| |Spring Cloud第一代|	Spring Cloud第二代
-|-|-
网关|	Spring Cloud Zuul	|Spring Cloud Gateway
注册中心|	eureka(不再更新)，Consul,ZK	|阿里Nacos，拍拍贷radar等可选
配置中心|	spring cloud config	|阿里Nacos，携程Apollo，随行付Config Keeper
客户端软负载均衡|	Ribbon	|spring-cloud-loadbalancer
熔断器|	Hystrix	|spring-cloud-r4j(Resilience4J)，阿里Sentinel

## Nacos

- 注册中心

### 安装

```sh
git clone https://gitee.com/mirrors/Nacos.git
cd nacos/
mvn -Prelease-nacos -Dmaven.test.skip=true clean install -U  
ls -al distribution/target/

// change the $version to your actual path
cd distribution/target/nacos-server-$version/nacos/bin
```

### 启动

- startup

### 使用

- 生产者

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```
```properties
spring.application.name=provider
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
```

- 消费者

```java
@RestController
public static class Api {

    @Autowired
    private ProviderClient client;
    @GetMapping("/")
    public String home() {
        return client.name();
    }
}
```