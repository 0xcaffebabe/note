# art-template

## 使用

```js
const template = require('art-template')
const view = path.join(__dirname,'views','index.art')
let ret = template(view,{
    name:'cxk',
    age:18
})
```

```html
<!-- index.art -->
<body>
    姓名:{{name}}
    年龄:{{age}}
</body>
```

## 模板语法

标准语法： {{ 数据 }}
原始语法：<%=数据  %>

### 输出

```html
<!-- 标准语法 -->
<h2>{{value}}</h2>
<h2>{{a ? b : c}}</h2>
<h2>{{a + b}}</h2>

<!-- 原始语法 -->
<h2><%= value %></h2>
<h2><%= a ? b : c %></h2>
<h2><%= a + b %></h2>
```

### 原文输出

```html
 <!-- 标准语法 -->
 <h2>{{@ value }}</h2>
 <!-- 原始语法 -->
 <h2><%- value %></h2>
```

### 条件

```html
<!-- 标准 -->
{{if age==18}}
    <span>沉鱼落雁</span>
{{else if age == 20}}
    <span>闭月羞花</span>
{{/if}}

<!-- 原始 -->
<%if (age==18) {%>
    <span>沉鱼落雁</span>
<% } else if( age==20 ) {%>
    <span>闭月羞花</span>
<% } %>
```

### 循环

```js
let ret = template(view,{
    name:'<h1>cxk</h1>',
    age:20,
    skills:['唱','跳','rap','篮球']
})
```

```html
<!-- 标准 -->
{{each skills}}
    <div><span>技能{{$index}}:</span>{{$value}}</div>
{{/each}}

<!-- 原始 -->
<% for (var i =0;i<skills.length;i++){ %>
     <div><span>技能<%=i%>:</span><%=skills[i]%></div>
<% }%>
```

### 子模板

```html
<!-- 标准 -->
{{include './header.art'}}
<!-- 原始 -->
<%-include('./header.art')%>
```

### 模板继承

```html
 <!doctype html>
 <html>
     <head>
         <meta charset="utf-8">
         <title>HTML骨架模板</title>
         {{block 'head'}}{{/block}}
     </head>
     <body>
         {{block 'content'}}{{/block}}
     </body>
 </html>
```

其他模板可以继承这个模板，填充占位符里的内容

```html
{{extend './layout.art'}}
{{block 'head'}} <link rel="stylesheet" href="./style.css"/> {{/block}}
{{block 'content'}} <div>test</div> {{/block}}
```

渲染结果

```html
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>HTML骨架模板</title>
         <link rel="stylesheet" href="./style.css"/>
    </head>
    <body>
         <div>test</div>
    </body>
</html>
```

### 模板配置

- 导入变量

```js
template.defaults.imports.random = ()=>{
    return Math.random()
}
```
```html
{{random()}}
```

- 设置模板根目录 template.defaults.root = 模板目录
- 设置模板默认后缀 template.defaults.extname = '.art'
