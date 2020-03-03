# Apollo

>Apollo（阿波罗）是携程框架部门研发的分布式配置中心，能够集中化管理应用不同环境、不同集群的配置，配置修改后能够实时推送到应用端，并且具备规范的权限、流程治理等特性，适用于微服务配置管理场景

## 分布式配置中心

将配置文件信息注册到配置中心平台上，可以使用分布式配置中心实时更新配置文件信息，统一管理配置文件，不需要重新打包发布。

## 流程

![2020321874](/assets/2020321874.png)

## 安装

- 拉取代码:<https://github.com/nobodyiam/apollo-build-scripts>
- 创建数据库,导入sql文件
- 配置demo.sh数据库连接信息
- 执行 `demo.sh start`

## Spring boot整合

修改/opt/settings/server.properties（Mac/Linux）或C:\opt\settings\server.properties（Windows）文件，设置env

- 引入依赖

```xml
<dependency>
    <groupId>com.ctrip.framework.apollo</groupId>
    <artifactId>apollo-client</artifactId>
    <version>1.5.1</version>
</dependency>
```

- 配置注册中心

```properties
server.port=8081
spring.application.name=service
eureka.client.service-url.defaultZone=http://127.0.0.1:8080/eureka
```

- apollo.properties

```properties
local.meta=http://127.0.0.1:8080
dev.meta=http://127.0.0.1:8080
fat.meta=${fat_meta}
uat.meta=${uat_meta}
lpt.meta=${lpt_meta}
pro.meta=${pro_meta}
```

- META-INF/app.properties

```properties
app.id=app_id
```