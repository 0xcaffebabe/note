
![批注 2019-07-22 170337](/assets/批注%202019-07-22%20170337.png)

# 注册中心Eureka

![](http://favorites.ren/assets/images/2017/springcloud/a2b2c.jpg)

```xml
<dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
```

```properties
spring.application.name=eureka-server

server.port=8001

#是否将自己注册到注册中心
eureka.client.register-with-eureka=false
#是否从注册中心获取注册信息
eureka.client.fetch-registry=false

eureka.client.serviceUrl.defaultZone=http://localhost:${server.port}/eureka/
```

```java
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }

}
```

## Eureka集群

- 配置

```properties
spring.application.name=spring-cloud-eureka
server.port=8001
eureka.instance.hostname=peer1

eureka.client.serviceUrl.defaultZone=http://peer2:8002/eureka/

#####


spring.application.name=spring-cloud-eureka
server.port=8002
eureka.instance.hostname=peer2

eureka.client.serviceUrl.defaultZone=http://peer2:8001/eureka/
```

- 根据两个配置文件启动两个实例

# 服务提供与调用

- 引入依赖

```xml
<dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
```

- 配置

```properties
spring.application.name=producer
server.port=9000
eureka.client.serviceUrl.defaultZone=http://localhost:8001/eureka/
```

## 服务提供

```java
@SpringBootApplication
@EnableDiscoveryClient
public class ProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProducerApplication.class, args);
    }

}
```







