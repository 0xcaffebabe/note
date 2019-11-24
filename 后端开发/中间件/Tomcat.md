> Web服务器一般指网站服务器，是指驻留于因特网上某种类型计算机的程序，可以向浏览器等Web客户端提供文档，也可以放置网站文件，让全世界浏览；可以放置数据文件，让全世界下载。目前最主流的三个Web服务器是Apache、 Nginx 、IIS。

_web服务器与web容器_

# 目录结构

![tomcat目录结构](/assets/tomcat目录结构.png)

# 部署方式

- 直接将项目放到webapps目录下
- 配置conf/server.xml文件

  ```
  在<Host>标签体中配置
                    <Context docBase="D:\hello" path="/hehe" />
                     docBase:项目存放的路径
                     path：虚拟目录
  ```

- 在conf\Catalina\localhost创建任意名称的xml文件。在文件中编写

  ```
  <Context docBase="D:\hello" />
  ```

  - 虚拟目录：xml文件的名称

# JAVA WEB项目目录结构

- 项目的根目录

  - WEB-INF目录：

    - web.xml：web项目的核心配置文件
    - classes目录：放置字节码文件的目录
    - lib目录：放置依赖的jar包


# 优化

## 禁用AJP连接

>AJP（Apache JServ Protocol）是定向包协议。因为性能原因，使用二进制格式来传输可读性文本。WEB服务器通过 TCP连接 和 SERVLET容器连接

## 设置线程池

## 设置运行模式

- bio
- nio
- apr

