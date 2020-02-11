# DOM

> DOM是W3C组织制定的一套处理 html和xml文档的规范

## DOM树

![202001232031](/assets/202001232031.png)

- 核心DOM

  - Document：文档对象
  - Element：元素对象
  - Attribute：属性对象
  - Text：文本对象
  - Comment:注释对象
  - Node：节点对象，其他5个的父对象

- XML DOM

- HTML DOM

## 获取元素

### 根据ID获取

```javascript
语法：document.getElementById(id)
作用：根据ID获取元素对象
参数：id值，区分大小写的字符串
返回值：元素对象 或 null
```

### 根据标签名获取元素

```javascript
语法：document.getElementsByTagName('标签名') 或者 element.getElementsByTagName('标签名') 
作用：根据标签名获取元素对象
参数：标签名
返回值：元素对象集合（伪数组，数组元素是元素对象）
```

### 根据name属性获取

```javascript
document.getElementsByName('name');
```

### H5新增获取元素方式

```javascript
document.getElementsByClassName('className');
document.querySelector('selector'); // 根据指定选择器返回第一个元素
document.querySelectorAll('selector'); // 根据指定选择器返回全部
```

### 获取特殊元素

```javascript
document.body; // 返回body对象
document.documentElement; // 返回html对象
```

## 操作元素

### 获取/改变元素内容

```javascript
element.innerText; // 不包括html标签与空格和换行
element.innerHTML; // 包括html标签与空格换行
```

### 表单元素的属性操作

```
type/value/checked/selected/disabled
```

### 样式属性操作

```javascript
element.style.backgroundColor; // 直接修改样式
element.className; // 修改类属性
```

### 自定义属性操作

```javascript
element.getAttribute('name'); // 获取自定义属性
element.removeAttribute('name'); // 移除自定义属性
element.setAttribute('name','value'); // 设置自定义属性
```

### HTML5自定义属性

```html
<div getTime="20" data-index="2" data-list-name="andy"></div>
```

获取方法

```javascript
// 可以使用获取自定义属性的方式获取
console.log(div.getAttribute('data-index'));
console.log(div.getAttribute('data-list-name'));
// 也可以使用专用API
console.log(div.dataset.index);
console.log(div.dataset['index']);
// 需要使用驼峰命名
console.log(div.dataset.listName);
console.log(div.dataset['listName']);
```

###  classList 属性

```js
element.classList.add('current');
element.classList.remove('current');
element.classList.toggle('current');
```

## 节点操作

网页中的所有内容都是节点（标签、属性、文本、注释等），在DOM 中，节点使用 node 来表示

HTML DOM 树中的所有节点均可通过 JavaScript 进行访问，所有 HTML 元素（节点）均可被修改，也可以创建或删除

节点至少拥有nodeType（节点类型）、nodeName（节点名称）和nodeValue（节点值）这三个基本属性

- 元素节点 nodeType=1
- 属性节点 nodeType=2
- 文本节点 nodeType=3（包括文字 空格 换行）

### 父节点

```javascript
// 获取该节点最近的父节点
node.parentNode;
```

### 子节点

```javascript
// 获取所有子节点，包含 元素节点 文本节点等等
node.childNodes;
// 只返回元素节点
node.children;
```

```javascript
// 返回子节点，包含 元素节点 文本节点等等
node.firstChild;
node.lastChild;
// 返回元素子节点
node.firstElementChild;
node.lastElementChild;
```

### 兄弟节点

```javascript
// 下一个
node.nextSibling;
// 前一个
node.previousSibling;
node.nextElementSibling;
node.previousElementSibling;
```

### 创建元素

```javascript
document.write(); // 创建元素  如果页面文档流加载完毕，再调用这句话会导致页面重绘
node.innerHTML(); // 直接写HTML来创建元素
document.createElement('tagName');// 创建成功将返回一个节点
```

### 节点新增

```javascript
node.appendChild()
node.insertBefore(child,指定元素)
document.replaceChild()
```

### 节点删除

```javascript
// 从 node节点中删除一个子节点，返回删除的节点
node.removeChild(childNode)
```

### 节点复制

```javascript
// 参数true深拷贝，false浅拷贝
node.cloneNode();
```

## 元素偏移量 offset 系列

![202001281519](/assets/202001281519.png)

offset

- offset 可以得到任意样式表中的样式值
- offset 系列获得的数值是没有单位的
- offsetWidth 包含padding+border+width
- offsetWidth 等属性是只读属性，只能获取不能赋值

style

- style 只能得到行内样式表中的样式值
- style.width 获得的是带有单位的字符串
- style.width 获得不包含padding和border 的值
- style.width 是可读写属性，可以获取也可以赋值

## 元素可视区 client 系列

![202001281819](/assets/202001281819.png)

![202001281820](/assets/202001281820.png)

## 元素滚动 scroll 系列

使用 scroll 系列的相关属性可以动态的得到该元素的大小、滚动距离等

![202001281844](/assets/202001281844.png)

![202001281907](/assets/202001281907.png)

如果浏览器的高（或宽）度不足以显示整个页面时，会自动出现滚动条。当滚动条向下滚动时，页面上面被隐藏掉的高度，我们就称为页面被卷去的头部。滚动条在滚动时会触发 onscroll事件

## 三大系列总结

1. offset系列 经常用于获得元素位置 offsetLeft offsetTop
2. client经常用于获取元素大小 clientWidth clientHeight
3. scroll 经常用于获取滚动距离 scrollTop scrollLeft
4. 注意页面滚动的距离通过 window.pageXOffset 获得
