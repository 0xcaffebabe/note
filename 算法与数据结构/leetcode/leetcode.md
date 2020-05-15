# leetcode

## 两数之和

给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那两个整数，并返回他们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素不能使用两遍

>给定 nums = [2, 7, 11, 15], target = 9
>
>因为 nums[0] + nums[1] = 2 + 7 = 9
>所以返回 [0, 1]


- 解法1

暴力求解，双重循环求得数组的两个项等于target的组合

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int[] ret =new int[2];
        for(int i=0;i<nums.length;i++){
            for(int j=i;j<nums.length;j++){
                if(nums[i]+nums[j]==target
                  && i!=j){
                    ret[0]=i;
                    ret[1]=j;
                    return ret;
                }
            }
        }
        return ret;
    }
}
```
耗时:60-100ms

- 解法2

使用map存储(target-数组的item,index)
遍历数组，根据数组的item查找到index，
如果找到的index不与当前遍历的index相同，
则结果就是当前的index与查找的index

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int[] result = new int[2];
        Map<Integer,Integer> map = new HashMap<>();
        for (int i=0;i<nums.length;i++){
            map.put(target-nums[i],i);
        }
        for (int i=0;i<nums.length;i++){
            Integer i1 = map.get(nums[i]);
            if (i1 == null || i == i1) {
                continue;
            }
            if (nums[i] + nums[i1] == target){
                return new int[]{i,i1};
            }
        }
        return result;
    }
}
```

耗时:3-4ms

## 翻转32位整数

123 -> 321

- 解法1

转换成字符串翻转

```java
class Solution {
    public int reverse(int x) {
       boolean f = false;
        if (x<0){
            f=true;

        }
        long l = x;
        String s = String.valueOf(l);

        StringBuilder sb = new StringBuilder();
        for(int i =s.length()-1;i>=0;i--){
            sb.append(s.charAt(i));
        }
        if (sb.toString().charAt(sb.length()-1) == '-'){
            sb = sb.replace(sb.length()-1,sb.length(),"");
        }
        long ret = Long.parseLong(sb.toString());
        if (f){
            ret = -ret;
        }
        if (ret > Integer.MAX_VALUE || ret <Integer.MIN_VALUE){
            return 0;
        }
        return (int) ret;
    }
}
```

耗时：28ms

- 解法2

将这个数通过区域拆解成n个个位数
再倒序n个个位数相加

```java
class Solution {
    public int reverse(int x) {
        int i;
        long result = 0;
        LinkedList<Integer> list = new LinkedList<>();
        long f =1;
        while (x!=0){
            i = x%10;
            x/=10;
            if (x!=0){
                f*=10;
            }
            list.offer(i);
        }
        while(list.size() != 0){
            result +=list.poll()*f;
            f/=10;
        }
        // 判断溢出
        return (int)result == result ? (int)result:0;
    }
}
```

使用队列解决正序转倒序问题

耗时：3ms