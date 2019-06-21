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

```java
@Bean
    public UserDetailsService userDetailsService() throws Exception {
        // ensure the passwords are encoded properly
        User.UserBuilder users = User.withDefaultPasswordEncoder();
        InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
        manager.createUser(users.username("user").password("password").roles("USER").build());
        manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build());
        return manager;
    }
```

- 基于数据库
- 基于LDAP

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

# 自定义拦截请求

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

## 使用Spring表达式

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

## 强制使用Https

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

## CSRF防御

## 使用HTTP Basic认证
```java
 http
                .authorizeRequests()
                .antMatchers("/home").access("hasRole('ADMIN') and hasIpAddress('::1')").and().httpBasic().and()
                .authorizeRequests()
                .anyRequest().permitAll();
```
## 启用记住我功能
```java
.and().httpBasic().and().rememberMe()
```

# 保护视图
- Spring Security的jsp标签库
- 使用thymeleaf的spring security 方言

