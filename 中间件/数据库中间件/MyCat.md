# MyCat

MyCAT是一款由阿里Cobar演变而来的用于支持数据库，读写分离、分表分库的分布式中间件
MyCAT原理MyCAT主要是通过对SQL的拦截，然后经过一定规则的分片解析、路由分析、读写分离分析、缓存分析等，然后将SQL发给后端真实的数据块，并将返回的结果做适当处理返回给客户端

## 使用

- server.xml

```xml
<!-- 读写都可用的用户 -->
<user name="root" defaultAccount="true">
    <property name="password">123</property>
    <property name="schemas">mycat_testdb</property>

    <!-- 表级 DML 权限设置 -->
    <!--        
    <privileges check="false">
        <schema name="TESTDB" dml="0110" >
            <table name="tb01" dml="0000"></table>
            <table name="tb02" dml="1111"></table>
        </schema>
    </privileges>       
     -->
</user>

<!-- 只读用户 -->
<user name="user">
    <property name="password">123</property>
    <property name="schemas">mycat_testdb</property>
    <property name="readOnly">true</property>
</user>
```

- schema.xml

```xml
    <!-- TESTDB1 是mycat的逻辑库名称，链接需要用的 -->
    <schema name="mycat_testdb" checkSQLschema="false" sqlMaxLimit="100" dataNode="dn1"></schema>
        <!-- database 是MySQL数据库的库名 -->
    <dataNode name="dn1" dataHost="localhost1" database="test" />
    <!--
    dataNode节点中各属性说明：
    name：指定逻辑数据节点名称；
    dataHost：指定逻辑数据节点物理主机节点名称；
    database：指定物理主机节点上。如果一个节点上有多个库，可使用表达式db$0-99，     表示指定0-99这100个数据库；

    dataHost 节点中各属性说明：
        name：物理主机节点名称；
        maxCon：指定物理主机服务最大支持1000个连接；
        minCon：指定物理主机服务最小保持10个连接；
        writeType：指定写入类型；
            0，只在writeHost节点写入；
            1，在所有节点都写入。慎重开启，多节点写入顺序为默认写入根据配置顺序，第一个挂掉切换另一个；
        dbType：指定数据库类型；
        dbDriver：指定数据库驱动；
        balance：指定物理主机服务的负载模式。
            0，不开启读写分离机制；
            1，全部的readHost与stand by writeHost参与select语句的负载均衡，简单的说，当双主双从模式(M1->S1，M2->S2，并且M1与 M2互为主备)，正常情况下，M2,S1,S2都参与select语句的负载均衡；
            2，所有的readHost与writeHost都参与select语句的负载均衡，也就是说，当系统的写操作压力不大的情况下，所有主机都可以承担负载均衡；
-->
    <dataHost name="localhost1" maxCon="1000" minCon="10" balance="3" writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <!-- 可以配置多个主从 -->
        <writeHost host="hostM1" url="192.168.182.131:3306" user="root" password="123">
            <!-- 可以配置多个从库 -->
            <readHost host="hostS2" url="192.168.182.132:3306" user="root" password="123" />
        </writeHost>
    </dataHost>
```

## 分片枚举

分片枚举算法就是根据不同的枚举(常量)，分类存储。

- schema.xml

```xml
<schema name="mycat_testdb" checkSQLschema="false" sqlMaxLimit="100" dataNode="dn1">
 
  <table name="order_info"  dataNode="dn1,dn2,dn3" rule="role2" /> 

</schema>
<!-- database 是MySQL数据库的库名 -->
<dataNode name="dn1" dataHost="localhost1" database="db1" />
<dataNode name="dn2" dataHost="localhost1" database="db2" />
<dataNode name="dn3" dataHost="localhost1" database="db3" />
```

- rule.xml

```xml
<tableRule name="role2">
         <rule>
              <columns>name</columns>
            <algorithm>hash-int</algorithm>
            </rule>
</tableRule>

<function name="hash-int" class="io.mycat.route.function.PartitionByFileMap">
	<property name="mapFile">partition-hash-int.txt</property>
	<property name="type">1</property>
    <!-- 如果mapfile没有满足的条件，则使用节点 -->
	<property name="defaultNode">1</property>
</function>
```

- partition-hash-int.txt

```text
wuhan=0
shanghai=1
suzhou=2
```

## 取模

使用根据ID对节点数量取余，得到存放节点
这种方式数据库节点一开始就是固定的，如果节点数量发生变更，需要迁移数据rehash

## 查询原理

如果含有分片字段，则根据字段计算出数据所在DB，向DB发送查询请求并返回给客户端

否则向所有DB节点发送查询请求，汇总结果后拼接返回给客户端
所以如果没有排序，会发现同样的条件查询，会有不同的顺序