# leetcode

## 组合两个表

<https://leetcode-cn.com/problems/combine-two-tables/>

```sql
SELECT FirstName, LastName,Address.City,Address.State
    FROM Person LEFT JOIN Address
        ON Address.PersonId = Person.PersonId
```

## 大的国家

<https://leetcode-cn.com/problems/big-countries/>

```sql
SELECT name,population,area FROM World
WHERE area >= 3000000 OR population >= 25000000
```

## 查找重复的电子邮箱

<https://leetcode-cn.com/problems/duplicate-emails/>

```sql 
SELECT DISTINCT Email FROM Person AS t
    WHERE EXISTS(
        SELECT * FROM Person AS t1 WHERE t.Id <> t1.Id AND t.Email = t1.Email)
```

## 超过经理收入的员工

<https://leetcode-cn.com/problems/employees-earning-more-than-their-managers/>

```sql
SELECT Name AS Employee FROM Employee t1
    WHERE Salary > 
        (SELECT Salary FROM Employee AS t2 WHERE t2.Id = t1.ManagerId)
```

## 从不订购的客户

<https://leetcode-cn.com/problems/customers-who-never-order/>

```sql
SELECT Name AS Customers FROM Customers 
WHERE Customers.Id NOT IN
    (SELECT CustomerId FROM Orders)
```

## 有趣的电影

<https://leetcode-cn.com/problems/not-boring-movies/>

```sql
SELECT * FROM cinema
WHERE description <> 'boring' AND id %2 =1 
ORDER BY rating DESC
```

## 超过5名学生的课

<https://leetcode-cn.com/problems/classes-more-than-5-students/>

```sql
-- 注意对学生姓名去重
SELECT class FROM courses 
GROUP BY class HAVING COUNT(DISTINCT student) >=5
```