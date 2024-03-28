# Spring 集成

## 远程调用

远程调用的一些技术：

- RMI
- Hessian 和 Burlap
- HTTP
- JAX-WS 和 Web Service

![2022110104548](/assets/2022110104548.png)

### Spring 的远程调用

![202211010453](/assets/202211010453.png)

#### RMI

- 导出服务

```java
@Bean
  public RmiServiceExporter rmiServiceExporter(Service service){
      RmiServiceExporter exporter = new RmiServiceExporter();
      exporter.setService(service);
      exporter.setServiceName("service");
      exporter.setServiceInterface(Service.class);
      exporter.setRegistryHost("ismy.wang");
      exporter.setRegistryPort(1999);
      return exporter;
  }
```

- 装配服务

#### Hessian 和 Burlap

#### HttpInvoker

#### 使用web服务
