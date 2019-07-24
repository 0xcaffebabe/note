
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

## 生产者
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

```java
@SpringBootApplication
@EnableDiscoveryClient
public class ProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProducerApplication.class, args);
    }

}
```

## 消费者

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
```

```java
@EnableDiscoveryClient
@EnableFeignClients
public class ConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }

}


@FeignClient("producer")
public interface HelloRemote {

    @RequestMapping("/hello")
    String hello(@RequestParam String name);
}
```

- 使用

```java
@RestController
public class ConsumerController {
    @Autowired
    HelloRemote helloRemote;

    @RequestMapping("/hi")
    public String hi(){
        return helloRemote.hello("my");
    }

}
```

## 负载均衡

> 分别启动两个生产者，则两个生产者同时提供服务

# 熔断器

**级联故障**

![](http://favorites.ren/assets/images/2017/springcloud/hystrix-2.png)

## Hystrix

- 断路器机制
- Fallback
- 资源隔离

>熔断只是作用在服务调用这一端

### 添加熔断机制

- 开启配置

```properties
feign.hystrix.enabled=true
```

- 编写fallback

```java
@Component
public class HelloRemoteHystrix implements HelloRemote {
    @Override
    public String hello(String name) {
        return "sorry,service call failed";
    }
}
```

- 在远程调用接口上添加fallback

```java
@FeignClient(value = "producer",fallback = HelloRemoteHystrix.class)
public interface HelloRemote {

    @RequestMapping("/hello")
    String hello(@RequestParam String name);
}
```

这样一旦producer挂掉了，将会返回默认结果

## Hystrix-dashboard

>通过Hystrix Dashboard我们可以在直观地看到各Hystrix Command的请求响应时间, 请求成功率等数据

### 单个应用的熔断监控

- 添加依赖

```xml
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>

        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
```

- 打开自动配置

```java
@EnableCircuitBreaker
@EnableHystrixDashboard
```

- 如果发生404则添加如下配置

```java
@Bean
    public ServletRegistrationBean getServlet() {
        HystrixMetricsStreamServlet streamServlet = new HystrixMetricsStreamServlet();
        ServletRegistrationBean registrationBean = new ServletRegistrationBean(streamServlet);
        registrationBean.setLoadOnStartup(1);
        registrationBean.addUrlMappings("/hystrix.stream");
        registrationBean.setName("HystrixMetricsStreamServlet");
        return registrationBean;
    }
```

- 访问

>http://127.0.0.1:10000/hystrix/













