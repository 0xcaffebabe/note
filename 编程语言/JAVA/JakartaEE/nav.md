# Jakarta EE

>Java EE，Java平台企业版（Java Platform Enterprise Edition），之前称为Java 2 Platform, Enterprise Edition (J2EE)，2018年3月更名为Jakarta EE。是Sun公司为企业级应用推出的标准平台

Java EE平台为每个层中不同的组件定义了API，同时还提供了一些额外的服务，比如命名（naming）、注入（injection）和跨平台的资源管理等

## JNDI

![JNDI](/assets/JNDI.png)

J2EE容器允许通过 JNDI 来获取数据源，这样做的好处在于数据源完全可以在应用程序之外进行管理，这样应用程序只需在访问数据库的时候查找数据源就可以了，并且还支持系统管理员对其进行热切换

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Context>
    <Resource name="jndi/oracle"
              auth="Container"
              type="javax.sql.DataSource"
              driverClassName="oracle.jdbc.driver.OracleDriver"
              url="jdbc:oracle:thin:@localhost:1521:Orcl"
              username="scott"
              password="tiger"
              maxActive="20"
              maxIdle="5"
              maxWait="10000"
              initialSize="10"/>
</Context>
```
```java
ctx = new InitialContext();
ds = (DataSource) ctx.lookup("java:comp/env/jndi/oracle");
```
