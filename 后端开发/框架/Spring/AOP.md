# 动态代理

- 基于接口
- 基于子类

```java
public class Main {

    public static void main(String[] args) {
        Bean bean = (Bean) Enhancer.create(Bean.class, new MethodInterceptor() {
            private Bean bean = new Bean();
            @Override
            public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
                System.out.println(method);
                return method.invoke(bean,objects);
            }
        });

        bean.run();
    }
}

class Bean{
    public void run(){
        System.out.println("bean run");
    }
}
```



# AOP

## AOP简介

![enter image description here](https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=764221332,501156740&fm=26&gp=0.jpg)

## AOP术语

- 通知(Advice):所谓通知是指拦截到Joinpoint之后所要做的事情就是通知

  - 前置通知（before）:执行前执行
  - 后置通知（after）：执行后执行
  - 返回通知（after returning）
  - 异常通知（after throwing）
  - 环绕通知（around）

*使用xml时，后置通知与返回通知以及异常通知的执行顺序取决于配置顺序*

- 连接点(Joinpoint):所谓连接点是指那些被拦截到的点。在spring中,这些点指的是方法,因为spring只支持方法类型的连接点。
- 切点(Pointcut):所谓切入点是指我们要对哪些Joinpoint进行拦截的定义。
- 切面(Aspect):是切入点和通知（引介）的结合。
- 引入(Introduction):引介是一种特殊的通知在不修改类代码的前提下, Introduction可以在运行期为类动态地添加一些方法或Field。
- 织入(Weaving):是指把增强应用到目标对象来创建新的代理对象的过程。

## 编写切点

- AspectJ指示器

![enter image description here](https://oscimg.oschina.net/oscnet/48381d18d1889691ae28357968adbfa3408.jpg) 

- 一个简单的切点实例 

```
execution(* wang.ismy.spring.service.Service.doSth(..))
```
### execution

![](https://img2018.cnblogs.com/blog/475392/201810/475392-20181031104431559-1365885037.png)


## 创建切面

```java
@Aspect
  @Component
  @Slf4j
  public class ErrorPageAspect {

    @Pointcut("@annotation(wang.ismy.zbq.annotations.ErrorPage)")
    public void pointCut(){}

    @Around("pointCut()")
    public Object around(ProceedingJoinPoint joinPoint){
        try {
            return joinPoint.proceed();
        } catch (Throwable throwable) {

            ModelAndView modelAndView = new ModelAndView();
            modelAndView.setViewName("error");
            modelAndView.addObject("error",throwable.getMessage());

            return modelAndView;
        }

    }
  }
```

### 使用xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/aop
        https://www.springframework.org/schema/aop/spring-aop.xsd">
    
    <aop:config>
        <!--配置切面-->
        <aop:aspect id="loggerAdvice" ref="logger">
            <aop:around method="log" pointcut="execution(* wang.ismy.spring.service.Service.doSth(..))"/>
        </aop:aspect>
    </aop:config>

    <bean class="wang.ismy.spring.service.impl.ServiceImpl"/>
    <bean id="logger" class="wang.ismy.spring.Logger"/>
</beans>
```

# 事务
