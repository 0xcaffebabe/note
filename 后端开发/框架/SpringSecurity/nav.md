# 简介

> Spring Security是一个功能强大且可高度自定义的身份验证和访问控制框架。 它是保护基于Spring的应用程序的事实标准。 

Spring Security是一个专注于为Java应用程序提供身份验证和授权的框架。 与所有Spring项目一样， Spring Security的真正强大之处在于它可以轻松扩展以满足自定义要求

- 组成模块

![enter image description here](https://img-blog.csdn.net/20180511171241264)

# 配置

- 添加spring security 拦截链

```java
    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        var a= servletContext.addFilter("springSecurityFilterChain", DelegatingFilterProxy.class);
        a.addMappingForUrlPatterns(null,false,"/*");
    }
```

- 创建相关安全性配置

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        System.out.println("auth pro run");
        http
                .authorizeRequests()
                .anyRequest().authenticated()
                .and()
                .formLogin().and().httpBasic();
    }
}
```
## 添加用户
- 基于内存



