# Nginx

Nginx ("engine x") 是一个高性能的 **HTTP** 和 **反向代理** 服务器，也是一个 IMAP/POP3/SMTP 代理服务器

**vs apache**

- 重量级 不支持高并发

最核心的区别在于apache是同步多进程模型，一个连接对应一个进程
nginx是异步的，多个连接（万级别）可以对应一个进程

**主要功能**

- http服务器
- 反向代理
- 负载均衡
- 动态路由
- 请求过滤

## 手动编译nginx

依赖项（Ubuntu）：libpcre3 libpcre3-dev  zlib1g-dev openssl libssl-dev

```sh
./configure
make
make install
```

```sh
/usr/local/nginx/sbin/nginx
/usr/local/nginx/sbin/nginx -s stop # 停止
/usr/local/nginx/sbin/nginx -s quit # 优雅退出
```

## 配置

nginx目录结构

```
|---sbin
| |---nginx
|---conf
| |---koi-win
| |---koi-utf
| |---win-utf
| |---mime.types
| |---mime.types.default
| |---fastcgi_params
| |---fastcgi_params.default
| |---fastcgi.conf
| |---fastcgi.conf.default
| |---uwsgi_params
| |---uwsgi_params.default
| |---scgi_params
| |---scgi_params.default
| |---nginx.conf
| |---nginx.conf.default
|---logs
| |---error.log
| |---access.log
| |---nginx.pid
|---html
| |---50x.html
| |---index.html
|---client_body_temp
|---proxy_temp
|---fastcgi_temp
|---uwsgi_temp
|---scgi_temp
```

### 进程关系

- worker进程：处理用户请求，worker进程可以同时处理的请求数只受限于内存大小，一般设置为CPU核心数
- master进程：管理wroker进程

### 通用语法

- 块配置

```nginx
http {
    key value1 value2;
    # 注释
    server {...}
}
```

当内外层块中的配置发生冲突时，究竟是以内层块还是外层块的配置为准，包括配置值有几个，都取决于解析这个配置项的模块。

如果配置项值中包括语法符号，比如空格符，那么需要使用单引号或双引号括住配置项值

- 配置项单位

空间单位：k m

时间单位：ms s h d...

- 使用变量

```nginx
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
```

只有少数模块才支持变量

### 基本配置

- 调试与定位问题

```nginx
daemon on|off; # 是否以守护进程方式运行Nginx 默认为on 一般在调试时关闭
master_process on|off; # 是否以master/worker方式工作 默认为on
error_log pathfile level; # 设置日志输出的级别及位置位置 默认为logs/error.log error
events {
    debug_connection 10.224.66.14; # 仅仅来自该IP地址的请求才会输出debug级别的日志
}
worker_rlimit_core size; # 限制coredump核心转储文件的大小
working_directory path; # 指定coredump文件生成目录
```

- 运行配置

```nginx
env TESTPATH=/tmp/; # 设置操作系统环境变量
# 切入其他配置文件 可以使单个配置文件或者是通配符
include mime.types;
include vhost/*.conf;
pid path/file; # 设置pid文件路径 默认为logs/nginx.pid
user username[groupname]; # 设置worker进程运行的用户及用户组 默认为nobody
worker_rlimit_nofile limit; # 设置一个worker进程可以打开的最大文件句柄数
```

- 优化性能配置

```nginx
worker_processes 6; # 工作线程数，建议设置为CPU核数
worker_connections  10240; # 每个工作线程最大支持连接
worker_cpu_affinity cpumask[cpumask...]; # 绑定worker进程到指定的CPU内核
tcp_nopush; # 在linux/Unix系统中优化tcp数据传输，仅在sendfile开启时有效
sendfile on; # 开启高效文件传输模式,直接由内核读取文件发送给网卡
ssl_engine device; # SSL硬件加速
timer_resolution t; # 系统调用gettimeofday的执行频率
worker_priority nice; # worker进程优先级设置
keepalive_timeout 120; # 长连接超时时间，单位是秒
gzip on; # 开启gzip压缩输出
```

- 事件类

```nginx
accept_mutex[on|off]; # 是否打开accept锁,ccept_mutex这把锁可以让多个worker进程轮流地、序列化地与新的客户端建立TCP连接,当某个worker的连接数很多时，新到来的连接与该wroker连接的可能性就会减小
lock_file path/file; # lock文件路径 默认在logs/nginx.lock 若由于底层不支持原子锁 则nginx才会使用该文件实现accept锁
accept_mutex_delay Nms; # 使用accept锁后到真正建立连接之间的延迟时间
multi_accept[on|off]; # 默认为off 若开启当事件模型通知有新连接时，尽可能地对本次调度中客户端发起的所有TCP请求都建立连接
use[kqueue|rtsig|epoll|/dev/poll|select|poll|eventport]; # 选择事件模型 nginx会自动选择最合适的模型
```

- `autoindex on; `开启目录列表访问，合适下载服务器，默认关闭。

## Web服务器配置

### 虚拟主机

每个server块就是一个虚拟主机，它只处理与之相对应的主机域名请求

- 基于端口的虚拟主机

```nginx
server {
    listen 80;
    listen 127.0.0.1:8000;
    listen 127.0.0.1; 默认为80端口
    listen [::]:8000; ipv6
    ...
}
```

- 基于主机名的虚拟主机

处理一个HTTP请求时，Nginx会取出header头中的Host，与每个server中的server_name进行匹配，以此决定到底由哪一个server块来处理这个请求

```nginx
server {
    listen       80;
    server_name  www.ismy.wang;
    server_names_hash_bucket_size; # Nginx使用散列表来存储server name。server_names_hash_bucket_size设置了每个散列桶占用的内存大小
    server_names_hash_max_size; # server_names_hash_max_size越大，消耗的内存就越多，但散列key的冲突率则会降低，检索速度也更快
    server_name_in_redirect on|off; # 在使用on打开时，表示在重定向请求时会使用server_name里配置的第一个主机名代替原先请求中的Host头部
    ...
}
```

匹配优先级：www.baidu.com -> `*.baidu.com` ->  `baidu.*` -> 使用正则表达式的主机名

- location语法

尝试根据用户请求中的URI来匹配上面的/uri表达式

=开头表示精确匹配

`^~ images` 开头表示uri以某个`images`字符串开头

`~` 开头表示区分大小写的匹配

`~*` 开头表示不区分大小写的匹配

`/` 通用匹配, 如果没有其它匹配,任何请求都会匹配到

“普通location ”与“表达式 location ”之间的匹配顺序是:

先匹配普通 location ，再“考虑”匹配表达式 location 

使用正则表达式

```nginx
location ~* \.(gif|jpg)$ {
    # 匹配.gif .jpg结尾的请求
}
```

为了表示如果都不匹配，则到这里 可以在最后一个location中使用/作为参数，它会匹配所有的HTTP请求，这样就可以表示如果不能匹配前面的所有location，则由“/”这个location处理

访问状态监控：

```nginx
location /basic_status {
    stub_status on;
}
```

### 文件路径

```nginx
location / {
    root usr/local; # 若访问/index.html nginx会读取usr/local/index.html文件返回
    index index.html; # 首页配置
    error_page 404 404.html; # 错误码重定向
    error_page 500 @fallback; # 重定向到location
    recursive_error_pages[on|off]; # 是否允许递归使用error_page
    try_files path1[path2]uri; # 尝试按顺序根据路径列表读取 如果读取成功就返回 否则依次尝试
}
location @fallback {
    proxy_pass http://backend
}
```

另外一个配置项是alias，/conf/nginx.conf请求将根据alias path映射为path/nginx.conf

### 内存及磁盘资源分配

```nginx
client_body_in_file_only on|clean|off; # HTTP包体只存储到磁盘文件中 一般用于调试
client_body_in_single_buffer on|off; # HTTP包体尽量写入到一个内存buffer中
client_header_buffer_size size; # 存储HTTP头部的内存buffer大小 默认为1k
large_client_header_buffers number size; # 存储超大HTTP头部的内存buffer大小 默认48k
client_body_buffer_size size; # 存储HTTP包体的内存buffer大小 HTTP包体会先接收到指定的这块缓存中，之后才决定是否写入磁盘
client_body_temp_path dir-path[level1[level2[level3]]] # 定义HTTP包体存放的临时目录 防止目录文件过多影响性能 后边的level可以指定继续创建子目录来存放
connection_pool_size; # 对于每个建立成功的TCP连接预先分配的内存池大小
request_pool_size; # 处理HTTP请求时为请求分配的内存池大小
```

### 网络连接设置

### MIME类型设置

### 对客户端请求限制

### 文件操作优化

### 客户端请求处理

## 反向代理

- 正向代理：通过客户机的配置，实现让一台服务器代理客户机，客户的所有请求都交给代理服务器处理。正向代理隐藏真实客户端
- 反向代理：用一台服务器，代理真实服务器，用户访问时，不再是访问真实服务器，而是代理服务器。反向代理隐藏真实服务端

![](https://img.mukewang.com/5979e29e00010efd13500750.png)

反向代理隐藏真实内部ip地址，请求先访问nginx代理服务器,nginx服务器再转发到真实服务器中

Nginx对于用户发送来的请求会完整缓存到nginx再转发到上游服务器，但对上游服务器的响应，则会边接收边转发给客户端。这样的设计由于客户端的请求走公网，质量可能会较差，但上游服务器到nginx则是内网，这可以有效降低上游服务器的负载，但也增加了处理请求的时长。

### 负载均衡基本配置

- upstream

```nginx
upstream so {
    ip_hash; # 不可与weight同时使用 来自某一个用户的请求始终落到固定的一台上游服务器中
    server www.baidu.com:80 weight=5; # 转发权重为5
    server www.163.com:80 max_fails=3 fail_timeout=30s; # 转发次数超过max_fails 次，则在fail_timeout时间内认为这个服务器不可用
}
server {
    listen 8080;
    location / {
        proxy_pass http://so/;
    }
}
```

- upstream支持的相关日志变量

变量                      | 意义
----------------------- | -----------------------------------------------
$upstream_addr          | 处理请求的上游服务器地址
$upstream_cache_status  | 表示是否命中缓存，取值范围: MISS、 EXPIRED、UPDATING、STALE、HIT
$upstream_status        | 上游服务器返回的响应中的HTTP响应码
$upstream_response_time | 上游服务器的响应时间，精度到毫秒
$upstream_http_$HEADER  | HTTP的头部，如upstream http_ host

### nginx反向代理配置

```nginx
http{
    ...
    server {
        listen       80;
        server_name  hostname;
        # 默认情况下反向代理是不会转发请求中的Host头部的 需要手动配置
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
```nginx
proxy_method POST; # 配置转发时的方法名
proxy_hide_header the_header; #指定哪些HTTP头部字段不能被转发
proxy_pass_header; # 会将原来禁止转发的header设置为允许转发
proxy_pass_request_body on|off; # 是否向上游服务器发送HTTP包体部分
proxy_pass_request_headers; # 确定是否转发HTTP头部
proxy_redirect[default|off|redirect replacement]; # 重设HTTP头部的location或refresh字段
proxy_next_upstream[error|timeout|invalid_header|http_500|http_502|http_503|http_504|http_404|off]; # 满足某些情况下，允许一台上游服务器发生错误时换一台上游服务器来处理
```

## 负载均衡

所有请求先到负载均衡器，在由负载均衡器采用负载均衡算法（轮训、IP绑定、权重）分发到不同实际的服务器中

- 四层负载均衡：基于IP+端口的负载均衡（传输层），此种负载均衡不理解应用协议（如HTTP/FTP/MySQL等等）。例子：LVS（软负载），F5硬件负载
- 七层负载均衡：基于应用层的信息决定如何转发（应用层）

![批注 2020-01-22 165829](/assets/批注%202020-01-22%20165829.png)

### 带来的问题

- 分布式Session一致性问题
- 分布式定时任务调度幂等性问题
- 分布式生成全局ID

### 轮询算法

- 轮询（默认）

每个请求按时间顺序逐一分配到不同的后端服务，如果后端某台服务器死机，自动剔除故障系统，使用户访问不受影响。

- weight（轮询权值）

weight的值越大分配到的访问概率越高，主要用于后端每台服务器性能不均衡的情况下。或者仅仅为在主从的情况下设置不同的权值，达到合理有效的地利用主机资源。

```
# 设置权重
server www.baidu.com:80 weight=2;
# 设置最大连接数
server 127.0.0.1:8050    weight=5  max_conns=800;
server www.163.com:80 weight=8;
```

max_fails:失败多少次 认为主机已挂掉则，踢出
max_fails=3 fail_timeout=30s代表在30秒内请求某一应用失败3次，认为该应用宕机，后等待30秒，这期间内不会再把新请求发送到宕机应用

- ip_hash

每个请求按访问IP的哈希结果分配，使来自同一个IP的访客固定访问一台后端服务器，并且可以有效解决动态网页存在的session共享问题。俗称IP绑定。

```
server {
    ...
    ip_hash;
}
```

- fair（第三方）

比 weight、ip_hash更加智能的负载均衡算法，fair算法可以根据页面大小和加载时间长短智能地进行负载均衡，也就是根据后端服务器的响应时间 来分配请求，响应时间短的优先分配

- url_hash(第三方)

按访问的URL的哈希结果来分配请求，使每个URL定向到一台后端服务器，可以进一步提高后端缓存服务器的效率

### 动态负载均衡

#### Consul

>Consul是一款开源的分布式服务注册与发现系统，通过HTTP API可以使得服务注册、发现实现起来非常简单

## 双机主从热备

![202001241419](/assets/202001241419.png)

### LVS

可以实现传输层四层负载均衡。LVS是Linux Virtual Server的缩写，意思是Linux虚拟服务器。目前有三种IP负载均衡技术（VS/NAT、VS/TUN和VS/DR）；八种调度算法（rr,wrr,lc,wlc,lblc,lblcr,dh,sh）

### Keepalived

Keepalived是基于vrrp协议的一款高可用软件。Keepailived有一台主服务器和多台备份服务器，在主服务器和备份服务器上面部署相同的服务配置，使用一个虚拟IP地址对外提供服务，当主服务器出现故障时，虚拟IP地址会自动漂移到备份服务器

## 故障转移

当上游服务器,一旦出现故障或者是没有及时响应的话，应该直接轮训到下一台服务器，保证服务器的高可用

配置超时时间，超时进行故障转移

```
location / {
    proxy_pass http://so/;
    proxy_connect_timeout 1s;
    proxy_send_timeout 1s;
    proxy_read_timeout 1s;
}
```

## 动静分离

动静分离将网站静态资源（HTML，JavaScript，CSS，img等文件）与后台应用分开部署，提高用户访问静态资源的速度，降低对后台应用访问的频次。这里我们将静态资源放到nginx中，动态资源转发到tomcat服务器中

- nginx实现方式

通过对URL或者域名的判断，进行转发

![202001242247](/assets/202001242247.gif)

### 浏览器缓存

对于静态文件，例如：CSS、图片，服务器会自动完成 Last Modified 和 If Modified Since 的比较，完成缓存或者更新

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

## oprenresty

### 整合lua

```
location /lua {
  default_type text/html;
  content_by_lua '
     ngx.say("<p>Hello, World!</p>")
   ';
}
```


- 外部文件

```
location /lua {
  default_type text/html;
  content_by_lua_file /hello.lua;
```
