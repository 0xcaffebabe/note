# RESTful

一套关于设计请求的规范，本质上谈不上规范，更多的是一种风格

- 资源：代表一个抽象实体
- 表征（表现层）：资源的表现形式
- 状态：在特定上下文下产生的信息
- 转移：状态发生了变化
- 超文本驱动：通过服务端返回的超文本来决定客户端行为

>URI代表一种资源、客户端与服务器，传递资源的某种表现层、客户端通过HTTP动词，对服务器资源进行操作

GET：      获取数据
POST：    添加数据
PUT：      更新数据
DELETE： 删除数据

## 常见错误

- URI包含动词
- URI包含版本

## 范例

请求方式    | URL                              | 含义
------- | -------------------------------- | -------------
GET：    | <http://www.example.com/users>   | 获取用户列表数据
POST：   | <http://www.example.com/users>   | 创建(添加)用户数据
GET：    | <http://www.example.com/users/1> | 获取用户ID为1的用户信息
PUT：    | <http://www.example.com/users/1> | 修改用户ID为1的用户信息
DELETE： | <http://www.example.com/users/1> | 删除用户ID为1的用户信息

## RESTful的系统

1. 服务端与客户端分离
2. 无状态
3. 可缓存
4. 分层系统
5. 统一接口
6. 按需代码

### REST风格的好处

1. 降低服务接口的学习成本
2. 资源之间有天然的集合或者层次结构

### RMM成熟度

0. The Swamp of Plain Old XML：完全不REST。另外，关于Plain Old XML这说法，SOA表示感觉有被冒犯到。
1. Resources：开始引入资源的概念。
2. HTTP Verbs：引入统一接口，映射到HTTP协议的方法上。
3. Hypermedia Controls：超媒体控制在本文里面的说法是“超文本驱动”

### 不足

- 面向资源（也就是REST）更适合做CRUD，面向过程面向对象才能表达更加复杂的逻辑
- REST绑定HTTP 既是优点，同时也是缺点，不适合用于高性能的场景
- REST本身没有传输可靠性支持 需要自己做好幂等性处理
- REST缺乏对资源进行“部分”和“批量”的处理能力
