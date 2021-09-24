console.log("hello world");

function updatePageLastupdate(){
  const nodeList = document.querySelectorAll(".page-lastupdate");
  for(let item of nodeList) {
    const updateTime = new Date(item.getAttribute("date-time"));
    const days = Math.floor((new Date().getTime() - updateTime.getTime()) / (3600*24*1000));
    if (days == 0) {
      item.innerHTML = "1天内更新";
    }else {
      item.innerHTML = days + "天前更新";
    }
  }
}

updatePageLastupdate();
