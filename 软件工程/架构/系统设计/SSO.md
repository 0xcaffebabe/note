# SSO

- 单点登录

大型互联网公司中，公司旗下可能会有多个子系统，每个登陆实现统一管理多个账户信息统一管理 SSO单点登陆认证授权系统

## 架构

![202033184733](/assets/202033184733.png)

浏览器访问client，client发现没有登录，跳转到server

浏览器在server上进行登录认证后跳转回client

server回调client的时候，携带了一个session id，客户端可以使用这个session id向server查询来验证请求有效性，验证通过client会向浏览器写入cookie，登录成功