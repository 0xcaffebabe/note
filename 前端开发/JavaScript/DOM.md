# DOM

>DOM是W3C组织制定的一套处理 html和xml文档的规范

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

```js
语法：document.getElementById(id)
作用：根据ID获取元素对象
参数：id值，区分大小写的字符串
返回值：元素对象 或 null
```

