var request = require('request')
var moment = require('moment')
var d3 = require('d3')

var stockdata = function(){

  var seed = { "FB": {color:"#3957ff"},
               "AMZN": {color: "#d3fe14"},
               "NFLX": {color: "#c9080a"},
               "GOOGL": {color: "#fec7f8"}
             }
  var stocklist = Object.assign({}, seed)
  var key = process.env.ALPHA_VANTAGE_KEY
  var allTickers = {}
  //http://jnnnnn.github.io/category-colors-constrained.html
  var colorPointer = 4
  const colors = [
    "#3957ff", "#d3fe14", "#c9080a", "#fec7f8", "#0b7b3e", "#0bf0e9", "#c203c8", "#fd9b39", "#888593", "#906407",
    "#98ba7f", "#fe6794", "#10b0ff", "#ac7bff", "#fee7c0", "#964c63", "#1da49c", "#0ad811", "#bbd9fd", "#fe6cfe",
    "#297192", "#d1a09c", "#78579e", "#81ffad", "#739400", "#ca6949", "#d9bf01", "#646a58", "#d5097e", "#bb73a9",
    "#ccf6e9", "#9cb4b6", "#b6a7d4", "#9e8c62", "#6e83c8", "#01af64", "#a71afd", "#cfe589", "#d4ccd1", "#fd4109",
    "#bf8f0e", "#2f786e", "#4ed1a5", "#d8bb7d", "#a54509", "#6a9276", "#a4777a", "#fc12c9", "#606f15", "#3cc4d9",
    "#f31c4e", "#73616f", "#f097c6", "#fc8772", "#92a6fe", "#875b44", "#699ab3", "#94bc19", "#7d5bf0", "#d24dfe",
    "#c85b74", "#68ff57", "#b62347", "#994b91", "#646b8c", "#977ab4", "#d694fd", "#c4d5b5", "#fdc4bd", "#1cae05",
    "#7bd972", "#e9700a", "#d08f5d", "#8bb9e1", "#fde945", "#a29d98", "#1682fb", "#9ad9e0", "#d6cafe", "#8d8328",
    "#b091a7", "#647579", "#1f8d11", "#e7eafd", "#b9660b", "#a4a644", "#fec24c", "#b1168c", "#188cc1", "#7ab297",
    "#4468ae", "#c949a6", "#d48295", "#eb6dc2", "#d5b0cb", "#ff9ffb", "#fdb082", "#af4d44", "#a759c4", "#a9e03a"
  ]

  /*********************************
  * Simple list of stocks being monitored.  Always start with at least the FANG group
  *********************************/
  function getStocklist(){
    return stocklist
  }

  /*********************************
  * Add a new stock to the list
  *********************************/
  function addStock(ticker){
    //validate ticker

    //add ticker if it's not already in the object
    if( !stocklist.hasOwnProperty(ticker) ){
      var upper = ticker.toUpperCase()
      var color = colors[colorPointer++]
      stocklist[ticker] = {color: color}
    }
    console.log('added', stocklist)
  }

  /*********************************
  * Remove a stock from the list
  *********************************/
  function removeStock(ticker){
    for(key in stocklist){
      if( key === ticker){
        console.log('match')
        delete stocklist[key]
        console.log('list:', stocklist)
      }
    }
  }

  /*********************************
  * Get stock prices for the most recent weekday
  * First get the most recent updated date from QUANDL
  * Then use that date to get most recent close prices
  *********************************/
  function getStockPrices() {

    // Return a new promise.
    return new Promise(function(resolve, reject) {
      var dateURL = 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES/metadata.json?api_key=' + process.env.QUANDL_KEY
      var date
      request.get(dateURL, function(error, response, body){
        if(error || !body){
          //set date to quandl format...if weekend, set to friday
          //TODO: handle holidays/market closure???
          if (moment().day() === 0 ){
            date = moment().day(-2).format('YYYYMMDD')
          } else if (moment().day() === 6 ){
            date = moment().day(-1).format('YYYYMMDD')
          } else {
            date = moment().format('YYYYMMDD')
          }
        } else {
          date = JSON.parse(body).datatable.status.refreshed_at.substr(0, 10)
          date = moment(date).format('YYYYMMDD')
        }

        var tickers = []
        var temp = getStocklist()
        for(key in temp){
          tickers.push(key)
        }
        //Format response for sending
        var msg = {
          prices: '',
          timestamp: ''
        }
        if(tickers.length === 0){
          return resolve(msg)
        }
        tickers.join(',')
        var url = 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?qopts.columns=ticker,date,close&date=' + date + '&ticker=' + tickers + '&api_key=' + process.env.QUANDL_KEY
        console.log(url)
        request.get(url, function(error, response, body){
          if(error || !body){
            reject(Error(error))
          } else {
            var data = JSON.parse(body).datatable.data
            //Loop through results (ticker is index: 0, price is index: 2, timestamp is index: 1)
            for(var i=0; i<data.length; i++){
              if( i>0 ){ msg.prices += ", "}
              msg.prices = msg.prices + data[i][0] + ": " + data[i][2]
              var tempDate = moment(data[i][1], 'YYYY-MM-DD').format('MMMM Do, YYYY')
              if(tempDate > msg.timestamp){
                msg.timestamp=tempDate
              }
            }
            resolve(msg)
          }

        }) //end 2nd request

      }) //end 1st request
    }) //end promise
  }

  /*********************************
  * Get stock prices for the most recent weekday
  *********************************/
  function getChartData(){
    // Return a new promise.
    return new Promise(function(resolve, reject) {
      //set date to quandl format...if weekend, set to friday
      startDate = moment().format('YYYYMMDD')
      endDate = moment().subtract(3, 'y').format('YYYYMMDD')

      var tickers = []
      var list = getStocklist()
      for(key in list){
        tickers.push(key)
      }
      if(tickers.length===0){
        return resolve({list: tickers, data: []})
      }
      var joinedtickers = tickers.join(',')
      console.log('t:', joinedtickers)
      var url = 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?qopts.columns=ticker,date,close,adj_close&date.lte=' + startDate + '&date.gte=' + endDate + '&ticker=' + joinedtickers + '&api_key=' + process.env.QUANDL_KEY
      request.get(url, function(error, response, body){
        if(error || !body){
          reject(Error(error))
        } else {
          //console.log(body)
          var data = JSON.parse(body).datatable.data
          var d3Data = []
          //normalize quandl data into 1 object for each date
          for(var i=0; i<data.length; i++){
            d3Data.push({"ticker": data[i][0], "date": data[i][1], "price": data[i][2], "adj_price": data[i][3], color: list[data[i][0]].color})
          }
          resolve({list: tickers, data: d3Data})
        }

      }) //end request
    }) //end promise
  }

  /*********************************
  * Get stock prices for the most recent weekday
  *********************************/
  function loadAllTickers(){
    return new Promise( function(resolve, reject){
      //set date to quandl format...if weekend, set to friday
      var dateURL = 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES/metadata.json?api_key=' + process.env.QUANDL_KEY
      var date
      request.get(dateURL, function(error, response, body){
        if(error || !body){
          //set date to quandl format...if weekend, set to friday
          //TODO: handle holidays/market closure???
          if (moment().day() === 0 ){
            date = moment().day(-2).format('YYYYMMDD')
          } else if (moment().day() === 6 ){
            date = moment().day(-1).format('YYYYMMDD')
          } else {
            date = moment().format('YYYYMMDD')
          }
        } else {
          date = JSON.parse(body).datatable.status.refreshed_at.substr(0, 10)
          date = moment(date).format('YYYYMMDD')
        }
        var url = 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?qopts.columns=ticker,date&date=' + date + '&api_key=' + process.env.QUANDL_KEY
        request.get(url, function(error, response, body){
          console.log(body)
          if(error || !body){
            reject(Error(error))
          } else {
            var data = JSON.parse(body).datatable.data
            allTickers = data
          }
          console.log('tickers loaded')
          resolve({allTickers: data})
        }) //end request
      }) //end request
    }) //end promise
  }

  function getAllTickers(){
    return allTickers
  }

  return(
    {
      getStocklist: getStocklist,
      addStock: addStock,
      removeStock: removeStock,
      getStockPrices: getStockPrices,
      getChartData: getChartData,
      loadAllTickers: loadAllTickers,
      getAllTickers: getAllTickers

    }
  )
}()

module.exports = stockdata
