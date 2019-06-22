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

- 配置multipart解析器
    - StandardServletMultipartResolver
    - CommonsMultipartResolver

```java
@Bean
    public MultipartResolver multipartResolver(){
        return new StandardServletMultipartResolver();
    }
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


