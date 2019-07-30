- 复用

# 使用

- 创建继承Fragment的类
- 重写onCreateView方法
- 绑定xml

  ```java
  View view = inflater.inflate(R.layout.fragment_title,null);
  return view;
  ```

  ## 静态使用

- 在xml中使用

  ```xml
  <fragment
        android:id="@+id/main_fragment"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:name="wang.ismy.fragment.TitleFragment"
      />
  ```

# 动态使用

- 老版本

  ```java
  button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                FragmentManager manager = getFragmentManager();
                FragmentTransaction transaction = manager.beginTransaction();
                transaction.add(R.id.title_layout,new TitleFragment());
                transaction.commit();
            }
        });
  ```

- 新版本

```java
    getSupportFragmentManager()
                        .beginTransaction()
                        .add(R.id.title_layout,new TitleFragment())
                        .commit();
```

_V4包_

# 动态切换

```java
                Random random = new Random();
                if (random.nextBoolean()){
                    getSupportFragmentManager()
                            .beginTransaction()
                            .replace(R.id.title_layout,new TitleFragment())
                            .commit();
                }else{
                    getSupportFragmentManager()
                            .beginTransaction()
                            .replace(R.id.title_layout,new ContentFragment())
                            .commit();
                }
```

# 生命周期

![批注 2019-07-30 152358](/assets/批注%202019-07-30%20152358.png)






