**异步和同步**

# 原生方式

```js
let xhr = new XMLHttpRequest();
  xhr.open("get","/web3_war_exploded");
  xhr.send();
  xhr.onreadystatechange = function () {
      if (xhr.status === 200){
          console.log(xhr.responseText);
      }
  }
```

# JQuery实现方式

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



