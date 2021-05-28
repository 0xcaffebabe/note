# AOP

## 动态代理

- 基于接口 JDK
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

## AOP简介

![20211520172](/assets/20211520172.png)

AOP术语:

- 通知(Advice):所谓通知是指拦截到Joinpoint之后所要做的事情就是通知

  - 前置通知（before）:执行前执行
  - 后置通知（after）：执行后执行
  - 返回通知（after returning）
  - 异常通知（after throwing）
  - 环绕通知（around）

_使用xml时，后置通知与返回通知以及异常通知的执行顺序取决于配置顺序_

- 连接点(Joinpoint):所谓连接点是指那些被拦截到的点。在spring中,这些点指的是方法,因为spring只支持方法类型的连接点。
- 切点(Pointcut):所谓切入点是指我们要对哪些Joinpoint进行拦截的定义。
- 切面(Aspect):是切入点和通知（引介）的结合。
- 引入(Introduction):引介是一种特殊的通知在不修改类代码的前提下, Introduction可以在运行期为类动态地添加一些方法或Field。
- 织入(Weaving):是指把增强应用到目标对象来创建新的代理对象的过程。

### 编写切点

- AspectJ指示器

Spring借助AspectJ的切点表达式语言来定义切面

AspectJ指示器  | 描述
----------- | ----------------------------------------------------
arg()       | 限制连接点匹配参数为指定类型的执行方法
@args()     | 限制连接点匹配参数由指定注解标注的执行方法
execution() | 用于匹配是连接点的执行方法
this()      | 限制连接点匹配AOP代理的Bean引用为指定类型的类
target()    | 限制连接点匹配目标对象为指定类型的类
@target ()  | 限制连接点匹配特定的执行对象，这些对象对应的类要具备指定类型的注解
within()    | 限制连接点匹配指定的类型
@within()   | 限制连接点匹配指定注解所标注的类型( 当使用Spring AOP时，方法定义在由指定的注解所标注的类里)
@annotation | 限制匹配带有指定注解连接点

- 一个简单的切点实例

```
execution(* wang.ismy.spring.service.Service.doSth(..))
```

#### execution

![](https://img2018.cnblogs.com/blog/475392/201810/475392-20181031104431559-1365885037.png)

### 创建切面

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

#### 使用xml

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

## AOP 原理

AbstractAutoProxyCreator 实现了BeanPostProcessor 

通过在Bean 实例化后，通过动态代理的方式 createProxy 对 Bean进行一层包裹 返回代理完成后的Bean

AopProxy 目前Spring 有2种方式 ...
