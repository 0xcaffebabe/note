# 小程序开发

## 什么软件适合做小程序

- 业务逻辑简单
- 使用频率低
- 性能要求低

## 开发者工具界面

- v1.02

![批注 2020-02-09 155239](/assets/批注%202020-02-09%20155239.png)

## 目录结构

- 主文件

文件       | 必填 | 作用
-------- | -- | --------
app.js   | 是  | 小程序逻辑
app.json | 是  | 小程序公共设置
app.wxss | 否  | 小程序公共样式表

- 页面文件组成

文件类型 | 必填 | 作用
---- | -- | -------------------------------------------------
js   | 是  | 页面逻辑 ( 微信小程序没有window和document对象 )
wxml | 是  | 页面结构 ( WeiXin Markup Language，不是HTML语法 )
wxss | 否  | 页面样式表 (WeiXin Style Sheets 拓展了rpx尺寸单位，微信专属响应式像素 )
json | 否  | 页面配置

## 分包

- 整个小程序所有分包大小不超过 8M
- 单个分包/主包大小不能超过 2M

## 移动设备的分辨率与rpx

rpx（responsive pixel）: 可以根据屏幕宽度进行自适应。规定屏幕宽为750rpx。如在 iPhone6 上，屏幕宽度为375px，共有750个物理像素，则750rpx = 375px = 750物理像素，1rpx = 0.5px = 1物理像素

## 配置

- 全局配置app.json控制整个程序的行为
- 页面配置page.json控制单个页面

## 组件

- swiper

## 页面注册

### 生命周期

![](https://res.wx.qq.com/wxdoc/dist/assets/img/page-lifecycle.2e646c86.png)

- 生命周期回调

```js
Page({
    // 启动页面后弹出消息
    onLoad: function () {
        wx.showToast({
        title: '鸡你太美',
        });
    }
})
```

## 视图

### 数据绑定

在小程序中，在js的data中定义变量

```js
Page({

  // ..
  data: {
    msg: 'msg'
  }
  //...
```

可以在WXML中进行绑定，跟VUE一样，但是需要注意的是，这种绑定是单向绑定

{% raw %}

```html
<view>{{message}}</view>
```

需要使用setData来设置或者更新数据

```js
this.setData({msg:'abc'});
```

更复杂的用法

```html
<!-- 绑定属性（需要在双引号内） -->
<view id="item-{{id}}"> </view>
<!-- 运算 -->
<view hidden="{{flag ? true : false}}"> Hidden </view>
```

- 条件渲染

```html
<view wx:if="{{condition}}"> True </view>
```

```html
<view wx:if="{{view == 'WEBVIEW'}}">WEBVIEW</view>
<view wx:elif="{{view == 'APP'}}">APP</view> 
<view wx:else="{{view == 'MINA'}}">MINA</view>
```

- 列表渲染

```html
<view wx:for="{{array}}">{{item}}</view>
```

### 事件

在WXML中绑定事件

```htm
<view class="moto-container" bind:tap="onTap">
</view>
```



```js
Page({
  onTap(){
    console.log('hello')
  }
})
```

#### bind与catch

bind是冒泡，事件会往上传递

catch会阻止事件向上冒泡

## 模块化

- 模块导出

```javascript
function method1(){
  console.log("123");
}
module.exports.method1 = method1;
```

- 模块使用

```javascript
const common = require('common.js')
```

### 模板template

- 定义模板

```html
<template name="staffName"> 
    <view>FirstName: {{firstName}}, LastName: {{lastName}}</view> 
</template> 
```

- 引入模板

```html
<import src="item.wxml" />
```

- 使用模板

```html
<!--           模板名           传入的对象  -->
<template is="staffName" data="{{staffA}}"></template>
```

{% endraw %}

## 页面间参数传递

- 页面跳转

```js
wx.navigateTo({
    url: './post-detail/post-detail?id='+id,
})
```

```js
  onLoad: function (options) {
    // 这里可以拿到url的参数
    console.log(options.id);
  },
```

## 缓存

```js
// 设置缓存
wx.setStorage({
     key: '',
     data: '',
})
// 获取缓存
wx.getStorage({
      key: ,
      success: function(res) {},
    })
```

## 全局变量

- 在app.js中定义

```js
App({
  globalData: {
    flag:false
  }
  //...
}
```

- 使用

```js
var app =getApp();
app.globalData.flag= true;
```

## 路由

- 三种路由方式

```js
navigateTo
redirectTo
switchTab
```

## 组件

### 视图组件

- view

> 类似div

### 基础组件

- icon

```html
<icon type="success"></icon>
<icon type="search"></icon>
```

- text

```html
<text>一段文本</text>
```

- progress

### 表单组件

- button

```html
<button size='default'>默认尺寸按钮</button>
```

- form
- image
- switch
- slider
- checkbox

## 场景值

- 代表是怎么来的

## 视图层

### WXML

import 的依赖无法传递

- 嵌入

```html
<include src="header.wxml" />
```

### WXSS

- 单位

rpx（responsive pixel）: 可以根据屏幕宽度进行自适应

- 样式导入

```css
@import "common.wxss";
```

- 内联样式
  - style与class
  
- 选择器
  - .class
  - #id
  - element
  - element,element
  - ::after
  - ::before

- 全局样式与局部样式
  - app.wxss 是全局样式，定义在page目录下的是局部样式