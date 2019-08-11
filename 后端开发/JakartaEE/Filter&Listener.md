# Filter

> 一般用于完成通用的操作。如：登录验证、统一编码处理、敏感字符过滤

## 使用

- 实现Filter接口
- 配置

  - 注解
  - web.xml

    ```xml
    <filter>
                <filter-name>demo1</filter-name>
                <filter-class>cn.itcast.web.filter.FilterDemo1</filter-class>
            </filter>
            <filter-mapping>
                <filter-name>demo1</filter-name>
                <!-- 拦截路径 -->
                <url-pattern>/*</url-pattern>
            </filter-mapping>
    ```

## 执行流程

- 执行过滤器
- 执行放行后的资源
- 回来执行过滤器放行代码下边的代码

## 生命周期方法

- init:在服务器启动后，会创建Filter对象，然后调用init方法。只执行一次。用于加载资源
- doFilter:每一次请求被拦截资源时，会执行。执行多次
- destroy:在服务器关闭后，Filter对象被销毁。如果服务器是正常关闭，则会执行destroy方法。只执行一次。用于释放资源

## 拦截方式配置：资源被访问的方式

- REQUEST：默认值。浏览器直接请求资源
- FORWARD：转发访问资源
- INCLUDE：包含访问资源
- ERROR：错误跳转资源
- ASYNC：异步访问资源

```java
@WebFilter(value = "/*",dispatcherTypes = DispatcherType.ERROR)
```


