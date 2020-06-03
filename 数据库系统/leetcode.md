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