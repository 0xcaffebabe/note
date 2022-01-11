# Cookie与Session

两者都是为了保持访问用户与后端服务器的交互状态

## [Cookie](/计算机网络/http/Cookie.md)

> 客户端会话技术，将数据保存到客户端

客户端第一次访问时服务器时 服务器会返回一个设置cookie的响应头 此后在cookie有效期内 并且在cookie所允许的域名下 浏览器发起请求时都会自动携带这个cookie请求头

```java
Cookie[] cookies = req.getCookies();
for (Cookie cookie : cookies) {
    if ("time".equals(cookie.getName())){
        resp.getWriter().println(cookie.getValue());
    }
}
resp.addCookie(new Cookie("time", LocalDateTime.now().toString()));
```

### 实现原理

- 基于响应头set-cookie和请求头cookie实现

### 细节

- 持久化存储： setMaxAge(int seconds)
- 共享
  - 设置共享虚拟目录范围：setPath(String path)
  - 设置共享域：setDomain(String path)

### 特点

- cookie存储数据在客户端浏览器
- 浏览器对于单个cookie 的大小有限制(4kb) 以及 对同一个域名下的总cookie数量也有限制(20个)

## Session

- HttpSession

Session用来解决Cookie数量多传输浪费的问题

Session的本质就是将一个ID存储在Cookie里 当用户访问后端服务器 后端服务器根据这个ID查找其对应的数据

### 使用

- 获取HttpSession对象：

```java
HttpSession session = request.getSession();
```

- 使用HttpSession对象：

 ```java
 Object getAttribute(String name)  
 void setAttribute(String name, Object value)
 void removeAttribute(String name)
 ```

### 原理

> Session的实现是依赖于Cookie的。

如果基于Cookie的Session不可用 浏览器会自动将其重写到URL中

session如何工作：

![屏幕截图 2020-10-07 143107](/assets/屏幕截图%202020-10-07%20143107.png)

session持久化：SessionManager

其会复制持久化没有过期的session

session的过期检查：

Tomcat的一个后台线程会定期检查每个session是否失效

值得注意的是 request.getSession()也会检查是否过期 如果过期就会创建一个新的session出来

### 细节

- 持久化session

```java
Cookie c = new Cookie("JSESSIONID",session.getId());
c.setMaxAge(60*60);
response.addCookie(c);
```

- session序列化 _tomcat自动完成_
- 销毁时间

  - 服务器关闭
  - session对象调用invalidate()
  - session默认失效时间 30分钟

    ```xml
    <session-config>
        <session-timeout>30</session-timeout>
    </session-config>
    ```

### 特点

- session用于存储一次会话的多次请求的数据，存在服务器端
- session可以存储任意类型，任意大小的数据

### 分布式session

单独使用session或者cookie是无法满足需求的 一些分布式session架构将独立的服务器用来存储session 就可以达到session共享的目的

多端session：

- 只需要统一注册登录接口即可 前后端分离的时代这点已是常态
- 多终端登录的话在此基础上进行开发
