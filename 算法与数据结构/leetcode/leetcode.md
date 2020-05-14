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