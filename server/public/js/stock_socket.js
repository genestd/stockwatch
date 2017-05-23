var socket = io.connect('/');
socket.on('tickerUpdate', function(data) {
  console.log(data)

  //update stocklist
  stocklist = []
  for(key in data.stocklist){
    stocklist.push(key)
  }

  //update ticker tape
  scrolltext = data.tickerInfo
  var ts = document.getElementById("timestamp")
  ts.textContent = data.timestamp
  if(animId){
    cancelAnimationFrame(animId)
  }
  ticker()

  //clear input box
  document.getElementById('inputAddStock').value = ''

  //set remove stock form options
  var selectList = document.getElementById("removeStock")
  selectList.options.length = 0
  for( var i=0; i<stocklist.length; i++){
    selectList.options[i] = new Option( stocklist[i], stocklist[i])
  }

  //set add stock form options

  allTickers = data.allTickers
  var addList = document.getElementById("drop")
  addList.innerHTML=""
  var listItem
  for( var i=0; i<data.allTickers.length; i++){
     listItem = document.createElement('li')
     listItem.innerHTML = data.allTickers[i][0]
     listItem.addEventListener('click', setInput)
     addList.appendChild(listItem)
  }
});

socket.on('chartUpdate', function(data) {
  for( var i=0; i<data.chartdata.length; i++){
    data.chartdata[i].date = parseTime(data.chartdata[i].date)
  }
  myChart.data(data.chartdata).draw()

})
