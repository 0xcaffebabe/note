# webpack

webpack提供了模块化支持，代码压缩混淆，解决js兼容问题，性能优化等特性，提高了开发效率和项目的可维护性

![2020322114140](/assets/2020322114140.jpg)

## 全局安装

```shell
npm install webpack -g 
npm install webpack-cli -g 
```

## 使用

- 编写代码

```js
import $ from 'jquery'

$(function(){
    $('li:odd').css('backgroundColor','pink');
    $('li:even').css('backgroundColor','lightblue');
})
```

- 编写webpack.config.js

```js
module.exports = {
    mode:"development"//可以设置为development(开发模式)，production(发布模式)
}
```

- package.json增加一个脚本

```json
"scripts": {
    "dev":"webpack"
  }
```

- 执行`npm run dev`

### 自定义打包入口与出口

```js
const path = require("path");
module.exports = {
    mode:"development",
    //设置入口文件路径
    entry: path.join(__dirname,"./src/xx.js"),
    //设置出口文件
    output:{
        //设置路径
        path:path.join(__dirname,"./dist"),
        //设置文件名
        filename:"res.js"
    }
}
```

## 使用webpack-dev-server

- 安装

```shell
npm install webpack webpack-dev-server html-webpack-plugin --save-dev
```

- package.json

```json
{
  ...
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

## loader

通过loader打包非js模块：默认情况下，webpack只能打包js文件，如果想要打包非js文件，需要调用loader加载器才能打包

### css loader

```js
{
  ...
   module : {
        rules:[
            {
                //test设置需要匹配的文件类型，支持正则
                test:/\.css$/,
                //use表示该文件类型需要调用的loader
                use:['style-loader','css-loader']
            }
        ]
    }
}
```

- 可以直接在js中引入css

```js
import './style.less'
```

### babel loader

将高级js语法转为低级语法

- 安装

```js
npm install babel-loader @babel/core @babel/runtime -D
npm install @babel/preset-env @babel/plugin-transform-runtime @babel/plugin-proposal-class-properties -D
```

- babel.config.js

```js
module.exports = {
    presets:["@babel/preset-env"],
    plugins:[ "@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties" ]
}
```

- 添加

```js
{
    test:/\.js$/,
    use:"babel-loader",
    //exclude为排除项，意思是不要处理node_modules中的js文件
    exclude:/node_modules/
}
```

## 调试

```js
var add = function (x, y) {
    debugger
    return x+y+1;
}
```

## 打包发布

```json
"build":"webpack -p"
```