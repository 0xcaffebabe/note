> Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口

# 安装

- 安装脚本

```shell
wget https://get.docker.com
```

# 架构

![批注 2019-07-25 150512](/assets/批注%202019-07-25%20150512.png)

- 运行一个容器

```shell
docker run -p 8080:80 -d daocloud.io/nginx
```

- 复制文件到容器中

```shell
docker cp index.html e07dc4e0236a://usr/share/nginx/html
```

- 保存镜像

```shell
docker commit -m 'update' e07dc4e0236a nginx-update
```

- 停止容器

```shell
docker stop e07dc4e0236a
```

- 进入容器内部

```shell
docker exec -it <name> bash
```

# Dockerfile

![批注 2019-07-25 153841](/assets/批注%202019-07-25%20153841.png)

示例：

```docker
FROM ubuntu
MAINTAINER MY
RUN apt-get update
RUN apt-get install nginx -y
COPY index.html /var/www/html
ENTRYPOINT ["/usr/sbin/nginx","-g","daemon off;"]
EXPOSE 80
```

## 镜像分层

# Volume

> 容器外的持久化操作

# Registry

> 仓库

```shell
docker search <name>
docker pull <name>
```

# Compose

# Docker 网络

- 网络类型
  - Bridge
  - Host
  - None
- 端口映射

```shell
# 将本机8080端口映射到容器80端口
docker run -p 8080:80 <name>

# 将本机端口随机与容器端口映射
docker run -P <name>
```

# 镜像制作






