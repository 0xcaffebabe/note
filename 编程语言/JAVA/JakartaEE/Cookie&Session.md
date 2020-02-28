# Cookie与Session

## Cookie

> 客户端会话技术，将数据保存到客户端

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

### 作用

- cookie一般用于存出少量的不太敏感的数据
- 在不登录的情况下，完成服务器对客户端的身份识别

## Session

> 服务器端会话技术，在一次会话的多次请求间共享数据，将数据保存在服务器端的对象中。HttpSession

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

## Session与Cookie区别

比较类别 | Session | Cookie
---- | ------- | ------
存储方式 | 服务端     | 客户端
大小限制 | 无       | 有
安全   | 较安全     | 较不安全
