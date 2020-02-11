# 更多的配置

## 配置DispatcherServlet

```java
@Override
    protected void customizeRegistration(ServletRegistration.Dynamic registration) {
        registration.setMultipartConfig(
                new MultipartConfigElement("./")
        );

    }
```

## 配置Servlet与Filter

```java
@Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        super.onStartup(servletContext);

        var a=servletContext.addServlet("my-servlet",MyServlet.class);
        a.addMapping("/my");

        var b= servletContext.addFilter("my-fliter",MyFliter.class);

        b.addMappingForUrlPatterns(null,false,"/*");

    }
```

# 处理multipart 数据

## 必要前提

- form表单的enctype取值必须是：multipart/form-data
- method属性取值必须是Post
- 提供一个文件选择域`<input type=”file” />`

## 使用

- 配置multipart解析器
    - StandardServletMultipartResolver
    - CommonsMultipartResolver

```java
@Bean
    public MultipartResolver multipartResolver(){
        return new StandardServletMultipartResolver();
    }
```

```xml
<bean id="multipartResolver" class="org.springframework.web.multipart.commons.CommonsMultipartResolver"/>
```

- 处理multipart 请求

```java
@RequestMapping("/upload")
    @ResponseBody
    public String upload(@RequestPart("file")MultipartFile file) throws IOException {
        FileUtils.writeByteArrayToFile(new File("d:/"+file.getOriginalFilename()),file.getBytes());
        return "上传完成";
    }
```

```html
<form action="./upload" enctype="multipart/form-data" method="post">
    <input type="file" name="file">
    <input type="submit">
</form>
```

# 处理异常

- 自定义异常

```java
@ResponseStatus(value = HttpStatus.NOT_FOUND,reason = "未找到")
public class MyException extends RuntimeException{ }
```

```java
@RequestMapping("/home")
    public String hello(Model model){

        model.addAttribute("time", LocalDate.now());
        if (true)
        throw new MyException();
        return "home.html";
    }
```

## 定义异常处理

```java
public class MyExceptionHandler implements HandlerExceptionResolver {
    @Override
    public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            response.getWriter().println(ex.getMessage());
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

```xml
<bean id="handlerExceptionResolver" class="MyExceptionHandler"/>
```

- 异常处理器
```java
@ExceptionHandler(Exception.class)
@ResponseBody
public Object handler(Exception e){
    return e.getMessage();
}
```

# 控制器通知
本质：对Controller进行AOP
```java
// 所有的controller发生异常都会通过这个类进行处理
@ControllerAdvice
public class MyControllerAdvice {

    @ExceptionHandler(Exception.class)
    @ResponseBody
    public Object handler(Exception e){
        return e.getMessage();
    }
}
```

# 请求重定向转发数据
*forward(服务器转发)与redirect(客户端重定向)*
## 重定向传递数据的方法
- url传递
- flash属性传递


# 拦截器

```java
public class MyInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("进入controller前执行");
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        System.out.println("完成controller方法后执行");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        System.out.println("请求完成执行");
    }
}
```

```xml
    <mvc:interceptors>
        <mvc:interceptor>
            <mvc:mapping path="/**"/>
            <bean class="wang.ismy.spring.mvc.MyInterceptor"/>
        </mvc:interceptor>
    </mvc:interceptors>
```
