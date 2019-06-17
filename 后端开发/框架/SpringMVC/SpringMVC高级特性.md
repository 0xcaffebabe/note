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

