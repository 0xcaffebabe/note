# Nginx

## 主要功能

- http服务器
- 反向代理
- 负载均衡
- 动态路由
- 请求过滤

## 虚拟主机

### 基于端口的虚拟主机

```
server {
    listen       80;
    ...
}
```

### 基于域名的虚拟主机

```
server {
    listen       80;
    server_name  www.itmayiedu.com;
    ...
}
```

### location语法

=开头表示精确匹配
^~ 开头表示uri以某个~字符串开头，不是正则匹配
~ 开头表示区分大小写的正则匹配
~* 开头表示不区分大小写的正则匹配
/ 通用匹配, 如果没有其它匹配,任何请求都会匹配到

## 反向代理

- 正向代理：通过客户机的配置，实现让一台服务器代理客户机，客户的所有请求都交给代理服务器处理。正向代理隐藏真实客户端
- 反向代理：用一台服务器，代理真实服务器，用户访问时，不再是访问真实服务器，而是代理服务器。反向代理隐藏真实服务端

![](https://img.mukewang.com/5979e29e00010efd13500750.png)

反向代理隐藏真实内部ip地址，请求先访问nginx代理服务器,nginx服务器再转发到真实服务器中

nginx反向代理配置

```
http{
    ...
    server {
        listen       80;
        server_name  hostname;

        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        location / {
            proxy_pass http://127.0.0.1:8080;
            proxy_connect_timeout 600;
            proxy_read_timeout 600;
        }
    }
}
```

## 负载均衡

所有请求先到负载均衡器，在由负载均衡器采用负载均衡算法（轮训、IP绑定、权重）分发到不同实际的服务器中

- 四层负载均衡：基于IP+端口的负载均衡（传输层），此种负载均衡不理解应用协议（如HTTP/FTP/MySQL等等）。例子：LVS（软负载），F5硬件负载
- 七层负载均衡：基于应用层的信息决定如何转发（应用层）

![批注 2020-01-22 165829](/assets/批注%202020-01-22%20165829.png)

## SSI

>服务端嵌入

ssi包含类似于jsp页面中的incluce指令，ssi是在web服务端将include指定 的页面包含在网页中，渲染html网页响 应给客户端 。nginx、apache等多数web容器都支持SSI指令。

```
<!‐‐#include virtual="/../....html"‐‐>
```

### 配置

```conf
server{ 
    listen       80;
    server_name  www.edu.com;      
    ssi on;      
    ssi_silent_errors on;      
    .....
```


