# Cookie

Cookie 是服务器发送到用户浏览器并保存在本地的一小块数据，它会在浏览器之后向同一服务器再次发起请求时被携带上，用于告知服务端两个请求是否来自同一客户端

用途：

- 会话状态管理
- 个性化设置
- 浏览器行为跟踪

## 创建过程

服务的响应头Set-Cookie头部：

```html
Set-Cookie: yummy_cookie=choco
Set-Cookie: tasty_cookie=strawberry
```

客户端之后对同一服务器发送请求时，都会在请求头Cookie头部带上这个Cookie

```html
Cookie: yummy_cookie=choco; tasty_cookie=strawberry
```

## 分类

- 会话期Cookie：浏览器关闭之后它会被自动删除，没有指定过期时间就是会话期Cookie
- 持久性 Cookie：指定过期时间（Expires）或有效期（max-age）之后就成为了持久性的 Cookie

```html
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2020 07:28:00 GMT;
```

## 作用域

Domain 标识Cookie在哪些域名下有效，如果不指定，默认是当前文档的主机

如果指定了Domain，则一般包括子域名，如baidu.com，包含map.baidu.com

## JS访问

JavaScript可以通过document.cookie来创建cookie或者访问非HttpOnly的Cookie

## HttpOnly

标记为 HttpOnly 的 Cookie 不能被 JavaScript 脚本调用

```html
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2020 07:28:00 GMT; Secure; HttpOnly
```

## Secure

标记为 Secure 的 Cookie 只能通过被 HTTPS 协议加密过的请求发送给服务端

## Session

Session是通过在服务端生成一个key，使用这个key为索引在服务器端存放用户信息，后将这个key作为cookie返回给客户端，让客户端使用这个key来操作

应该注意 Session ID 的安全性问题，不能让它被恶意攻击者轻易获取，那么就不能产生一个容易被猜到的 Session ID 值。此外，还需要经常重新生成 Session ID。在对安全性要求极高的场景下，还需要使用二重验证的方式

### Cookie与Session

比较类别 | Session | Cookie
---- | ------- | ------
存储方式 | 服务端     | 客户端
大小限制 | 无       | 有
安全   | 较安全     | 较不安全

- cookie一般用于存出少量的不太敏感的数据，在不登录的情况下，完成服务器对客户端的身份识别

## cookie 压缩

gzip只能对body进行压缩 cookie位于头上 需要手动编程对http header 进行处理

## 浏览器禁用cookie

当浏览器无法使用Cookie，只能使用session，此外，session id也不能通过cookie来传递，而是需要通过URL传参的方式来传递，如wap时代的sid

## 注意事项

- Cookie的Name不能和属性值一样 比如Doamin MaxAge等待
- Name和Value不能设置成非ASCII字符
- 不同的浏览器都会对Cookie的大小以及数量进行限制 需要注意
