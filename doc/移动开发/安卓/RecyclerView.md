# RecyclerView
> A flexible view for providing a limited window into a large data set.
## 基本使用
- 定义一个Adapter，其用来控制数据与Item的绑定关系
    ```java
    public class MyAdapter extends RecyclerView.Adapter<MyViewHolder> {

    LayoutInflater layoutInflater;
    Context context;
    List<String> data;

    public MyAdapter(Context context, List<String> data) {
        this.context = context;
        this.data = data;
        layoutInflater = LayoutInflater.from(context);
    }

    @NonNull
    @Override
    public MyViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int i) {
        View view = layoutInflater.inflate(R.layout.single_view,viewGroup,false);

        return new MyViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MyViewHolder myViewHolder, int i) {
        myViewHolder.textView.setText(data.get(i));
    }

    @Override
    public int getItemCount() {
        return data.size();
    }
}
    ```
- 其中，ViewHolder则是控制单条Item的显示
    ```java
    public class MyViewHolder extends RecyclerView.ViewHolder {

   TextView textView;

    public MyViewHolder(@NonNull View itemView) {
        super(itemView);
        textView = itemView.findViewById(R.id.tv);
    }
}
    ```
在使用时，只要指定布局管理器以及适配器，就可以自定义数据的显示方式
```java
RecyclerView.LayoutManager manager = new GridLayoutManager(this,3);
        rw.setAdapter(adapter);
        rw.setLayoutManager(manager);
```
也就是说，RecyclerView提供了一种插拔式的体验，类似于模板方法模式，只要修改一下细节，就可以重新定义数据的显示方式
