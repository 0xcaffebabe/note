# Express

Express是一个基于Node平台的web应用开发框架，它提供了一系列的强大特性，帮助你创建各种Web应用

## 特性

- 提供了方便简洁的路由定义方式
- 对获取HTTP请求参数进行了简化处理
- 对模板引擎支持程度高，方便渲染动态HTML页面
- 提供了中间件机制有效控制HTTP请求
- 拥有大量第三方中间件对功能进行扩展

## 开始

```js
const express = require('express')
const app = express()

app.listen(80)
app.get('/',(req,res)=>{
    // 自动设置响应内容类型
    res.send({name:'cxk',age:18}) 
})
```

## 中间件

### next

使用next继续传递请求

```js
app.get('/',(req,res,next)=>{
    req.name = 'cxk'
    next()
})
app.get('/',(req,res)=>{
    res.send({name:req.name,age:18}) 
})
```

### use

使用use接收任何类型方法的请求

```js
app.use('/any',(req,res,next)=>{
    res.end('ok')
})
```

可以用作过滤器

404处理:

```js
app.use((req,res,next)=>{
    res.status(404).send('not found')
})
```

错误处理：

```js
app.use('/any',(req,res,next)=>{
    throw Error('RuntimeException')
})
app.use((error,req,res,next)=>{
    res.status(500).send("SERVER INTERNAL ERROR:"+error)
})
```

当发生错误的中间件是异步函数是，需要手动捕捉错误，调用next

```js
app.use('/any',async (req,res,next)=>{
    try{
        throw Error('RuntimeException')
    }catch(e){
        next(e)
    }
})
```

## 模块化路由

```js
const home = express.Router()
const admin = express.Router()

app.use('/home',home)
app.use('/admin',admin)

home.get('/index',(req,res)=>{
    res.send('前台首页')
})
admin.get('/index',(req,res)=>{
    res.send('后台首页')
})
```

## 参数获取

- get请求

```js
req.query
```

- post请求

```js
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:false}))
app.post('/',(req,res)=>{
    res.send(req.body)
})
```

- 路由参数

请求:http://localhost/1

```js
app.get('/:id',(req,res)=>{
    res.send(req.params) // {id:1}
})
```

## 静态资源处理

```js
app.use(express.static('static'))
```

## 整合art-template

```js
// app.use(express.static('static'))
// 当渲染后缀为art的模板时，使用express-art-template
app.engine('art',require('express-art-template'))
// 设置模板目录
app.set('views',path.join(__dirname,'views'))
// 设置模板后缀
app.set('view engine','art')
app.get('/',(req,res)=>{
    // 渲染模板
    res.render('index',{
        content:'jntm'
    })
})
```

- 模板公共数据

```js
app.locals.common = {
    name: 'site'
}
```