# node

## 组成

- ECMAScript
- Node模块API

## 运行js文件

```shell
node xxx
```

## 模块化开发

Node.js规定一个JavaScript文件就是一个模块，模块内部定义的变量和函数默认情况下在外部无法得到
模块内部可以使用exports对象进行成员导出， 使用require方法导入其他模块

### js开发弊端

- 文件依赖
- 命名冲突

### 模块导出

```js
// module.js
exports.add= (a,b) => a+b

// 另外一种导出方式
module.exports.add =  (a,b) => a+b;

// exports是module.exports的别名(地址引用关系)，当它们指向的部署同一个对象时，导出对象最终以module.exports为准
```

### 模块导入

```js
// other.js
let demo = require('./module');
demo.add(1,2);
```

## 系统模块

### fs

```js
const fs = require('fs')

// 读取文件
fs.readFile('./index.html',(err,doc)=>{
    if (!err){
        console.log(doc.toString())
    }
})
// 文件写入
fs.writeFile('test.txt','run it',error => {
    console.log(error);
})
```

### path

```js
const path = require('path')

// 拼接路径
console.log(path.join(__dirname,'TMP','MY')) // windows: C:\Users\MY\TMP\web\TMP\MY
// 大多数情况下使用绝对路径，因为相对路径有时候相对的是命令行工具的当前工作目录
```

## 第三方模块

<http://npmjs.com>

```shell
npm install xx # 安装模块（本地安装）
npm uninstall xx # 卸载模块
npm install xx -g # 全局安装
```

### nodemon

能监控文件的变化，变化时自动运行它

```shell
npm install nodemon -g # 安装
nodemon test # 使用nodemon代替node执行js文件，当js文件发生变更后，会自动重新运行js文件
```

### nrm

npm下载地址切换工具

```shell
nrm ls # 列出可用源
nrm use xx # 使用某个源
```

## 创建web服务器

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


