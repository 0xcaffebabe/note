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

### gulp

```shell
npm install gulp
npm install gulp-cli -g
```

```js
// 执行 gulp first
const gulp = require('gulp');

gulp.task('first', () => {
    return gulp.src('./src/index.html')
        .pipe(gulp.dest('./dist'))
})
```

#### 插件

- 使用

```js
// 压缩html
const htmlmin = require('gulp-htmlmin')

gulp.task('htmlmin', () => {
    return gulp.src('./src/*.html')
        .pipe(htmlmin({collapseWhitespace:true}))
        .pipe(gulp.dest('./dist'))
})
```

## package.json

项目描述文件,记录了当前项目信息，例如项目名称、版本、作者、github地址、 当前项目依赖了哪些第三方模块等。

使用`npm init -y`命令生成。

- dependencies
- devDependencies
- package-lock.json
  - 锁定包的版本
  - 记录了包以及依赖的下载地址

### script

```json
"scripts": {
   "test": "echo \"Error: no test specified\" && exit 1",
   "build":"nodemon a.js"
 }
```

```shell
npm run build
```

## 模块加载机制

```js
// 如果模块后缀省略,先找同名JS文件再找同名JS文件夹
// 如果找到了同名文件夹，找文件夹中的index.js
// 如果文件夹中没有index.js就会去当前文件夹中的package.js文件中查找main选项中的入口文件
// 如果再找不到就抛出异常
require('./xx')

// Node.js会假设它是 系统模块
// Node.js会去node_ modules文件夹中
// 首先看是否有该名字的JS文件
// 再看是否有该名字的文件夹
// 如果是文件夹看里面是否有index.js
// 如果没有index.js查看 该文件夹中的package.json中的main选项确定模块入口文件
// 否则找不到报错
require('xx')
```

## web服务器

### 创建

```js
var http = require('http')
http.createServer((request,response)=>{
  const body = "hello world";
  response.writeHead(200,{
  'Content-Length':Buffer.byteLength(body),
  'Content-Type':'text/plain'
  });
  response.end(body);
}).listen(8888);
```

### 请求报文

```js
const body = `request method:${request.method}
              request url:${request.url}
              request headers ua:${request.headers["user-agent"]}
`
```

### 响应报文

```js
response.writeHead(200,{
    'Content-Type':'application/json'
})
response.end('{"result":"25"}')
```

### 请求参数

- get

```js
const url = require('url')

let { query } = url.parse(request.url, true)
// 输出name参数与age参数
response.end(query.name + "," + query.age)
```

- post

```js
let postData = ''
request.on('data',params=>{
    postData += params
})
request.on('end',()=>{
    let i = querystring.parse(postData)
    response.end(`name: ${i.name} address: ${i.address}`)
})
```

### 路由

```js
let { pathname } = url.parse(req.url);
if (pathname == '/' || pathname == '/index') {
  response.end('欢迎来到首页');
} else if (pathname == '/list') {
  response.end('欢迎来到列表页页');
} else {
  response.end('抱歉, 您访问的页面出游了');
}
```

### 静态资源

```js
fs.readFile(__dirname+'/static'+pathname,(error,data)=>{
    if (!error){
        let type = pathname.substring(pathname.lastIndexOf('.')+1)
        response.writeHead(200,{
            "Content-Type":mime.getType(pathname)
        })
        response.end(data)
    }else{
        response.writeHead(404,{
            "Content-Type":"text/html;charset=utf8"
        })
        response.end('404 NOT FOUND')
    }
})
```
