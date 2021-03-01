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

1. NameNode（nn）：存储文件的元数据，如文件名，文件目录结构，文件属性（生成时间、副本数、文件权限），以及每个文件的块列表和块所在的DataNode等
2. DataNode(dn)：在本地文件系统存储文件块数据，以及块数据的校验和
3. Secondary NameNode(2nn)：每隔一段时间对NameNode元数据备份

### YARN

![屏幕截图 2021-02-27 162140](/assets/屏幕截图%202021-02-27%20162140.png)

### MapReduce

分任务 计算任务 汇总任务

## 安装

<https://github.com/big-data-europe/docker-hadoop>

测试集群：

```sh
adoop fs -mkdir /test # 创建文件夹
```
