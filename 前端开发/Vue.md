# 插值表达式

```javascript
{{ number + 1 }}
{{ ok ? 'YES' : 'NO' }}
```

# 常用系统指令

## v-on事件绑定

- v-on:click

```html
<button v-on:click="fun('这是使用vue绑定的点击事件')">vue的onclick</button>
```

```javascript
new Vue({
            el:"#app",
            data:{
                message:"hello world"//model
            },
            methods:{
                fun:function(msg){
                    //alert(msg);
                    this.message = msg;
                }
            }
        });
```

- v-on:keydown

```html
<input type="text" v-on:keydown="fun($event)">
```

- v-on:mouseover

```html
<div @mouseover="fun1" id="div">
                <textarea @mouseover="fun2($event)">这是一个文件域</textarea>
            </div>
```

`@mouseover == v-on:mouseover`

- 事件修饰符

```html
<!-- 阻止单击事件继续传播 -->
<a v-on:click.stop="doThis"></a>

<!-- 提交事件不再重载页面 -->
<form v-on:submit.prevent="onSubmit"></form>

<!-- 修饰符可以串联 -->
<a v-on:click.stop.prevent="doThat"></a>

<!-- 只有修饰符 -->
<form v-on:submit.prevent></form>

<!-- 添加事件监听器时使用事件捕获模式 -->
<!-- 即元素自身触发的事件先在此处理，然后才交由内部元素进行处理 -->
<div v-on:click.capture="doThis">...</div>

<!-- 只当在 event.target 是当前元素自身时触发处理函数 -->
<!-- 即事件不是从内部元素触发的 -->
<div v-on:click.self="doThat">...</div>
```

- 按键修饰符

`.enter` `.tab` `.delete` ( "删除" 和 "退格" ) `.esc` `.space` `.up` `.down` `.left` `.right` `.ctrl` `.alt` `.shift` `.meta`

## 数据渲染

```html
<div v-text="message"></div><!--会进行HTML转义-->
<div v-html="message"></div>
<!-- 完整语法 -->
<a v-bind:href="url">...</a>
<!-- 缩写 -->
<a :href="url">...</a>
```

## 输入绑定

```html
<input type="text" v-model="user.password"><br/>
```

## 列表渲染

```html
<li v-for="(value,index) in arr">{{value}} and {{index}}</li>
```

## 条件渲染

```html
<span v-if="flag">传智播客</span>
<span v-show="flag">itcast</span>
```

# 生命周期

![](https://cn.vuejs.org/images/lifecycle.png)

# AJAX

- axios

```javascript
var that = this;
            axios.get("/user/list")
                .then(function (r) {
                    that.userList = r.data;
                })
                .catch(function(error){
                    console.error(error);
                })
```

```js
            var that = this;
            axios.post("/user/"+this.user.id,this.user)
                .then(function (res) {
                    alert(res.data);
                    that.findAll();

                })
                .catch(function (reason) {
                    console.error(reason);
                })
```

