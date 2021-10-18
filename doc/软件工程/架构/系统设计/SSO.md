# SSO

- 单点登录

大型互联网公司中，公司旗下可能会有多个子系统，每个登陆实现统一管理多个账户信息统一管理 SSO单点登陆认证授权系统

## 架构

![202033184733](/assets/202033184733.png)

浏览器访问client，client发现没有登录，跳转到server

浏览器在server上进行登录认证后跳转回client

server回调client的时候，携带了一个session id，客户端可以使用这个session id向server查询来验证请求有效性，验证通过client会向浏览器写入cookie，登录成功

## CAS

> CAS 是 Yale 大学发起的一个开源项目，旨在为 Web 应用系统提供一种可靠的单点登录方法

### 体系结构

![2020123192036](/assets/2020123192036.png)

### 原理

![2020123192119](/assets/2020123192119.png)

1. 访问服务：SSO客户端发送请求访问应用系统提供的服务资源。
2. 定向认证：SSO客户端会重定向用户请求到SSO服务器。
3. 用户认证：用户身份认证。
4. 发放票据：SSO服务器会产生一个随机的Service Ticket。
5. 验证票据：SSO服务器验证票据Service Ticket的合法性，验证通过后，允许客户端访问服务。
6. 传输用户信息：SSO服务器验证票据通过后，传输用户认证结果信息给客户端。

### 术语

Ticket Granting ticket (TGT) ：可以认为是CAS Server根据用户名密码生成的一张票，存在Server端

Ticket-granting cookie (TGC) ：其实就是一个Cookie，存放用户身份信息，由Server发给Client端

Service ticket (ST) ：由TGT生成的一次性票据，用于验证，只能用一次。相当于Server发给Client一张票，然后Client拿着这个票再来找Server验证，看看是不是Server签发的
