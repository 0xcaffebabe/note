# BOM

BOM（Browser Object Model）即浏览器对象模型，它提供了独立于内容而与浏览器窗口进行交互的对象，其核心对象是 window

## 组成

- window
  - document
  - location
  - navigation
  - screen
  - history

## window

### 事件

`window.onload` 是窗口 (页面）加载事件，**当文档内容完全加载完成**会触发该事件(包括图像、脚本文件、CSS 文件等), 就调用的处理函数

`window.onresize` 是调整窗口大小加载事件,  当触发时就调用的处理函数.经常利用这个事件完成响应式布局。 `window.innerWidth` 当前屏幕的宽度

### 定时器

- setTimeout() 在指定的毫秒数后调用函数或计算表达式。
- clearTimeout() 取消由 setTimeout() 方法设置的 timeout。
- setInterval() 按照指定的周期（以毫秒计）来调用函数或计算表达式。
- clearInterval() 取消由 setInterval() 设置的 timeout。

