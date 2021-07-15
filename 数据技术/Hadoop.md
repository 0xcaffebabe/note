# Hadoop

Hadoop是一个由Apache基金会所开发的分布式系统基础架构

Hadoop通常是指一个更广泛的概念——Hadoop生态圈.

三大发行版本：

1. Apaache：基础版本
2. CDH
3. CDP

高可靠 高扩展 高效 高容错

## 发展历史

Lucene -> Nutch -> Haddop

## 组成

![屏幕截图 2021-02-27 160605](/assets/屏幕截图%202021-02-27%20160605.png)

### HDFS

1. NameNode（nn）：存储文件的元数据，如文件名，文件目录结构，文件属性（生成时间、副本数、文件权限），以及每个文件的块列表和块所在的DataNode等，负责执行有关 文件系统命名空间 的操作，例如打开，关闭、重命名文件和目录等
2. DataNode(dn)：在本地文件系统存储文件块数据，以及块数据的校验和，负责提供来自文件系统客户端的读写请求，执行块的创建，删除等操作
3. Secondary NameNode(2nn)：每隔一段时间对NameNode元数据备份

![2021715151850](/assets/2021715151850.png)

HDFS将文件分成一系列块，通过多副本分布在不同节点的方式来进行容错

![2021715152241](/assets/2021715152241.png)

### YARN

![屏幕截图 2021-02-27 162140](/assets/屏幕截图%202021-02-27%20162140.png)

1. ResourceManager: 在独立的机器上以后台进程的形式运行，负责给用户提交的所有应用程序分配资源, 根据规则制定分配策略，调度集群资源
2. NodeManager：每个具体节点的管理者。主要负责该节点内所有容器的生命周期的管理，监视资源和跟踪节点健康
3. ApplicationMaster：负责协调来自 ResourceManager 的资源，并通过 NodeManager 监视容器内资源的使用情况，同时还负责任务的监控与容错
4. Container：YARN 中的资源抽象，它封装了某个节点上内存、CPU、磁盘、网络等资源，YARN 会为每个任务分配一个 Container

![2021715165830](/assets/2021715165830.png)

### MapReduce

分任务 计算任务 汇总任务

## 安装

<https://github.com/big-data-europe/docker-hadoop>

测试集群：

```sh
adoop fs -mkdir /test # 创建文件夹
```
