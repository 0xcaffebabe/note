# AOP
## AOP简介
![enter image description here](https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=764221332,501156740&fm=26&gp=0.jpg)
## AOP术语
- 通知
    - 前置通知（before）
    - 后置通知（after）
    - 返回通知（after returning）
    - 异常通知（after throwing）
    - 环绕通知（around）
- 连接点
- 切点
- 切面
- 引入
- 织入
## 编写切点
AspectJ指示器
![enter image description here](https://bbsmax.ikafan.com/static/L3Byb3h5L2h0dHAvaW1hZ2VzMjAxNS5jbmJsb2dzLmNvbS9ibG9nLzk4ODc4Mi8yMDE2MDkvOTg4NzgyLTIwMTYwOTAyMTEzMTQxMDExLTExMjkzMzYwNzYucG5n.jpg)
一个简单的切点实例
![enter image description here](https://bbsmax.ikafan.com/static/L3Byb3h5L2h0dHAvaW1hZ2VzMjAxNS5jbmJsb2dzLmNvbS9ibG9nLzkyNzYwOC8yMDE3MDQvOTI3NjA4LTIwMTcwNDAyMTkyMzEyODIwLTE2ODc5NDY5MzkucG5n.jpg)
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
