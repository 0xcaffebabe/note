# 视图解析
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
视图解析器的工作原理很简单，外部会传给视图解析器一个视图名和地区对象，
解析根据两个参数返回一个视图。
视图做的工作就是根据外部传入的模型，来渲染出html页面。
