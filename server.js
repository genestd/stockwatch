'use strict';
require('dotenv').config()
var path = require('path')
var bodyParser = require('body-parser');
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var stockdata = require(__dirname + '/server/models/stockdata.js')
//prime ticker list:
stockdata.loadAllTickers()
  .then(result=>{
    //do nothing
  })
  .catch(error=>{
    console.log(error)
  })
/*********************************
* MIDDLEWARE
*********************************/
app.use(express.static(__dirname + '/server/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*********************************
* ROUTES
*********************************/
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/server/views/index.html');
});
app.get('/chartdata', function(req,res){
  stockdata.getChartData()
    .then( result=>{
      res.json(result)
    })
    .catch( error => {
      console.log(error)
    })
})
app.post('/add', function(req,res){

  stockdata.addStock(req.body.ticker)
  var atk = stockdata.getAllTickers()
  if( atk.length > 0){
    //do nothing
  } else {
    stockdata.loadAlltick
  }
  Promise.all( [stockdata.getStockPrices(), stockdata.getChartData()])
    .then( results => {
      io.emit('tickerUpdate', { tickerInfo: results[0].prices,
                                     timestamp: results[0].timestamp,
                                     stocklist: stockdata.getStocklist(),
                                     allTickers: stockdata.getAllTickers()
                                   })
       io.emit('chartUpdate', { chartdata: results[1].data
                              })
       res.status(200).send()
    })
    .catch( error => {
      console.log(error)
    })

})

app.post('/remove', function(req, res){
  stockdata.removeStock(req.body.ticker)
  Promise.all( [stockdata.getStockPrices(), stockdata.getChartData()])
    .then( results =>{
      console.log('promises resolved')
      io.emit('tickerUpdate', { tickerInfo: results[0].prices,
                                timestamp: results[0].timestamp,
                                stocklist: stockdata.getStocklist(),
                                allTickers: stockdata.getAllTickers()
                              })
      io.emit('chartUpdate', { chartdata: results[1].data
                              })
      res.status(200).send()
    })
    .catch( error =>{
      console.log(error)
    })
})
/*********************************
* WEB SOCKETS
*********************************/
io.on('connection', function(socket) {
    stockdata.getStockPrices()
      .then( result => {
        socket.emit('tickerUpdate', { tickerInfo: result.prices,
                                       timestamp: result.timestamp,
                                       stocklist: stockdata.getStocklist(),
                                       allTickers: stockdata.getAllTickers()
                                     }
        )
      })

    socket.on('disconnect', function() {
      }
    );
});

/*********************************
* SERVER STARTUP
*********************************/
server.listen(8080, function(){
  console.log('express listening on port 8080')
});
