import os

def listAllFile(path):
  list = os.list(path)
  result = []
  for item in list:
    if os.path.isdir(item) :
      result.extend(listAllFile(item))
    else:
      result.append(item)
  return result

print(listAllFile("./"))