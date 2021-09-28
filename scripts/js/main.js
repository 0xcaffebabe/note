console.log("hello world");

function colorMapping(days){
  if (days <= 10){
    return 'danger'
  }else if(days > 10 && days <= 30){
    return 'warning'
  }else if(days > 30 && days <= 100){
    return 'success'
  }else if(days > 100 && days <= 300){
    return 'main'
  }
  return 'info';
}

function updatePageLastupdate(){
  const nodeList = document.querySelectorAll(".page-lastupdate");
  for(let item of nodeList) {
    const updateTime = new Date(item.getAttribute("date-time"));
    const days = Math.floor((new Date().getTime() - updateTime.getTime()) / (3600*24*1000));
    item.classList.add('color-' + colorMapping(days))
    if (days == 0) {
      item.innerHTML = "1天内更新";
    }else {
      item.innerHTML = days + "天前更新";
    }
  }
}

updatePageLastupdate();
