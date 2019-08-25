>PLSQL是Oracle对sql语言的过程化扩展，指在SQL命令语言中增加了过程处理语句（如分支、循环等），使SQL语言具有过程处理能力。把SQL语言的数据操纵能力与过程语言的数据处理能力结合起来，使得PLSQL面向过程但比过程语言简单、高效、灵活和实用

# 定义变量

```sql
declare
  i number(2) :=10;
begin
  dbms_output.put_line(i);
end;
```

- 查询语句赋值

```sql
declare
  ena emp.ename%type;
begin
  select ename into ena from emp where empno = 7788;
  dbms_output.put_line(ena);
end;
```

# 分支语句

```sql
declare
  age number(2) := 55;
begin
  if age < 18 then
    dbms_output.put_line('未成年');
  elsif age>18 and age <40 then
    dbms_output.put_line('中年');
  else
    dbms_output.put_line('老年');
  end if;
    
end;
```

# 循环

- while循环

```sql
declare
  i int := 1;
begin
  while i<11 loop
        dbms_output.put_line(i);
        i := i+1;
  end loop;
end;
```

- exit循环

```sql
declare
  i int := 1;
begin
  loop
    exit when i>10;
    dbms_output.put_line(i);
    i:= i+1;
  end loop;
end;
```

- for循环

```sql
declare
  i int := 1;
begin
  for i in 1..10 loop
    dbms_output.put_line(i);
  end loop;
end;
```

# 游标

```sql
declare
  cursor c is select * from emp;
  empr emp%rowtype;
begin
  open c;
       loop
         fetch c into empr;
         exit when c%notfound;
         dbms_output.put_line(empr.ename);
       end loop;
  
  close c;
end;
```

# 存储过程

- 定义

```sql
create or replace procedure p(eno emp.empno%type)
is

begin
  dbms_output.put_line(eno);
end;
```

- 调用

```sql
begin
  p(15);
end;
```

# 存储函数

- 定义

```sql
create or replace function f(eno emp.empno%type) return number
is
       s number(10);
begin
  select sal*12+nvl(comm,0) into s  from emp where empno = eno;
  return s;
end;
```

- 使用

```sql
declare
  s number(10);
begin
  s := f(7788);
  dbms_output.put_line(s);
end;
```

# out参数

类似引用变量

# 存储函数与存储过程

>一般来讲，过程和函数的区别在于函数可以有一个返回值；而过程没有返回值。
但过程和函数都可以通过out指定一个或多个输出参数。我们可以利用out参数，在过程和函数中实现返回多个值。

# 触发器

- 语句级触发器

```sql
create or replace trigger t
after
insert on person
declare
begin
       dbms_output.put_line('插入操作');
end;
```

- 行级触发器

```sql
create or replace trigger addsal4p 
before update of sal on myemp 
for each row 
begin 
if :old.sal >= :new.sal then 
    raise_application_error(-20002, '涨前的工资不能大于涨后的工资'); 
end if; 
end;
```

# java调用

```java
        Class.forName("oracle.jdbc.driver.OracleDriver");

        Connection connection = DriverManager.getConnection("jdbc:oracle:thin:@127.0.0.1:1521:orcl", "scott", "tiger");

        /*查询*/
        ResultSet resultSet = connection.prepareStatement("SELECT * FROM emp").executeQuery();
        while (resultSet.next()){
            System.out.println(resultSet.getString("ename"));
        }

        /*调用存储过程*/
        CallableStatement callableStatement = connection.prepareCall("(call p1(?))");
        callableStatement.registerOutParameter(1, OracleTypes.NUMBER);
        callableStatement.execute();
        System.out.println(callableStatement.getObject(1));

        /*调用存储函数*/
        callableStatement = connection.prepareCall("(? = call f(?))");
        callableStatement.setInt(2,7788);
        callableStatement.registerOutParameter(1, OracleTypes.NUMBER);

        callableStatement.execute();
        System.out.println(callableStatement.getObject(1));
        connection.close();
```
