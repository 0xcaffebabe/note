# MVC

- model:模型代表一个存取数据的对象或 JAVA POJO。它也可以带有逻辑，在数据变化时更新控制器
- view:视图代表模型包含的数据的可视化
- controller:控制器作用于模型和视图上。它控制数据流向模型对象，并在数据变化时更新视图。它使视图与模型分离开

- Model1模型

![](https://static.javatpoint.com/images/st/model1.jpg)

- Model2模型

![](https://static.javatpoint.com/images/st/model2.jpg)

当有用户的行为触发操作时，会有控制器更新模型，并通知视图进行更新，在这时视图向模型请求新的数据

## 优势

- 清晰的职责划分
- 组件独立，代码重用
- 后期维护方便
- 适合任何项目

## 弊端

- 展示数据慢（针对jsp）
- 对开发者架构设计能力要求高
- 异步交互不方便
