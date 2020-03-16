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

    dataType:"text"//设置接受到的响应数据的格式
});
```

- $.get
- $.post