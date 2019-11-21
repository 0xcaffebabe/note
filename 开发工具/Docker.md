> Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口

# 容器与虚拟机

![](https://pic2.zhimg.com/80/20006deca0fccda0d536edd626835e9e_hd.jpg)

# Docker架构

![](https://www.runoob.com/wp-content/uploads/2016/04/576507-docker1.png)

- 镜像与容器
    - 容器是镜像的实例

# 安装

- 安装脚本

```shell
wget https://get.docker.com
```

# 使用

## 镜像相关

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
```

## 容器相关

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

# 常用软件部署

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

# 迁移与备份


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

## 根据文件构建镜像

```shell
docker build -t='name' .
```

## 镜像分层

# 私有仓库

## 搭建

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

# DockerMaven插件

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












