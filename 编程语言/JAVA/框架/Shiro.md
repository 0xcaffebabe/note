# Shiro

![屏幕截图 2021-09-24 111015](/assets/屏幕截图%202021-09-24%20111015.png)

- Authentication ：身份认证/登录
- Authorization： ：授权，即权限验证

Shiro  不会去维护用户、维护权限

![屏幕截图 2021-09-24 111210](/assets/屏幕截图%202021-09-24%20111210.png)

## 身份验证

```java
SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
Subject subject = SecurityUtils.getSubject();
var token = new UsernamePasswordToken("cxk", "123");
try {
    subject.login(token);
} catch (AuthenticationException e) {
    // 登录失败
    e.printStackTrace();
}
System.out.println(subject.isAuthenticated()); // true
subject.logout();
System.out.println(subject.isAuthenticated()); // false
```

### 认证流程

![屏幕截图 2021-09-24 113925](/assets/屏幕截图%202021-09-24%20113925.png)

Realm：Shiro 从从 Realm 获取安全数据（如用户、角色、权限）

实现org.apache.shiro.realm.Realm接口来自定义自己的用户认证流程

需要注意的是认证完成返回的AuthenticationInfo 这个对象代表用户的信息 权限。

Shiro 提供的 Realm：

![屏幕截图 2021-09-24 114623](/assets/屏幕截图%202021-09-24%20114623.png)

Authenticator 及 AuthenticationStrategy

- Authenticator 的职责是验证用户帐号
- AuthenticationStrategy 指定了当多个账号符合时 该怎么处理
