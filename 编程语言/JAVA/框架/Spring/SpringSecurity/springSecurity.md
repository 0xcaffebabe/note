# SpringSecurity

> Spring Security是一个能够为基于Spring的企业应用系统提供声明式的安全访问控制解决方案的安全框架

- 组成模块

模块                 | 描述
------------------ | ----------------------------------------------------------------
ACL                | 支持通过访问控制列表(access control list,ACL)为域对象提供安全性
切面(Aspects)        | 一个很小的模块，当使用Spring Security注解时，会使用基于AspectJ的切面，而不是使用标准的Spring AOP
CAS客户端(CAS Client) | 提供与Jasig的中心认证服务(Central Authentication Service,CAS)进行集成的功能
配置(Configuration)  | 包含通过XML和Java配置Spring Security的功能支持
核心(Core)           | 提供Spring Security基本库
加密(Cryptography)   | 提供了加密和密码编码的功能
LDAP               | 支持基于LDAP进行认证
OpenlD             | 支持使用OpenlD进行集中式认证
Remoting           | 提供了对Spring Remoting的支持
标签库(Tag Library)   | Spring Security的JSP标签库
Web                | 提供了Spring Security基于Filter的Web安全性支持

## 配置

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
        http.authorizeRequests()
            .anyRequest().authenticated()
            .and()
            .formLogin().and().httpBasic();
    }
}
```

## 添加用户

- 基于内存

```java
@Override
@Bean
public UserDetailsService userDetailsService() {
    User.UserBuilder users = User.builder();
    InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
    manager.createUser(users.username("user")
            .password(new BCryptPasswordEncoder().encode("123")).roles("USER")
            .authorities("play")
            .build()
    );
    manager.createUser(users.username("admin").password(new BCryptPasswordEncoder().encode("123")).roles("USER", "ADMIN").build());
    return manager;
}
```

- 基于数据库
- 基于LDAP

## 限制访问

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .authorizeRequests()
            .antMatchers("/").hasAnyAuthority("play")
            .and()
            .httpBasic();
}
```

## 自定义错误页面

```java
@Configuration
public class WebServerAutoConfiguration {
    @Bean
    public ConfigurableServletWebServerFactory configurableServletWebServerFactory(){
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
        factory.addErrorPages(new ErrorPage(HttpStatus.FORBIDDEN,"/error/403"));
        return factory;
    }
}
```

## 自定义登录页面

```java
.formLogin().loginPage("/login").and().csrf().disable();
```

## 自定义认证成功失败处理

AuthenticationFailureHandler 认证失败接口
AuthenticationSuccessHandler 认证成功接口

## 添加自定义用户服务

实现该接口

```java
public interface UserDetailsService {
	UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
}
```

UserDetails需要实现的内容

```java
public interface UserDetails extends Serializable {
	
	Collection<? extends GrantedAuthority> getAuthorities();

	String getPassword();

	String getUsername();

	boolean isAccountNonExpired();

	boolean isAccountNonLocked();

	boolean isCredentialsNonExpired();

	boolean isEnabled();
}                                            
```

## 自定义拦截请求

```java
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        System.out.println("auth pro run");
        http
                .authorizeRequests()
                .antMatchers("/home").hasRole("ADMIN").and().formLogin().and()
                .authorizeRequests()
                .anyRequest().permitAll();
    }
```

### 使用Spring表达式

```java
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        System.out.println("auth pro run");
        http
                .authorizeRequests()
                .antMatchers("/home").access("hasRole('ADMIN') and hasIpAddress('::1')").and().formLogin().and()
                .authorizeRequests()
                .anyRequest().permitAll();
    }
```

### 强制使用Https

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    System.out.println("auth pro run");
    http
            .authorizeRequests()
            .antMatchers("/home").access("hasRole('ADMIN') and hasIpAddress('::1')").and().formLogin().and()
            .authorizeRequests()
            .anyRequest().permitAll().and().requiresChannel().anyRequest().requiresSecure();
}
```

### CSRF防御

### 使用HTTP Basic认证
```java
 http
                .authorizeRequests()
                .antMatchers("/home").access("hasRole('ADMIN') and hasIpAddress('::1')").and().httpBasic().and()
                .authorizeRequests()
                .anyRequest().permitAll();
```
### 启用记住我功能
```java
.and().httpBasic().and().rememberMe()
```

# 保护视图
- Spring Security的jsp标签库
- 使用thymeleaf的spring security 方言

## 保护方法调用

### 使用注解保护方法

- 配置

```java
@Configuration
@EnableGlobalMethodSecurity(securedEnabled = true)
class Config1 extends GlobalMethodSecurityConfiguration{

}
```

### @Secured

```java
@Secured("ROLE_ADMIN")
@RequestMapping("/home")
@ResponseBody
public String home(){
    return "home";
}
```

### 使用表达式保护方法

- 启用相关配置支持

  ```java
  @EnableGlobalMethodSecurity(prePostEnabled = true)
  ```

- 相关注解

  - @PreAuthorize :在方法调用前进行验证
  - @PostAuthorize：在方法调用后进行验证
  - @PreFilter :调用前对参数进行过滤
  - @PostFilter ：调用后对返回结果进行过滤

```java
@PreAuthorize("#id == 10")
public void invoke(Integer id){

}
```

#### 定义许可计算器

- 实现该接口

```java
public interface PermissionEvaluator extends AopInfrastructureBean {

    boolean hasPermission(Authentication authentication, Object targetDomainObject,
            Object permission);

    boolean hasPermission(Authentication authentication, Serializable targetId,
            String targetType, Object permission);
}
```

- 注册到Spring Security 中

![批注 2019-06-22 153017](/assets/批注%202019-06-22%20153017.png)