# Servlets

> server applet 运行在服务器端的小程序

## WebServlet

### 使用

- 实现Servlet接口

```java
public class MyServlet implements Servlet{
   ...
    @Override
    public void service(ServletRequest servletRequest, ServletResponse servletResponse) throws ServletException, IOException {
        servletResponse.getWriter().println("hello world");
    }
    ...
}
```

- 在web.xml配置

```xml
<servlet>
    <servlet-name>MyServlet</servlet-name>
    <servlet-class>wang.ismy.web.MyServlet</servlet-class>
</servlet>
<servlet-mapping>
    <servlet-name>MyServlet</servlet-name>
    <url-pattern>/*</url-pattern>
</servlet-mapping>
```

### 原理

- 当服务器接受到客户端浏览器的请求后，会解析请求URL路径，获取访问的Servlet的资源路径
- 查找web.xml文件，是否有对应的`<url-pattern>`标签体内容。
- 如果有，则在找到对应的`<servlet-class>`全类名
- tomcat会将字节码文件加载进内存，并且创建其对象
- 调用其方法

## 生命周期方法

被创建：执行init方法，只执行一次

```
* Servlet什么时候被创建？
            * 默认情况下，第一次被访问时，Servlet被创建
            * 可以配置执行Servlet的创建时机。
                * 在<servlet>标签下配置
                    1\. 第一次被访问时，创建
                        * <load-on-startup>的值为负数
                    2\. 在服务器启动时，创建
                        * <load-on-startup>的值为0或正整数

        * Servlet的init方法，只执行一次，说明一个Servlet在内存中只存在一个对象，Servlet是单例的
            * 多个用户同时访问时，可能存在线程安全问题。
            * 解决：尽量不要在Servlet中定义成员变量。即使定义了成员变量，也不要对修改值
```

提供服务：执行service方法，执行多次

```
* 每次访问Servlet时，Service方法都会被调用一次。
```

被销毁：执行destroy方法，只执行一次

```
* Servlet被销毁时执行。服务器关闭时，Servlet被销毁
        * 只有服务器正常关闭时，才会执行destroy方法。
        * destroy方法在Servlet被销毁之前执行，一般用于释放资源
```

![](http://static.oschina.net/uploads/space/2015/0403/112707_yOnu_120166.jpg)

### Servlet3.0

- 加上注解后不用配置web.xml

```java
@WebServlet("/*")
```

## 体系结构

![批注 2019-08-09 093125](/assets/批注%202019-08-09%20093125.png)

## 配置

路径定义规则：

- /xxx：路径匹配
- /xxx/xxx:多层路径，目录结构
- *.do：扩展名匹配

## Request

### 体系结构

```
request对象继承体系结构：    
        ServletRequest        --    接口
            |    继承
        HttpServletRequest    -- 接口
            |    实现
        org.apache.catalina.connector.RequestFacade 类(tomcat)
```

### 方法

- 获取请求行数据

  - String getMethod()
  - String getContextPath()
  - String getServletPath()
  - String getQueryString()
  - String getRequestURI()
  - String getProtocol()
  - String getRemoteAddr()

- 获取请求头数据

  - String getHeader(String name)
  - Enumeration

    `string getHeaderNames()`

- 获取请求体数据

  - BufferedReader getReader()
  - ServletInputStream getInputStream()

- 其他

  - String getParameter(String name)
  - String[] getParameterValues(String name)
  - `Map<string,string[]> getParameterMap()</string,string[]>`

### 请求转发

```java
req.getRequestDispatcher("/404")
                .forward(req,resp);
```

- 浏览器地址栏路径不发生变化
- 只能转发到当前服务器内部资源中。
- 转发是一次请求

### 共享数据

_request域：代表一次请求的范围，一般用于请求转发的多个资源中共享数据_

- void setAttribute(String name,Object obj):存储数据
- Object getAttitude(String name):通过键获取值
- void removeAttribute(String name):通过键移除键值对

## Response

### 方法

- 设置状态码：setStatus(int sc)
- 字符输出流：PrintWriter getWriter()
- 字节输出流：ServletOutputStream getOutputStream()

```
* 重定向的特点:redirect
                1\. 地址栏发生变化
                2\. 重定向可以访问其他站点(服务器)的资源
                3\. 重定向是两次请求。不能使用request对象来共享数据
            * 转发的特点：forward
                1\. 转发地址栏路径不变
                2\. 转发只能访问当前服务器下的资源
                3\. 转发是一次请求，可以使用request对象来共享数据
```

### 乱码问题

`PrintWriter pw = response.getWriter();`获取的流的默认编码是ISO-8859-1

```java
//设置编码，是在获取流之前设置
response.setContentType("text/html;charset=utf-8");
```

## **ServletContext**

获取：

- 通过request对象获取 `request.getServletContext();`
- 通过HttpServlet获取 `this.getServletContext();`

### 获取MIME类型

```java
System.out.println(getServletContext().getMimeType("a.jpg"));
```

### 域对象：共享数据

- setAttribute(String name,Object value)
- getAttribute(String name)
- removeAttribute(String name)

### 获取文件真实路径

- String getRealPath(String path)

## Servlet 过滤器(Filter)

> 一般用于完成通用的操作。如：登录验证、统一编码处理、敏感字符过滤

```java
@WebFilter
public class LoggingFilter implements Filter {
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        //...
    }
}
```

也可以不适用注解使用如下xml配置

```xml
<filter>
    <filter-name>demo1</filter-name>
    <filter-class>wang.ismy.javaee.LoggingFilter</filter-class>
</filter>
<filter-mapping>
    <filter-name>demo1</filter-name>
    <!-- 拦截路径 -->
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

### 执行流程

- 执行过滤器
- 执行放行后的资源
- 回来执行过滤器放行代码下边的代码

### 生命周期方法

- init:在服务器启动后，会创建Filter对象，然后调用init方法。只执行一次。用于加载资源
- doFilter:每一次请求被拦截资源时，会执行。执行多次
- destroy:在服务器关闭后，Filter对象被销毁。如果服务器是正常关闭，则会执行destroy方法。只执行一次。用于释放资源

### 拦截方式配置：资源被访问的方式

- REQUEST：默认值。浏览器直接请求资源
- FORWARD：转发访问资源
- INCLUDE：包含访问资源
- ERROR：错误跳转资源
- ASYNC：异步访问资源

```java
@WebFilter(value = "/*",dispatcherTypes = DispatcherType.ERROR)
```

### 过滤器链

- 注解配置

  - 按照类名字符串排序

- web.xml配置

  - 按照filter-mapping排序

## 事件监听器(Listener)

- ServletContextListener
- HttpSessionListener
- ServletRequestListener

## 异步支持

```java
@WebServlet(urlPatterns = "/hello",asyncSupported = true)
public class MyServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        AsyncContext async = req.startAsync();
        async.addListener(new AsyncListener() {
            @Override
            public void onComplete(AsyncEvent asyncEvent) throws IOException {
                asyncEvent.getSuppliedResponse().getWriter().write("jntm");
            }
            //...
        });
        new Thread(()->{
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            async.complete();
        }).start();
    }
}
```

## 非阻塞IO

```java
AsyncContext async = req.startAsync();
ServletInputStream inputStream = req.getInputStream();
inputStream.setReadListener(new ReadListener() {
    @Override
    public void onDataAvailable() throws IOException {
        byte[] bytes = new byte[1024];
        while (inputStream.isReady() && inputStream.read(bytes)!=-1){
            System.out.println(new String(bytes));
        }
        async.complete();
    }
    @Override
    public void onAllDataRead() throws IOException {
        async.complete();
    }
    @Override
    public void onError(Throwable throwable) {
        throwable.printStackTrace();
        async.complete();
    }
});
```

## WebFragment

可以对XML配置进行分区

## 安全

- @ServletSecurity

## 错误映射

```xml
<error-page>
    <error-code>404</error-code>
    <location>/404.html</location>
</error-page>
<error-page>
    <exception-type>java.lang.RuntimeException</exception-type>
    <location>/500.html</location>
</error-page>
```

## 文件上传

- @MultiPartConfig

## 工作原理

### Servlet

体系结构：

![屏幕截图 2020-10-06 105912](/assets/屏幕截图%202020-10-06%20105912.png)

ServletContexnt：贯穿请求的上下文

ServletConfig：传递参数集合

- 创建

StandardWrapper.loadServlet() 方法创建Servlet实例

```java
InstanceManager instanceManager = ((StandardContext)getParent()).getInstanceManager();
try {
    servlet = (Servlet) instanceManager.newInstance(servletClass;
...
```

- 初始化

StandardWrapper.initServlet() 调用Servlet.init()

```java
servlet.init(facade);
```