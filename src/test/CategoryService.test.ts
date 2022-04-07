import CategoryService from "../build/CategoryService";

main()

async function main() {
  const category = await CategoryService.getCategoryList()
  console.log(category)
}