$(document).foundation()

/************************************
* Global Variables
************************************/
// id to allow cancel of requestAnimationFrame()
var animID = undefined
// this will be the list of stocks/prices for the ticker.  Will be supplied by server over websocket
var scrolltext = 'Stock Tracker...Add stocks to get started'
var stocklist = []
// buttons, inpus for adding form handlers
var allTickers = []
var inputAddStock = document.getElementById('inputAddStock')
var addButton = document.getElementById('btnAddStock')
var errMsg = document.getElementById('addStockHelpText')
var removeButton = document.getElementById('btnRemoveStock')
var selectTickers = document.getElementById('all-tickers')
// variables for chart
var chartsize = {}
var parseTime = d3.timeParse("%Y-%m-%d");
var chartlist = []
var chartdata = []
var myChart
/************************************
* EVENT HANDLERS
************************************/
window.addEventListener('resize', function resizeApp(){
  //restart ticker tape
  if(animId){
    cancelAnimationFrame(animId)
  }
  this.ticker()

  //resize chart
  chartsize = {width: document.getElementById('main').getBoundingClientRect().width,
              height: document.getElementById('main').getBoundingClientRect().height }
  if(typeof myChart === 'function'){
    myChart.size(chartsize).draw()
  }
})

inputAddStock.addEventListener('input', liveSearch)

removeButton.addEventListener('click', function removeStock(event){
  event.preventDefault()

  //get ticker value to remove
  var ticker = document.getElementById('removeStock').value
  //set callout box message
  var msg = document.getElementById('remove-message')
  msg.innerHTML = "Removing " + ticker + "..."
  //trigger callout
  var btn = document.getElementById("remove-toggle")
  btn.click()
  //server API call, if successful remove callout
  axios.post('/remove', { ticker: ticker})
    .then( result => {
      btn.click()
    })
    .catch( error =>{
      console.log(error)
    })
})

addButton.addEventListener('click', function addStock(event){
  event.preventDefault()
  //get ticker value to add
  var input = document.getElementById('inputAddStock').value
  var msg = document.getElementById('add-message')
  msg.innerHTML = "Adding " + input

  //trigger callout
  var callout = document.getElementById('add-callout')
  var btn = document.getElementById('add-toggle')
  btn.click()

  var valid = false
  if(!input){
    valid=false
    callout.classList.remove('success')
    callout.classList.add('alert')
    msg.innerHTML = "Ticker must contain a value"

    document.getElementById('inputAddStock').value = ""
    return
  }

  //check if ticker already exists
  for(var i=0; i<stocklist.length; i++){
    if (stocklist[i] === input.toUpperCase() ){
      callout.classList.remove('success')
      callout.classList.add('alert')
      msg.innerHTML = 'Ticker already exists'

      valid = false
      document.getElementById('inputAddStock').value = ""
      return
    }
  }

  //check AllTickers for match
  for(var j=0; j<allTickers.length; j++){
    if(allTickers[j][0] === input){
      valid = true
      break
    }
  }

  if(valid){
    axios.post('/add', { ticker: input})
      .then( result=>{
        console.log('here')
        btn.click()
      })
      .catch( error=>{
        console.log(error)
      })
  } else {
    document.getElementById('inputAddStock').value = ""
  }
})
/********************************
* Create the stock chart, assign to global variable
********************************/
var temp = (function buildChart(){
  axios.get('/chartdata')
  .then( result=>{
    //chartlist = result.data.list
    chartdata = result.data.data
    console.log(chartdata)
    for(var i=0; i<chartdata.length; i++){
      chartdata[i].date = parseTime(chartdata[i].date)
    }
    chartsize = {width: document.getElementById('main').getBoundingClientRect().width,
                height: document.getElementById('main').getBoundingClientRect().height }
    var chrt = lineChart().size(chartsize).data(chartdata)
    d3.select('#main').call(chrt)
    chrt.draw()
    myChart = chrt
    //wierd hack to make mouseover tooltip show on lines
    window.setTimeout( function(){
      myChart.draw()
    }, 600)
  })
})()
/********************************
* Create the scrolling ticker
********************************/
function ticker() {

  var fontSize = 36
  var cnvs = document.getElementById('marquee')
  var h = fontSize * 2
  var w =  document.getElementById('hero').getBoundingClientRect().width
  cnvs.setAttribute('height', h)
  cnvs.setAttribute('width', w)
  var context = cnvs.getContext('2d')

  // stuff for animating goes here
  context.fillStyle = 'forestgreen'
  context.font = "36px 'Roboto Mono', monospace"
  context.textBaseline='middle'
  textwidth = context.measureText(scrolltext).width
  var start = document.getElementById('hero').getBoundingClientRect().width

  function animate(){
    context.clearRect(0,0,cnvs.width,cnvs.height)
    w =  document.getElementById('hero').getBoundingClientRect().width
    //cnvs.setAttribute('width', w)
    start--
    if( start + textwidth < 0){
      start = w
    }
    context.fillText(scrolltext, start, h/2)
    animId = requestAnimationFrame(animate);
  }
  animate()
}
ticker();
/********************************
* Live search for stock tickers
********************************/
function liveSearch(event){
  var msg = document.getElementById('add-message')
  var callout = document.getElementById('add-callout')

  msg.innerHTML = ""
  var input = event.target.value.toUpperCase()
  var options = document.getElementById('drop').children
  var counter = 0
   for(var i=0; i<options.length; i++){
     if(options[i].innerHTML.substring(0,input.length) === input){
       options[i].style.display = 'list-item'
  //     options[i].focus()
  //     options[i].selected=false
  //     if (counter === 0){
  //       options[i].selected=true
         counter++
  //     }
     } else {
       options[i].style.display = 'none'
     }
  }
  if (counter===0){
    msg.innerHTML = "Invalid Ticker"
    callout.classList.remove('success')
    callout.classList.add('warning')
  }
}
function setInput(event){
  inputAddStock.value = event.target.innerHTML
  var drop = document.getElementById('drop').classList.toggle('is-open')
}
