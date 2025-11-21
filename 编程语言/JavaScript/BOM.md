# BOM

BOM（Browser Object Model）即浏览器对象模型，它提供了独立于内容而与浏览器窗口进行交互的对象，其核心对象是 window

## 组成

- window

  - document
  - location
  - navigator
  - screen
  - history

## window

### 事件

`window.onload` 是窗口 (页面）加载事件，**当文档内容完全加载完成**会触发该事件(包括图像、脚本文件、CSS 文件等), 就调用的处理函数

`window.onresize` 是调整窗口大小加载事件, 当触发时就调用的处理函数.经常利用这个事件完成响应式布局。 `window.innerWidth` 当前屏幕的宽度

### 定时器

- setTimeout() 在指定的毫秒数后调用函数或计算表达式。
- clearTimeout() 取消由 setTimeout() 方法设置的 timeout。
- setInterval() 按照指定的周期（以毫秒计）来调用函数或计算表达式。
- clearInterval() 取消由 setInterval() 设置的 timeout。

### this指向问题

1. 全局作用域或者普通函数中this指向全局对象window（注意定时器里面的this指向window）
2. 方法调用中谁调用this指向谁
3. 构造函数中this指向构造函数的实例

## location

### 属性

属性       | 描述
-------- | ---------------------------
hash     | 设置或返回从井号 (#) 开始的 URL（锚）。
host     | 设置或返回主机名和当前 URL 的端口号。
hostname | 设置或返回当前 URL 的主机名。
href     | 设置或返回完整的 URL。
pathname | 设置或返回当前 URL 的路径部分。
port     | 设置或返回当前 URL 的端口号。
protocol | 设置或返回当前 URL 的协议。
search   | 设置或返回从问号 (?) 开始的 URL（查询部分）。

### 方法

属性        | 描述
--------- | --------------------------
assign()  | 加载新的文档。
reload()  | 重新加载当前文档。
replace() | 用新的文档替换当前文档（不在历史记录中，无法后退）。

## navigator

### 属性

属性              | 描述
--------------- | -----------------------------
appCodeName     | 返回浏览器的代码名。
appMinorVersion | 返回浏览器的次级版本。
appName         | 返回浏览器的名称。
appVersion      | 返回浏览器的平台和版本信息。
browserLanguage | 返回当前浏览器的语言。
cookieEnabled   | 返回指明浏览器中是否启用 cookie 的布尔值。
cpuClass        | 返回浏览器系统的 CPU 等级。
onLine          | 返回指明系统是否处于脱机模式的布尔值。
platform        | 返回运行浏览器的操作系统平台。
systemLanguage  | 返回 OS 使用的默认语言。
userAgent       | 返回由客户机发送服务器的 user-agent 头部的值。
userLanguage    | 返回 OS 的自然语言设置。

## history

属性     | 描述
------ | -------------------
length | 返回浏览器历史列表中的 URL 数量。

方法        | 描述
--------- | -----------------------
back()    | 加载 history 列表中的前一个 URL。
forward() | 加载 history 列表中的下一个 URL。
go()      | 加载 history 列表中的某个具体页面。

## screen

属性                   | 描述
-------------------- | ----------------------------
availHeight          | 返回显示屏幕的高度 (除 Windows 任务栏之外)。
availWidth           | 返回显示屏幕的宽度 (除 Windows 任务栏之外)。
bufferDepth          | 设置或返回调色板的比特深度。
colorDepth           | 返回目标设备或缓冲器上的调色板的比特深度。
deviceXDPI           | 返回显示屏幕的每英寸水平点数。
deviceYDPI           | 返回显示屏幕的每英寸垂直点数。
fontSmoothingEnabled | 返回用户是否在显示控制面板中启用了字体平滑。
height               | 返回显示屏幕的高度。
logicalXDPI          | 返回显示屏幕每英寸的水平方向的常规点数。
logicalYDPI          | 返回显示屏幕每英寸的垂直方向的常规点数。
pixelDepth           | 返回显示屏幕的颜色分辨率（比特每像素）。
updateInterval       | 设置或返回屏幕的刷新率。
width                | 返回显示器屏幕的宽度。

## JS执行机制

- JS是单线程

单线程导致的问题就是后面的任务等待前面任务完成，如果前面任务很耗时，后面任务不得不一直等待，为了解决这个问题，利用多核 CPU 的计算能力，HTML5 提出 Web Worker 标准，允许 JavaScript 脚本创建多个线程，但是子线程完全受主线程控制。于是，JS 中出现了**同步任务**和**异步任务**

![202001271945](/assets/202001271945.png)

JS执行机制（事件循环）

![202001271947](/assets/202001271947.png)

由于主线程不断的重复获得任务、执行任务、再获取任务、再执行，所以这种机制被称为**事件循环(event loop)**
