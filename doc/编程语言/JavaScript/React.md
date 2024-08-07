
# React

## JSX

JSX 是一套声明 React 组件的语法。

```jsx
<header className="App-header">
  <h1>main</h1>
</header>
```

17 之前会编译成 JS 代码：

```js
React.createElement("header", {className: "App-header"},
  React.createElement("h1", null, "main")
);
```

17 之后引入了一个 jsx-runtime，其是通过将 JSX 转为结构化描述传给 runtime 进行渲染

### 注意事项

1. 以下语法会渲染空结果

```jsx
return 
    <div>main</div> /* 没有用()包裹且换行 */

```

### 命名规则

- 自定义 React 组件时，组件本身采用的变量名或者函数名，需要以大写字母开头
- props 使用小写字母开头，驼峰格式

### 元素类型

- `<div></div> <img />` 等真实 DOM 元素
- 自定义的组件，会调用对应组件的渲染方法
- React Fragment 元素，用来包裹多个子元素，不会在 DOM 中生成真实元素

### 子元素类型

1. 字符串，最终会被渲染成 HTML 标签里的字符串；
2. 另一段 JSX，会嵌套渲染；
3. JS 表达式，会在渲染过程中执行，并让返回值参与到渲染过程中；
4. 布尔值、null 值、undefined 值，不会被渲染出来；
5. 以上各种类型组成的数组。

## 渲染机制

React 的组件会渲染出一棵元素树。因为开发者使用的是 React 的声明式 API，在此基础上，每次有 props、state 等数据变动时，组件会渲染出新的元素树，React 框架会与之前的树做 Diffing 对比，将元素的变动最终体现在浏览器页面的 DOM 中。这一过程就称为协调（Reconciliation）

diffing 算法：

1. 递归对比：从根元素开始，递归对比两棵树的根元素和子元素。
2. 不同类型的元素：如果元素类型不同（例如HTML元素与React组件元素），React会直接清理旧元素及其子树，然后建立新的树。
3. 不同HTML标签：如果两者都是HTML元素，但标签不同，React会直接清理旧元素及其子树，然后建立新的树。
4. 不同组件类或函数：如果两者都是React组件元素，但组件类或函数不同，React会卸载旧元素及其子树，然后挂载新的元素树。
5. 相同HTML标签：如果HTML标签相同，React会保留该元素，并记录有改变的属性。例如，value属性从"old"变成"new"。
6. 相同组件类或函数：如果组件类或函数相同，React会保留组件实例，更新props，并触发组件的生命周期方法或Hooks

在对比两棵树对应节点的子元素时，如果子元素形成一个列表，那么 React 会按顺序尝试匹配新旧两个列表的元素，会利用 key 属性值来判断前后两个列表的元素变化情况优化插入性能

触发协调的时机：

当 props、state、context 数据发生变化时，会触发对当前组件触发协调过程，最终按照 Diffing 结果更改页面

## CSS In JS

Emotion 通过在组件的 css 属性编写 CSS 代码，再在编译后的 style 标签中插入对应的 CSS 代码，实现这个效果

## 生命周期

### 类组件

![](/assets/202472220345.webp)

- 渲染阶段：异步过程，主要负责更新虚拟 DOM（ FiberNode ）树，而不会操作真实 DOM，这一过程可能会被 React 暂停和恢复，甚至并发处理，因此要求渲染阶段的生命周期方法必须是没有任何副作用（Side-effect）的纯函数（Pure Function）
- 提交阶段：同步过程，根据渲染阶段的比对结果修改真实 DOM

挂载：

1. 组件构造函数。如果需要为类组件的 state 设置初始值，或者将类方法的 this 绑定到类实例上，那么可以为类组件定义构造函数；如果不需要设置或绑定的话，就可以省略掉构造函数
2. static getDerivedStateFromProps 。如果类组件定义了这个静态方法，在组件挂载过程中，React 会调用这个方法，根据返回值来设置 state
3. render ，类组件必须要实现这个方法。通常在返回值中会使用 JSX 语法，React 在挂载过程中会调用 render 方法获得组件的元素树。根据元素树，React 最终会生成对应的 DOM 树
4. componentDidMount 。当 React 首次完成对应 DOM 树的创建，会调用这个生命周期方法。可以在里面访问真实 DOM 元素，也可以调用 this.setState() 触发再次渲染，但要注意避免性能问题

更新：

1. static getDerivedStateFromProps 。这个静态方法不仅会在挂载时被调用，也会在更新时调用，而且无论组件 props 是否有更改，只要渲染组件，都会调用这个方法。这个特性有可能造成组件内部的 state 被意外覆盖，根据 React 官方的建议，应谨慎使用这个方法
2. shouldComponentUpdate 。如果类组件定义了这个方法且返回值是 false ，则组件在这一次更新阶段不会重新渲染，后续的 render 等方法也不会被执行，直到下一次更新。这在 React 早期版本是最常见的性能优化方法之一，也是最常写出 Bug 的 API 之一。为了尽量避免跳过必要更新，应优先使用 React 的PureComponent 组件
3. render。只要没有被前面 shouldComponentUpdate 方法返回 false 所取消，render 方法在更新阶段也会被调用，调用的返回值会形成新的 DOM 树
4. getSnapshotBeforeUpdate 。在本次更新真实 DOM 之前，有一次访问原始 DOM 树的机会，就是这个生命周期方法，不过不常用
5. componentDidUpdate 。组件完成更新时会调用这个方法，你可以在这里操作 DOM，也可以处理网络请求，但要注意，需要通过比对新旧 props 或 state 来避免死循环

卸载：

组件即将被卸载时，React 会调用它的 componentWillUnmount 方法，你可以在这个方法中清理定时器、取消不受 React 管理的事件订阅等

错误处理：

如果组件本身定义了 static getDerivedStateFromError 和 componentDidCatch 这两个生命周期方法中的一个，或者两个都定义了，这个组件就成为了错误边界（Error Boundary），这两个方法会被 React 调用来处理错误。如果当前组件不是错误边界，React 就会去找父组件；如果父组件也不是，就会继续往上，直到根组件；如果谁都没接住，应用就挂了

### React.memo

```js
const MyPureComponent = React.memo(MyComponent);
//    ---------------              -----------
//           ^                          ^
//           |                          |
//         纯组件                       组件

const MyPureComponent = React.memo(MyComponent, compare);
//    ---------------              -----------  -------
//           ^                          ^          ^
//           |                          |          |
//         纯组件                       组件      自定义对比函数
```

其对组件进行装饰，默认用法在 props 浅比较没有发生变化，则不会进行渲染，原组件内部不应该有 state 和 context 操作，否则就算 props 没变，原组件还是有可能因为 props 之外的原因重新渲染

### Hooks

Hooks 是一套为函数组件设计的，用于访问 React 内部状态或执行副作用操作，以函数形式存在的 React API

![](/assets/202472220924.webp)

挂载阶段。React 会执行组件函数，在函数执行过程中遇到的 useState 、 useMemo 等 Hooks 依次挂载到 FiberNode 上，useEffect 其实也会被挂载，但它包含的副作用（Side-effect，在 Fiber 引擎中称为 Effect）会保留到提交阶段

更新阶段。当组件接收到新 props，调用 useState 返回的 setter 或者 useReducer 返回的 dispatch 修改了状态，组件会进入更新阶段。组件函数本身会被再次执行，Hooks 会依次与 FiberNode 上已经挂载的 Hooks 一一匹配，并根据需要更新。组件函数的返回值用来更新 FiberNode 树

提交阶段，React 会更新真实 DOM。随后 React 会先执行上一轮 Effect 的清除函数，然后再次执行 Effect。这里的 Effect 包括 useEffect 与useLayoutEffect ，两者特性很相像。其中useLayoutEffect 的 Effect 是在更新真实 DOM 之后同步执行的，与类组件的 componentDidMount、componentDidUpdate 更相似一些；而 useEffect 的 Effect 是异步执行的，一般晚于 useLayoutEffect

卸载阶段。主要是执行 Effect 的清除函数

函数组件的错误处理依赖于父组件或祖先组件提供的错误边界

#### 状态 Hooks

useState：

```js
import React, { useState } from 'react';
// ...省略
function App() {
  const [showAdd, setShowAdd] = useState(false);
  //     -------  ----------             -----
  //        ^         ^                    ^
  //        |         |                    |
  //    state变量  state更新函数           state初始值
  const [todoList, setTodoList] = useState([/* ...省略 */]);
```

每次渲染函数时，useState 都会被执行， React 根据 useState 的次数以及它们的调用顺序来判断不同的 state

useReducer：

```js
function reducer(state, action) {
  switch (action.type) {
    case 'show':
      return true;
    case 'hide':
    default:
      return false;
  }
}

function App() {
  const [showAdd, dispatch] = useReducer(reducer, false);
  // ...省略
  dispatch({ type: 'show' });
```

useRef：调用 useRef 会返回一个可变 ref 对象，而且会保证组件每次重新渲染过程中，同一个 useRef Hook 返回的可变 ref 对象都是同一个对象。可变 ref 对象有一个可供读写的 current 属性，组件重新渲染本身不会影响 current 属性的值；反过来，变更 current 属性值也不会触发组件的重新渲染

```js
const Component = () => {
  const myRef = useRef(null);
  //    -----          ----
  //      ^              ^
  //      |              |
  //   可变ref对象     可变ref对象current属性初始值

  // 读取可变值
  const value = myRef.current;
  // 更新可变值
  myRef.current = newValue;

  return (<div></div>);
};
```

#### 副作用 Hooks

useEffect：

```js
useEffect(() => {/* 省略 */});
//        -----------------
//                ^
//                |
//           副作用回调函数
// 第一种用法：useEffect 在每次组件渲染（包括挂载和更新阶段）时都会被调用，但作为参数的副作用回调函数是在提交阶段才会被调用的，这时副作用回调函数可以访问到组件的真实 DOM
```

```js
useEffect(() => {/* 省略 */}, [var1, var2]);
//        -----------------   -----------
//                ^                ^
//                |                |
//           副作用回调函数       依赖值数组
// 第二种用法：在渲染组件时，会记录下当时的依赖值数组，下次渲染时会把依赖值数组里的值依次与前一次记录下来的值做浅对比（Shallow Compare）
// 如果有不同，才会在提交阶段执行副作用回调函数，否则就跳过这次执行，下次渲染再继续对比依赖值数组
// 依赖项中定义的变量一定是会在回调函数中用到的，否则声明依赖项其实是没有意义的
```

useEffect 可以返回一个清除函数，组件在下一次提交阶段执行同一个副作用回调函数之前，或者是组件即将被卸载之前，会调用这个清除函数

useMemo：

```js
const memoized = useMemo(() => createByHeavyComputing(a, b), [a, b]);
//    --------           ----------------------------------  ------
//       ^                            ^                         ^
//       |                            |                         |
//   工厂函数返回值                   工厂函数                  依赖值数组
// 只有依赖值数组中的依赖值有变化时，该 Hook 才会调用工厂函数重新计算
```

useCallback：

```js
const memoizedFunc = useCallback(() => {/*省略*/}, [a, b]);
//    ------------               ---------------   -----
//         ^                            ^            ^
//         |                            |            |
//   记忆化的回调函数                   回调函数      依赖值数组
// 会把作为第一个参数的回调函数返回给组件，只要第二个参数依赖值数组的依赖项不改变，它就会保证一直返回同一个回调函数（引用），而不是新建一个函数，这也保证了回调函数的闭包也是不变的
```

#### Hooks 使用规则

1. 只能在 React 的函数组件中调用 Hooks
2. 只能在组件函数的最顶层调用 Hooks。因为 Hooks 的实现，是根据调用次数及调用顺序，底层存储为一个链表，在循环判断中使用 Hooks，会造成结果不确定

## 合成事件

React 对原生 DOM 事件进行了包装，提供了与原生事件相同的接口，但行为更加统一和一致

## 组件

### 数据流

props：自定义 React 组件接受一组输入参数，用于改变组件运行时的行为，不可变。

```js
function MyComponent({ prop1, prop2, optionalProp = 'default' }) {...}
```

state：通过调用 useState / useReducer Hooks 创建组件转专有的状态，要修改 state 只能通过 setXxx / dispatch

context：

```js
// 创建一个Context
const MyContext = React.createContext('没路用的初始值');

// Context消费者
function MyGrandchildComponent() {
  const value = useContext(MyContext);
  return (
    <li>{value}</li>
  );
}

// Context提供者
function MyComponent() {
  const [obj, setObj] = useState({ key1: '文本' })
  // ...
  return (
    <MyContext.Provider value={obj}>
      <MyChildComponent />
    </MyContext.Provider>
  );
}
```

React 的数据流是单向的，只能从父组件流向子组件，子组件不能直接修改父组件的状态，只能通过父组件传递一个回调函数，让子组件调用，修改父组件的状态

### 接口

把 React 组件的 props 和 context 看作是接口，包括但不限于：

1. 哪些字段作为 props 暴露出来？
2. 哪些抽取为 context 从全局获取？
3. 哪些数据实现为组件内部的 state？

### 高阶组件

```js
const EnhancedComponent = withSomeFeature(args)(WrappedComponent);
//    -----------------   --------------- ----  ----------------
//          |                    |         |            |
//          |                    V         V            |
//          |                 高阶函数     参数           |
//          |             ---------------------         |
//          |                       |                   |
//          V                       V                   V
//       增强组件                 高阶组件               原组件
```

装饰器模式的应用，可以为组件添加一些公用的功能

## 应用状态管理

### Redux

```js
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counter = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {
    set(state, action) {
      state = action.payload.val;
      return state
    }
  },
});
export const { set } = counter.actions;

const store = configureStore({
  reducer: counter.reducer
});
// 监听
store.subscribe(() => console.log(store.getState()));
// 更新
store.dispatch(set({ val: 2 }));
```
