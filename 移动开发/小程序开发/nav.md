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
