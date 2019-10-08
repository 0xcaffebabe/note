![](https://pic2.zhimg.com/v2-d4b5a3feff3c7168c718dc00d4c40e73_r.jpg)

# 全局安装

```shell
npm install webpack@3.6.0 -g
```

# 使用

- 模块导出

```js
let tip = function () {
    alert("hello,world");
};

module.exports.tip=tip;
```

- 模块引入

```js
let {tip} = require("./model1");

tip();
```

- 打包

```shell
webpack main.js build.js
```

# 使用webpack-dev-server

- 安装

```shell
cnpm install webpack@3.6.0 webpack-dev-server@2.9.1 html-webpack-plugin@2.30.1 --save-dev
```

- 配置

```json
{
  "devDependencies": {
    "html-webpack-plugin": "^2.30.1",
    "webpack": "^3.6.0",
    "webpack-dev-server": "^2.9.1"
  },
  "scripts": {
    "dev":"webpack-dev-server --inline --hot --open --port 5008"
  }
}

```

- 配置webpack.config.js

```js
//引用html-webpack-plugin插件，作用是根据html模板在内存生成html文件，它的工作原理是根据模板文件在内存中生成一个index.html文件。
var htmlwp = require('html-webpack-plugin');
module.exports={
    entry:'./src/main.js',  //指定打包的入口文件
    output:{
        path : __dirname+'/dist',  // 注意：__dirname表示webpack.config.js所在目录的绝对路径
        filename:'build.js'		   //输出文件
    },
    devtool: 'eval-source-map',
    plugins:[
        new htmlwp({
            title: '首页',  //生成的页面标题<head><title>首页</title></head>
            filename: 'index.html', //webpack-dev-server在内存中生成的文件名称，自动将build注入到这个页面底部，才能实现自动刷新功能
            template: 'vue_02.html' //根据vue_02.html这个模板来生成(这个文件请程序员自己生成)
        })
    ]
}
```

- 运行

```shell
npm run dev
```

- 调试

```js
var add = function (x, y) {
    debugger
    return x+y+1;
}
```


