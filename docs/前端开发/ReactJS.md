# 前端开发的演变

静态页面-AJAX-前端MVC-SPA

# ReactJS

>ReactJS把复杂的页面，拆分成一个个的组件，将这些组件一个个的拼装起来，就会呈现多样的页面。ReactJS可以用于 MVC 架构，也可以用于 MVVM 架构，或者别的架构

## JSX语法

>JSX语法就是，可以在js文件中插入html片段，是React自创的一种语法

在JSX语法中，只能有一个根标签，不能有多个

```jsx
const div1 = <div>right</div>;
const div2 = </div>error</div></div>error</div>;
```

- 函数调用

```jsx
<div>{f()}</div> // f是函数名
```

## 组件

- 组件定义

```jsx
import React from 'react';

class HelloWorld extends React.Component{
    
    render() { // 重写渲染方法
        return <div>cxk：jntm</div>
    }
}

export default HelloWorld; // 导出该类
```

- 使用自定义组件

```jsx
import React from 'react';
import HelloWorld from "./HelloWorld";

class Show extends React.Component{
    
    render() {
        return <HelloWorld/>
    }
}
export default Show;
```

- 组件参数传递

```jsx
// 属性传递              标签包裹传递
<HelloWorld name="cxk"> 蔡徐坤</HelloWorld>
// 接收
<div>{this.props.name}：{this.props.children}</div>
```

- 组件状态

每一个组件都有一个状态，其保存在this.state中，当状态值发生变化时，React框架会自动调用render()方法，重新渲染页面

-  this.state值的设置要在构造参数中完成
-  要修改this.state的值，需要调用this.setState()完成，不能直接对其进行修改

```jsx
class HelloWorld extends React.Component{

    constructor(props, context) {
        super(props, context);
        this.state = {
            dataList : [1,2,3]
        };
    }

    render() { // 重写渲染方法
        return <div>
            <ul>
                {
                    this.state.dataList.map((value,index)=>{
                      return <li>{value}</li>
                    })
                }
            </ul>
            <button onClick={()=>{
                let list = this.state.dataList;
                list.push(Math.random());
                this.setState({dataList:list})
            }}>click</button>
        </div>
    }
}
```

- 生命周期

![](https://user-gold-cdn.xitu.io/2017/11/11/88e11709488aeea3f9c6595ee4083bf3?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

添加钩子方法

```jsx
class HelloWorld extends React.Component{

    // 组件挂载后调用
    componentDidMount() {
        console.log("组件挂载后...");
    }

    // 省略其他
}
```

# 前端代码分层

- Page 负责与用户直接打交道：渲染页面、接受用户的操作输入，侧重于展示型交互 性逻辑
- Model 负责处理业务逻辑，为 Page 做数据、状态的读写、变换、暂存等
- Service 负责与 HTTP 接口对接，进行纯粹的数据读写

## 使用DVA进行数据分层管理

- 添加models

```js
export default {
    namespace : 'list',
    state:{
        data:[1,2,3]
    }
}

```

- 使用数据

```jsx
import React from 'react'
import {connect} from 'dva'

const namespace = 'list'

const map = (state)=>{
    const list = state[namespace].data;
    return {
        list
    }
};

@connect(map)
class List extends React.Component{
    render() {
        return <ul>
            {
                this.props.list.map((v,i)=>{
                    return <li>{v}</li>
                })
            }
        </ul>
    }
}

export default List;
```

- 修改数据

```js
export default {
    namespace: 'list',
    state: {
        data: [1, 2, 3]
    }
    ,
    reducers: {
        addNewData(state){
            let list = [...state.data,Math.random()];

            console.log(list);
            return {
                data:list
            }
        }
    }
}
```

```jsx
// 省略导入

// 省略map1

const map1 = (dispatch)=>{
    return {
        addNewData:()=>{
            dispatch(
                {
                    type:namespace+"/addNewData"
                }
            )
        }
    }
}

@connect(map,map1)
class List extends React.Component{
    render() {
        return <ul>
            {
                this.props.list.map((v,i)=>{
                    return <li>{v}</li>
                })
            }
            <button onClick={()=>{
                this.props.addNewData()
            }}>
                点击
            </button>
        </ul>
    }
}

export default List;
```








