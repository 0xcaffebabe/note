# Docker

> Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口

使用场景

- 持续集成
- 可伸缩的云服务
- 微服务架构

## 容器与虚拟机

![2020822151647](/assets/2020822151647.png)

虚拟机最大的缺点就是依赖其专用的操作系统

## Docker架构

![](https://www.runoob.com/wp-content/uploads/2016/04/576507-docker1.png)

- 镜像与容器
  - 容器是镜像的实例

## 安装

- 安装脚本

```shell
wget https://get.docker.com
```

## 引擎

Docker引擎由如下主要的组件构成：Docker客户端（Docker Client）、Docker守护进程（Docker daemon）、containerd以及runc。它们共同负责容器的创建和运行

![2020822154342](/assets/2020822154342.png)

LXC提供了对诸如命名空间（Namespace）和控制组（CGroup）等基础工具的操作能力，它们是基于Linux内核的容器虚拟化技术

![2020822154039](/assets/2020822154039.png)

Docker公司开发了名为Libcontainer的自研工具，用于替代LXC

runc：

- 创建容器

containerd：

- 容器的生命周期管理

启动容器的过程：

![2020822154716](/assets/2020822154716.png)

容器运行时与Docker daemon是解耦的,对Docker daemon的维护和升级工作不会影响到运行中的容器

shim：

- 保持所有STDIN和STDOUT流是开启状态
- 将容器的退出状态反馈给daemon

## 镜像

![2020823154249](/assets/2020823154249.png)

### 镜像使用

- 搜索镜像

```shell
docker search name
```

- 拉取镜像

```shell
docekr pull name<:tag>
```

- 删除镜像

```shell
docker rmi 镜像ID
docker image rm $(docker image ls -q) -f
```

### 标签

在镜像名后面的:xxx 代表标签

没有标签的镜像被称为悬虚镜像

### 分层

![2020823154946](/assets/2020823154946.png)

docker 会复用已存在的镜像层

### 镜像仓库

![2020823154458](/assets/2020823154458.png)

#### 搭建

```shell
docekr pull registry
```

```shell
docker run -di --name=registry 5000:5000 registry   
```

## 上传镜像到私服

```shell
docker tag nginx 127.0.0.1:5000/nginx 
```

```shell
docker push 127.0.0.1:5000/nginx 
```

## 容器

### 持久化

容器在停止后启动写入的数据仍会存在

但是volume才是持久化的首选

### 重启策略

在指定事件或者错误后重启来完成自我修复

- always
- unless-stoped
- on-failed

### 容器使用

- 查看容器

```shell
docker ps
```

- 运行一个容器

```shell
docker run -p 8080:80 -d daocloud.io/nginx
```

- 复制文件到容器中

```shell
docker cp index.html e07dc4e0236a://usr/share/nginx/html
```

- 从容器中复制出文件

```shell
docker cp name:容器文件路径 宿主路径
```

- 停止容器

```shell
docker stop name
# 优雅关闭并删除：stop rm
```

- 启动容器

```shell
docker start name
```

- 进入容器内部

```shell
docker exec -it <name> bash
```

- 目录挂载
  - 在启动容器时，使用`-v`参数

- 查看容器信息

```shell
docker inspect name
```

- 查看容器日志

```sh
docker logs name
```

## 常用软件部署

- mysql

```shell
# 将宿主机33306映射到容器3306，指定root密码为123
docker run -di --name=mysql1 -p 33306:3306 -e MYSQL_ROOT_PASSWORD=123 mysql 
```

- tomcat

```shell
docker run -di --name=mytomcat -p 9000:8080 -v /usr/local/webapps:/usr/local/tomcat/webapps tomcat 
```

- nginx

```shell
docker run -di --name=mynginx2 -p 8080:80 nginx-update 
```

## 迁移与备份


- 保存镜像

```shell
docker commit -m 'update' e07dc4e0236a nginx-update
```

- 保存为压缩包

```shell
docker save -o nginx-update.tar nginx-update
```

- 把压缩包恢复成镜像

```shell
docker load -i nginx-update.tar
```

## 容器化

![202082316156](/assets/202082316156.png)

### Dockerfile

![批注 2019-07-25 153841](/assets/批注%202019-07-25%20153841.png)

编写Dockerfile文件：

```docker
FROM ubuntu
MAINTAINER MY
RUN apt-get update
RUN apt-get install nginx -y
COPY index.html /var/www/html
ENTRYPOINT ["/usr/sbin/nginx","-g","daemon off;"]
EXPOSE 80
```

每一个RUN指令会新增一个镜像层。因此，通过使用&& 连接多个命令以及使用反斜杠（\ ）换行的方法，将多个命令包含在一个RUN指令中，通常来说是一种值得提倡的方式

根据文件构建镜像：

```shell
docker build -t='name' .
```

### DockerMaven插件

- 开启docker接受远程操作
- 添加maven插件

```xml
<plugin>
    <groupId>com.spotify</groupId>
    <artifactId>docker-maven-plugin</artifactId>
    <version>0.4.12</version>
    <configuration>
      <!-- 注意imageName一定要是符合正则[a-z0-9-_.]的，否则构建不会成功 -->
      <!-- 详见：https://github.com/spotify/docker-maven-plugin    Invalid repository name ... only [a-z0-9-_.] are allowed-->
      <imageName>my-pc:5000/${project.artifactId}:${project.version}</imageName>
        <baseImage>java</baseImage>
        <entryPoint>["java", "-jar", "/${project.build.finalName}.jar"]</entryPoint>
          <resources>
              <resource>
                  <targetPath>/</targetPath>
                  <directory>${project.build.directory}</directory>
                  <include>${project.build.finalName}.jar</include>
              </resource>
          </resources>
        <dockerHost>http://my-pc:2375</dockerHost>
     </configuration>
</plugin>
```

- JDK8以上的版本需要添加如下依赖

```xml
<dependencies>
    <dependency>
        <groupId>javax.activation</groupId>
        <artifactId>activation</artifactId>
        <version>1.1.1</version>
    </dependency>
</dependencies>
```

- 构建并推送

```shell
mvn clean package docker:build -DpushImage
```


### 推送到仓库

```sh
docker images push
```

![202082316201](/assets/202082316201.png)

### 多阶段构建

```Dockerfile
FROM xxx AS T1

FROM xxx AS T2
COPY --from=T1 ...
```

### 最佳实践

利用构建缓存：

- 执行命令时，Docker会检查构建缓存中是否存在基于同一基础镜像，并且执行了相同指令的镜像层

合并镜像：

- 执行docker image build 命令时，可以通过增加--squash 参数来创建一个合并的镜像

![202082316289](/assets/202082316289.png)

no-install-recommends：

- 若使用的是APT包管理器，则应该在执行apt-get install 命令时增加no-install-recommends 参数。这能够确保APT仅安装核心依赖（Depends 中定义）包

不要安装MSI包（Windows）

## Compose

编写docker-compose.yml:

```yml
version: "3.5"
services:
  redis:
    image: "redis:alpine"
    networks:
      my-net:
  nginx:
    image: "nginx"
    networks:
      my-net:
networks:
  my-net:

volumes:
  my-net:
```

启动：

```sh
docker-compose up
```

## Docker 网络

CNM: 定了Docker网络架构的基础组成要素

![2020824154717](/assets/2020824154717.png)
![2020824154742](/assets/2020824154742.png)

Libnetwork是CNM标准的实现

![2020824155551](/assets/2020824155551.png)

```sh
docker network ls # 列出可用网络
docker run -d --network my-net # 指定容器网络
```

如果在相同网络中继续接入新的容器，那么在新接入容器中是可以通过的容器名称来进行网络通信的

### 网络类型
  
- Bridge：: 单机桥接网络 Docker设计的NAT网络模型（默认类型）
  -  只能在单个Docker主机上运行，并且只能与所在Docker主机上的容器进行连接

![2020824155816](/assets/2020824155816.png)

```sh
docker network create -d bridge localnet
```

- Host：与主机共享Network Namespace，--net=host
- overlay：多机覆盖网络
- 接入现有网络
- None：:不为容器配置任何网络功能，没有网络 --net=none
- Container：与另一个运行中的容器共享Network Namespace，--net=container:containerID
- 端口映射

```shell
# 将本机8080端口映射到容器80端口
docker run -p 8080:80 <name>

# 将本机端口随机与容器端口映射
docker run -P <name>
```

## 持久化

每个Docker容器都有自己的非持久化存储。非持久化存储自动创建，从属于容器，生命周期与容器相同

持久化是将数据存储在卷上。卷与容器是解耦的

![2020825152949](/assets/2020825152949.png)
![2020825153020](/assets/2020825153020.png)

卷类型：

- 块存储
  - 适用于对小块数据的随机访问负载
- 文件存储
  - 包括NFS和SMB协议的系统
- 对象存储
  - 适用于较大且长期存储的、很少变更的二进制数据存储。通常对象存储是根据内容寻址

### 卷操作

```sh
docker volume create myv
docker volume inspect myv
docker run ... --mount source=bizvol,target=/vol # 指定容器存储卷
```

## 安全

![202082516037](/assets/202082516037.png)

Docker 平台安全技术：

- Swarm模式
  - 加密节点ID。
  - 基于TLS的认证机制。
  - 安全准入令牌。
  - 支持周期性证书自动更新的CA配置。
  - 加密集群存储（配置DB）。
  - 加密网络
- 内容信任
  - 通过 Docker Hub 信任内容
- 密钥
  - 使用`docker secret`管理密钥