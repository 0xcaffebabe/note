# FastDFS

- 分布式文件系统

>分布式文件系统（Distributed File System）是指文件系统管理的物理存储资源不一定直接连接在本地节点上，而是通过计算机网络与节点(可简单的理解为一台计算机)相连

- NFS
- GFS
- HDFS

## 架构

- Tracker：负责调度
- Storage：负责存储
- group：组，也称为卷。同组内服务器上的文件是完全相同的

## 上传流程

![202061141754](/assets/202061141754.png)

## 安装

```shell
docker pull delron/fastdfs
```

- 安装Tracker

```shell
docker run -d --network=host --name tracker -v /docker/fastdfs/tracker:/var/fdfs delron/fastdfs tracker
```

- 安装Storage

```shell
docker run -d --network=host --name storage -e TRACKER_SERVER=192.168.1.56:22122 -v /docker/fastdfs/storage:/var/fdfs -e GROUP_NAME=group1 delron/fastdfs storage
```

## JAVA API

- 依赖

```xml
<dependency>
    <groupId>com.github.tobato</groupId>
    <artifactId>fastdfs-client</artifactId>
    <version>${fastDFS.client.version}</version>
</dependency>
```

- 配置

```yml
fdfs:
  so-timeout: 1501 # 超时时间
  connect-timeout: 601 # 连接超时时间
  thumb-image: # 缩略图
    width: 60
    height: 60
  tracker-list: # tracker地址
    - my-pc:22122

image:
  adress: http://my-pc:8888/
```

- 使用

```java
StorePath storePath = storageClient.uploadImageAndCrtThumbImage(file.getInputStream(), file.getSize(),"扩展名", null);
```

