- 运行js文件

```shell
node xxx
```

# 模块导出与使用

```js
exports.add=function(a,b){
    return a+b;
}
```

```js
var demo = require('./module');
demo.add(1,2);
```

# 创建web服务器

```js
var http = require('http')
http.createServer(function(request,response){
  const body = "hello world";
  response.writeHead(200,{
  'Content-Length':Buffer.byteLength(body),
  'Content-Type':'text/plain'
  });
  response.end(body);
}).listen(8888);
```

- 获取请求参数

```js
request.url
```


