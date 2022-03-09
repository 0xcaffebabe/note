# Web 视图渲染

## 视图解析

ViewResolver接口

```java
public interface ViewResolver {

    View resolveViewName(String viewName, Locale locale) throws Exception;

}
```

View接口

```java
public interface View {

    @Nullable
    default String getContentType() {
        return null;
    }


    void render(@Nullable Map<String, ?> model, HttpServletRequest request, HttpServletResponse response)
            throws Exception;

}
```

视图解析器的工作原理很简单，外部会传给视图解析器一个视图名和地区对象， 解析两个参数返回一个视图。 视图做的工作就是根据外部传入的模型，来渲染出html页面，使用 并使用 HttpServletResponse 输出到前端。

### Spring 提供的视图解析器

视图解析器                          | 说明
------------------------------ | --------------------------------------------------
AbstractCachingViewResolver    | 会对解析的View对象缓存 以提高性能
UrlBasedViewResolver           | 会对redirect:、forward:等特殊的url特殊处理，并将请求转发给子类实现，返回具体视图
InternalResourceViewResolver   | 继承了 UrlBasedViewResolver，可以用来访问内部资源，比如jsp等待
FreeMarkerViewResolver         | 用来支持FreeMarker模板
ContentNegotiatingViewResolver | 用来支持HTTP的内容协商功能
BeanNameViewResolver           | 一种极为灵活的视图解析方式，直接通过 Spring 中的容器 Bean 名称来获取视图


### 创建JSP视图

- 配置视图解析器

  ```java
  @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
        viewResolver.setPrefix("/WEB-INF/views/");
        viewResolver.setSuffix(".jsp");
        viewResolver.setViewClass(JstlView.class);
        return viewResolver;
    }
  ```

  访问home就相当于访问/WEB-INF/views/home.jsp

## 使用 Thymeleaf

### 三个与spring集成的bean

- 配置 thymeleaf

  ```java
  @Bean
    public ViewResolver viewResolver() {
        ThymeleafViewResolver resolver = new ThymeleafViewResolver();
        resolver.setTemplateEngine((ISpringTemplateEngine) templateEngine());
        resolver.setCharacterEncoding("UTF-8");
        return resolver;
    }

    @Bean
    public TemplateEngine templateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setEnableSpringELCompiler(true);
        engine.setTemplateResolver(templateResolver());
        return engine;
    }

    private ITemplateResolver templateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setApplicationContext(applicationContext);
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setTemplateMode(TemplateMode.HTML);
        return resolver;
    }
  ```

- 使用thymeleaf

  ```html
  <p th:text="*{time}"></p>
  ```

## 响应

- 返回String类型

  > 返回字符串可以指定逻辑视图名，通过视图解析器解析为物理视图地址
  ```java
  return "redirect:http://baidu.com"; // 重定向(浏览器地址栏发生变化)
  return "forward:/index.jsp"; // 转发(地址栏不变化)
  ```

- 返回void类型

  > 操作servlet api

- 返回ModelAndView类型

### 静态资源配置

```xml
    <!--配置静态资源过滤-->
    <mvc:resources mapping="/js/**" location="/js/"/>
```

### 响应json

@ResponseBody
