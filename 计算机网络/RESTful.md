# RESTful

一套关于设计请求的规范

- 资源
- 表现层
- 状态转化

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