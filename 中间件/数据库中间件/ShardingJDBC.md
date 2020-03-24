# ShardingJDBC

> 一个客户端数据库分片库

## 流程

![批注 2020-03-24 084921](/assets/批注%202020-03-24%20084921.png)

## 整合spring boot

```xml
<dependency>
    <groupId>io.shardingjdbc</groupId>
    <artifactId>sharding-jdbc-core</artifactId>
    <version>2.0.3</version>
</dependency>
```
```yml
#shardingjdbc配置
sharding:
  jdbc:
    data-sources:
      ###配置第一个从数据库
      ds_slave_0:
        password: 123
        jdbc-url: jdbc:mysql://192.168.182.132:3306/test?useUnicode=true&characterEncoding=utf-8&useSSL=true
        driver-class-name: com.mysql.jdbc.Driver
        username: root

      ###主数据库配置
      ds_master:
        password: 123
        jdbc-url: jdbc:mysql://192.168.182.131:3306/test?useUnicode=true&characterEncoding=utf-8&useSSL=true
        driver-class-name: com.mysql.jdbc.Driver
        username: root
    ###配置读写分离
    master-slave-rule:
      ###配置从库选择策略，提供轮询与随机，这里选择用轮询
      load-balance-algorithm-type: round_robin
      ####指定从数据库
      slave-data-source-names: ds_slave_0
      name: ds_ms
      ####指定主数据库
      master-data-source-name: ds_master
```
```java
@Configuration
@EnableConfigurationProperties(ShardingMasterSlaveConfig.class)
@Log4j2
// 读取ds_master主数据源和读写分离配置
@ConditionalOnProperty({ "sharding.jdbc.data-sources.ds_master.jdbc-url",
        "sharding.jdbc.master-slave-rule.master-data-source-name" })
public class ShardingDataSourceConfig {

    @Autowired
    private ShardingMasterSlaveConfig shardingMasterSlaveConfig;

    @Bean
    public DataSource masterSlaveDataSource() throws SQLException {
        final Map<String, DataSource> dataSourceMap = Maps.newHashMap();
        dataSourceMap.putAll(shardingMasterSlaveConfig.getDataSources());
        final Map<String, Object> newHashMap = Maps.newHashMap();
        // 创建 MasterSlave数据源
        DataSource dataSource = MasterSlaveDataSourceFactory.createDataSource(dataSourceMap,
                shardingMasterSlaveConfig.getMasterSlaveRule(), newHashMap);
        log.info("masterSlaveDataSource config complete");
        return dataSource;
    }

}
@Data
@ConfigurationProperties(prefix = "sharding.jdbc")
public class ShardingMasterSlaveConfig {

    // 存放本地多个数据源
    private Map<String, HikariDataSource> dataSources = new HashMap<>();

    private MasterSlaveRuleConfiguration masterSlaveRule;
}
```