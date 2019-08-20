# Spring 概览

## 关键策略

- 基于POJO和最小侵入性编程
- 通过依赖和面向接口实现松耦合
- 基于切面和惯例进行声明式编程
- 通过切面和模板减少样板代码

## 简化JAVA开发

- 依赖注入

- 应用切面

- 各种模板

## 容纳你的Bean

### 常用上下文：

- **AnnotationConfigApplicationContext**
- AnnotationConfigWebApplicationContext
- **ClassPathXmlApplicationContext**
- **FileSystemXmlApplicationContext**
- XmlWebApplicationContext

*ApplicationContext立即加载*
*BeanFactory延迟加载*

### bean的生命周期

![bean的生命周期](https://image.slidesharecdn.com/springcore-110623102943-phpapp01/95/spring-framework-core-27-728.jpg?cb=1366969536)

### Spring 模块

![enter image description here](https://static.packt-cdn.com/products/9781788299459/graphics/dc3a99a7-439c-4a12-b8f2-023cc5734180.png)

## Spring框架的核心

DI 和 AOP

# 解耦

- 反射
- 工厂模式解耦
- 控制反转-Inversion Of Control
