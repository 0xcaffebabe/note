# AJAX

- 传统网站的弊端

## 应用场景

- 动态数据加载
- 表单验证

## 实现

### 原生方式

```js
let xhr = new XMLHttpRequest();
// 发送get请求 通过url传递参数
xhr.open('get',"/home");
xhr.send();
xhr.onload = function(){
    console.log(xhr.responseText);
}
```

- post

```js
xhr.open('post',"/home");
xhr.setRequestHeader('Content-Type',"application/json");
xhr.send('{"name":"jntm"}');
```

#### ajax状态码

- 0：请求未初始化(还没有调用open())
- 1：请求已经建立，但是还没有发送(还没有调用send())
- 2：请求已经发送
- 3：请求正在处理中，通常响应中已经有部分数据可以用了
- 4：响应已经完成，可以获取并使用服务器的响应了

```js
xhr.onreadystatechange = function(){
    console.log(xhr.readyState);
}
```

区别描述          | onload事件 | onreadystatechange事件
------------- | -------- | --------------------
是否兼容IE低版本     | 不兼容      | 兼容
是否需要判断Ajax状态码 | 不需要      | 需要
被调用次数         | 一次       | 多次

#### 错误处理

- 后端能调通，但是返回错误

```js
xhr.status
```

- 网络中断，后端无法调通

会触发xhr对象下面的onerror事件，在onerror事件处理函数中对错误进行处理

- 低版本ie存在ajax缓存问题

#### ajax封装

```js
function ajax(req) {
    let xhr = new XMLHttpRequest();
    let params = "";
    for (let attr in req.data) {
        params += attr + "=" + req.data[attr] + "&";
    }
    params = params.substr(0, params.length - 1);
    xhr.open(req.type, req.type != 'get' ? req.url:req.url + "?" + params);

    for(let attr in req.headers){
        xhr.setRequestHeader(attr,req.headers[attr]);
    }

    if (req.type == 'get'){
        xhr.send();
    }else{
        if (req.headers['Content-Type']=='application/json'){
            xhr.send(JSON.stringify(req.data));
        }else{
            xhr.send(params);
        }
    }
    xhr.onload = function () {
        let contentType = xhr.getResponseHeader("Content-Type");
        let responseText = xhr.responseText;

        if (contentType.includes("application/json")){
            responseText = JSON.parse(responseText);
        }
        if (xhr.status === 200) {
            req.success && req.success(responseText);
        } else {
            req.error && req.error(responseText);
        }
    };
}

ajax({
    url: '/home',
    type: 'get',
    data: {name: "cxk", age: 18},
    headers:{
        "Content-Type":"application/json"
    },
    success: function (res) {
        console.log('normal res', res);
    },
    error: function (res) {
        console.error('error res', res);
    }
})
```

### JQuery实现方式

- ajax

```js
$.ajax({
    url:"./" , // 请求路径
    type:"POST" , //请求方式
    //data: "username=jack&age=23",//请求参数
    data:{"username":"jack","age":23},
    success:function (data) {
        alert(data);
    },//响应成功后的回调函数
    error:function () {
        alert("出错啦...")
    },//表示如果请求响应出现错误，会执行的回调函数
});
```

发送jsonp请求

```js
$.ajax({
    url: 'http://www.example.com',
    // 指定当前发送jsonp请求
    dataType: 'jsonp',
    // 修改callback参数名称
    jsonp: 'cb',
    // 指定函数名称
    jsonCallback: 'fnName',
    success: function (response) {} 
})
```

- $.get
- $.post
- serialize

```js
$("#form").serialize(); // 将表单输入的内容转换成如k=v&a=b这种形式
```

#### 全局事件

```js
.ajaxStart()     // 当请求开始发送时触发
.ajaxComplete()  // 当请求完成时触发
```

配合nprogress来实现页面加载进度条

## FormData

- 表单上传
- 二进制文件上传

### 简单使用

```html
<form id="form">
    <input type="text" name="username"/>
    <input type="password" name="password"/>
    <input type="file" name="file">
    <input type="button" id="btn"/>
</form>
```

```js
let form = document.querySelector("#form");
let formData = new FormData(form);
let xhr = new XMLHttpRequest();
xhr.open('post','/formData');
xhr.send(formData);
```

### 实例方法

```js
// 获取表单对象属性
formData.get('username');
// 设置表单对象属性
formData.set("username","cxk");
// 删除表单对象属性
formData.delete("username");
// 追加表单对象属性,属性名已存在的情况下,set会覆盖,append会保留
formData.append("username","cxk");
```

### 文件上传进度展示

```js
xhr.upload.onprogress = function (ev) {
    console.log(ev.loaded / ev.total)
}
```

### 图片上传实时预览

```java
var file = document.querySelector('#file');
file.onchange = function(){
    var reader = new FileReader();
    reader.readAsDataURL(this.files[0]);
    reader.onload = function(){
        document.querySelector('.img-thumbnail').src = reader.result;
    }
}
```

### 使用Promise发送ajax

```js
function query() {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) {
                return;
            }
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.responseText);
            } else {
                reject(xhr.status);
            }
        };
        xhr.open('get', '/home');
        xhr.send();
    });
}

query().then(r => console.log(r)).catch(r => console.error(r))
```

## fetch

Fetch API是新的ajax解决方案

**fetch不是ajax的进一步封装，而是原生js，没有使用XMLHttpRequest对象**

```js
fetch('/home').then(data=>{
    return data.text();
})
.then(data=>{
    console.log(data);
});
```

data是一个response对象，其中包括返回的一堆原始字节，这些字节需要在收到后，需要我们通过调用方法将其转换为相应格式的数据，比如`JSON`，`BLOB`或者`TEXT`等等

- 传递参数

```js
let formData = new FormData();
formData.append('username','cxk');
formData.append('password','jntm');
fetch('/formData',{
    method:'post',
    body:formData
})
```

## axios

```js
axios.get('/home')
    .then(res=>{
        console.log(res);
    })
```
```js
let formData = new FormData();
formData.append('username','cxk');
formData.append('password','jntm');
// 默认传递的是json
axios.post('/formData',formData)
 .then(res=>{
     console.log(res);
 })
```

- 同步调用

```js
async function f(){
    let res =  await axios.post('/formData',formData);
    console.log(res);
}
```

### 全局参数

```js
// 配置公共的请求头 
axios.defaults.baseURL = 'https://api.example.com';
// 配置 超时时间
axios.defaults.timeout = 2500;
// 配置公共的请求头
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// 配置公共的 post 的 Content-Type
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

### 拦截器

```js
// 请求拦截器
axios.interceptors.request.use(function(config) {
    console.log(config.url)
    // 这里一定要return   否则配置不成功
    return config;
}, function(err){
    // 对请求错误做点什么
    console.log(err)
})
// 响应拦截器
axios.interceptors.response.use(function(res) {
    console.log(res.data);
    return res.data;
}, function(err){
    console.log(err)
});
```

## 同源策略

ajax受同源策略限制

### JSONP

原理：

客户端定义一个函数：

```js
function fn (data) { // 接收到服务器data后的一些处理 }
```

服务端返回一个函数调用：

```js
const data = 'fn({name: "张三", age: "20"})';
```

客户端使用script可以跨域加载数据

```html
<script src="server_ajax_address"></script>
```

这样客户端就可以获取服务端的数据

```js
function fn(data){
    console.log('server res',data);
}
let script = document.createElement('script');
script.src = '/jsonp?v=1';
document.body.appendChild(script);
```

```java
@GetMapping("/jsonp")
public String jsonp(){
    return "fn({name:'cxk',age:18})";
}
```

#### 优化

- 回调函数名称参数化
- 回调函数参数化
  - 注意回调函数覆盖问题
- url参数化 
- 接收到回调后删除script标签

### CORS

全称为 Cross-origin resource sharing，即跨域资源共享，它允许浏览器向跨域服务器发送 Ajax 请求，克服了 Ajax 只能同源使用的限制

通过设置`Access-Control-Allow-Origin`和`Access-Control-Allow-Methods`响应头来允许哪些源可以使用哪些方法访问

```java
@RestController
@CrossOrigin("*")
public class Controller {...}
```

withCredentials：指定在涉及到跨域请求时，是否携带cookie信息，默认值为false

### 使用后端服务器辅助访问