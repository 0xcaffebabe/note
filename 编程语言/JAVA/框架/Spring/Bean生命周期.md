# Bean 生命周期

## 初始化与销毁

### 使用@Bean时指定

指定initMethod 和 destroyMethod 来指定相对应的初始化方法跟销毁方法。

值得注意的是，销毁方法只有在Bean是单例的时候才会执行。

### InitializingBean&DisposableBean接口

```java
public class Man implements InitializingBean, DisposableBean {
    public Man() {
        System.out.println("调用无参构造器创建Man");
    }

    @Override
    public void destroy() {
        System.out.println("销毁Man");
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("初始化Man");
    }
}
```

### @PostConstruct&@PreDestroy

这两个注解非Spring提供，由JSR250定义

```java
@Component
public class Bean {

    //创建后执行
    @PostConstruct
    public void init(){ System.out.println("init"); }

    //销毁前执行
    @PreDestroy
    public void destroy(){ System.out.println("destroy"); }
}
```

## BeanPostProcessor

该接口定义了两个方法，为Spring定义的扩展点，实现该接口，所有Bean在初始化前后都会调用这个钩子，我们可根据自定义处理

```java
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        System.out.println(beanName + " 初始化之前调用");
        return bean;
    }
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        System.out.println(beanName + " 初始化之后调用");
        return bean;
    }
}
```

### InstantiationAwareBeanPostProcessor

Bean实例化钩子

```java
public interface InstantiationAwareBeanPostProcessor extends BeanPostProcessor {
  // 可在该方法自定义Bean实例化过程 若返回null就代表走默认的实例化过程
  default Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException {
		return null;
	}
  // 若上方的方法不返回null 该方法不会被调用
  // 该方法若返回false 不会调用下面的属性值处理方法
  default boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
		return true;
	}
  @Nullable
	default PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName)
			throws BeansException {

		return null;
	}
}
```

![屏幕截图 2021-05-27 152724](/assets/屏幕截图%202021-05-27%20152724.png)

## BeanFactoryPostProcessor

该钩子会在Bean定义加载完成后、Bean实例化前被调用，通常用于修改bean的定义，Bean的属性值等。

### BeanDefinitionRegistryPostProcessor

BeanDefinitionRegistryPostProcessor的postProcessBeanDefinitionRegistry方法执行时机先于BeanFactoryPostProcessor的postProcessBeanFactory方法
