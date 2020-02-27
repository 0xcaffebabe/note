# ES5

## 数组方法

```js
// 遍历数组
[1, 2, 3, 4, 5].forEach(function (v, i, a) {
    console.log("index:" + i + ",value:" + v)
})

// 对数组中的每个元素进行操作，然后返回
var a = [1, 2, 3, 4, 5].map(function (v, i, a) {
    return v = v*v;
})

// filter过滤数组
var a = [1, 2, 3, 4, 5].filter(function (v, i, a) {
    return i % 2 == 0;
})

// 是否有满足条件的元素(any)
var flag = [1, 2, 3, 4, 5].some(function (v, i, a) {
    // 当找到第一个满足条件的元素后，就停止循环了
    return v < 3;
})

// 是否全部满足条件(all)
var flag = [1, 2, 3, 4, 5].every(function (v, i, a) {
    return v > 0;
})
```

## 字符串方法

```js
// 去除前后空格
"  das  ".trim()
```

## 对象方法

```js
// 获取对象属性名列表
Object.keys({name:'cxk',age:'18'})
```

### Object.defineProperty

```js
Object.defineProperty(对象，修改或新增的属性名，{
		value:修改或新增的属性的值,
		writable:true/false,//如果值为false 不允许修改这个属性值
		enumerable: false,//enumerable 如果值为false 则不允许遍历
        configurable: false  //configurable 如果为false 则不允许删除这个属性 属性是否可以被删除或是否可以再次修改特性
})	
```

```js
var obj = {
    name:'cxk'
}
Object.defineProperty(obj,'name',{
    
    writable:false,
    enumerable:true,
    configurable:false
})

obj.name= 'jntm'; //无效
for (let i in obj){
    // 无法枚举到name
    console.log(i)
}
// 无法再重新修改特性
Object.defineProperty(obj,'name',{
    configurable:true
})
```