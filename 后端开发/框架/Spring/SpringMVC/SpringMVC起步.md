
# 三层架构与MVC



# SpringMVC的请求
![enter image description here](http://static.oschina.net/uploads/space/2016/0826/204821_OC43_2665064.png)
# 配置SpringMVC
## 配置DispatcherServlet
```java
public class Initalizer extends AbstractAnnotationConfigDispatcherServletInitializer {
    @Override
    protected Class<?>[] getRootConfigClasses() {

        return new Class[0];
    }

    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class[]{MVCConfig.class};
    }

    @Override
    protected String[] getServletMappings() {
        return new String[]{"/"};
    }
}

```
```java
@Configuration
@EnableWebMvc
@ComponentScan("wang.ismy.spring")
public class MVCConfig extends WebMvcConfigurationSupport {

    @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();

        viewResolver.setPrefix("/WEB-INF/classes/views/");

        viewResolver.setSuffix(".jsp");
        viewResolver.setViewClass(JstlView.class);
        return viewResolver;
    }

    @Override
    protected void configureDefaultServletHandling(DefaultServletHandlerConfigurer configurer) {
        configurer.enable();
    }
}
```
使用以上代码可以使用java代码配置dispatcherServlet
原因：servlet3.0中，容器会在类路径查找实现了ServletContainerInitializer的类
Spring提供了该实现，叫做SpringServletContainerInitializer
此类会反过来查找WebApplicationInitializer的实现,而AbstractAnnotationConfigDispatcherServletInitializer就是它的一个实现
# 控制器编写
```java
@org.springframework.stereotype.Controller
public class Controller {
    
    @RequestMapping("/home")
    public String hello(){
        return "home";
    }
}

```
## 向视图传递数据
```java
@RequestMapping("/home")
    public String hello(ModelAndView modelAndView){

        modelAndView.addObject("time", LocalDate.now());
        return "home";
    }
```
## 接收请求的输入
- @RequestParam 
- @PathVariable
## 表单处理
- 接收数据
```java
@PostMapping("/form")
    public String form(Person person){
        System.out.println(person);
        return "home";
}
```
```html
<form action="./form" method="post">
    <input name="user" type="text">
    <input name="password" type="password">
    <input type="submit">
</form>
```
- 表单校验
```java
public class Person {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

}
```
```java
@PostMapping("/form")
    public String form(@Valid Person person, Errors errors){
        if (errors.hasErrors()){
            throw new RuntimeException(errors.getAllErrors().get(0).getDefaultMessage());
        }
        System.out.println(person);
        return "home";
    }
```
valid api:
![批注 2019-06-13 151452](/assets/批注%202019-06-13%20151452.png)



