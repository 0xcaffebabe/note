# 特点

- 基于TCP/IP的高级协议
- 默认端口号:80
- 基于请求/响应模型的:一次请求对应一次响应
- 无状态的：每次请求之间相互独立，不能交互数据

# 请求行

```
请求方式 请求url 请求协议/版本
```

# 请求头

```
请求头名称: 请求头值
```

# 请求空行

# 请求体

# 格式

```
POST /login.html    HTTP/1.1
  Host: localhost
  User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko20100101 Firefox/60.0
  Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
  Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,enq=0.2
  Accept-Encoding: gzip, deflate
  Referer: http://localhost/login.html
  Connection: keep-alive
  Upgrade-Insecure-Requests: 1

  username=zhangsan
```

# 响应行

```
协议/版本 响应状态码 状态码描述
```

## 状态码

分类  | 分类描述
--- | -----------------------
1** | 信息，服务器收到请求，需要请求者继续执行操作
2** | 成功，操作被成功接收并处理
3** | 重定向，需要进一步的操作以完成请求
4** | 客户端错误，请求包含语法错误或无法完成请求
5** | 服务器错误，服务器在处理请求的过程中发生了错误

# 响应头

```
头名称： 值
```

```
HTTP/1.1 200 OK
            Content-Type: text/html;charset=UTF-8
            Content-Length: 101
            Date: Wed, 06 Jun 2018 07:08:42 GMT

            <html>
              <head>
                <title>$Title$</title>
              </head>
              <body>
              hello , response
              </body>
            </html>
```


