function lineChart(){
  // Variables that can be modified externally
  var data = [{ticker: '',
               date: '',
               price: 0.00
              }]
  var size = { width: 950,
               height: 400
            }
  var stocklist = []
  var colorpointer = 0;
  var updateData, updateSize, drawChart, hideToolTip, showToolTip, moveToolTip, chartHeight, chartWidth

  //selection is the element to contain the chart
  function chart(selection){

    console.log('calling chart')
    var title = 'Stock Prices'
    selection.each(function(){
      var formatTime = d3.timeFormat("%B %d, %Y")
      var mouse
      var margin={top: 80, right: 20, left: 90, bottom: 175}
      chartWidth = size.width - margin.left - margin.right
      chartHeight = size.height - margin.top - margin.bottom
      var useAdjustedPrices = false
      var title = "Stock Prices - " + (useAdjustedPrices ? "adjusted for splits" : "unadjusted for splits")
      var scaleX = d3.scaleTime()
                     .range([0, chartWidth])
                     .domain(d3.extent(data, function(d){return d.date}))
      var scaleY = d3.scaleLinear()
                     .range([chartHeight,0])
                     .domain(d3.extent(data, function(d){return useAdjustedPrices ? d.adj_price : d.price}))

      var elem = d3.select(this)
      var svg = elem.append('svg')
      var chartArea = svg.append('g')

      // Define the line function
      var priceline = d3.line()
          .x(function(d) { return scaleX(d.date); })
          .y(function(d) { return useAdjustedPrices ? scaleY(d.adj_price) : scaleY(d.price); });

      // Add the X Axis
      var xAxis = chartArea.append("g")
        .attr("class", "axis")
        .call(d3.axisBottom(scaleX))

      // var xLabel = chartArea.append("text")
      //   .attr("class", "axisLabel")
      //   .text("Date")

        xAxis.selectAll("text")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)" )

      // Add the Y Axis
      var yAxis = chartArea.append("g")
           .attr("class", "axis")
           .call(d3.axisLeft(scaleY));

      var yLabel = chartArea.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("dy","1em")
        .text("Closing Price ($USD)")

      var chartTitle = chartArea.append('text')
        .attr('class', 'chartTitle')

      var btn = chartArea.append('g')
        .attr("class", "button")

      btn.append("rect")
        .attr("width", "140px")
        .attr("height", "40px")
        .attr("x", 0 - margin.left +21)
        .attr("y", 0 - margin.top)
        .attr("rx", "5")
        .attr("ry", "5")
        .on("click", function(){
            d3.event.stopPropagation()
            useAdjustedPrices = !useAdjustedPrices
            title = "Stock Prices - " + (useAdjustedPrices ? "adjusted for splits" : "unadjusted for splits")
            drawChart()
        })
      btn.append("text")
        .attr("y", "-55")
        .text("Use Adjusted Prices")

      /********************************************************/
      /************* START OF TOOL TIP  *** *******************/
      /********************************************************/
      // append a g for all the mouse over nonsense
      var mouseG = svg.append("g")
        .attr("class", "mouse-over-effects")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      // this is the vertical line
      var mouseLine = mouseG.append("path")
        .attr("class", "mouse-line")

      var msLnTxt = mouseG.append('text')
        .attr("class", "mouse-line-text")
        .attr("y", 0 + margin.top/2)
        .attr("x", chartWidth/2)

      // keep a reference to all our lines
      var lines = document.getElementsByClassName('line');

      // rect to capture mouse movements
      var mouseEventHolder = mouseG.append('svg:rect')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', hideToolTip)
        .on('mouseover', showToolTip)
        .on('mousemove', moveToolTip);

        var tip = mouseG.append('g')
                  .attr("class", "tip")
        var tipRect = tip.append("rect")
                  .attr("class", "tiprect")
                  .attr("width", "85")
                  .attr("height","25")
                  .attr("rx", "5px")
                  .attr("ry", "5px")
        var tipText = tip.append("text")
                  .attr("class", "tiptext")
      /********************************************************/
      /************* END OF TOOL TIP        *******************/
      /********************************************************/
      drawChart = function(){

        svg.transition().duration(600)
            .attr('width', size.width)
            .attr('height', size.height)

        chartWidth = size.width - margin.left - margin.right
        chartHeight = size.height - margin.top - margin.bottom
        scaleX = d3.scaleTime()
                   .range([0, chartWidth])
                   .domain(d3.extent(data, function(d){return d.date}))
        scaleY = d3.scaleLinear()
                   .range([chartHeight,0])
                   .domain(d3.extent(data, function(d){return useAdjustedPrices ? d.adj_price : d.price}))

        xAxis = xAxis.call(d3.axisBottom(scaleX))
        yAxis = yAxis.call(d3.axisLeft(scaleY))
        btn.attr("transform", "translate(" + (chartWidth/2) + "," + "35)")

        mouseG.transition().duration(600)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        mouseEventHolder.transition().duration(600)
          .attr('width', chartWidth)
          .attr('height', chartHeight)
        msLnTxt.transition().duration(600)
          .attr("y", 0+margin.top/4)
        chartArea.transition().duration(600)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

        //here we nest the data on ticker; also set a key for object constancy
        //this stack overflow question showed me how to do transitions on nested data
        //http://stackoverflow.com/questions/20475382/d3-js-data-groups-and-transitions
        var nestedData = d3.nest()
            .key(function(d) {return d.ticker + '-' + d.color;})
            .entries(data)
        var update = chartArea.selectAll('path.line')
                      .data(nestedData, function(d){ return d.key})
        update.exit()
              .style('opacity',0)
              .remove()

        update.transition()
              .duration(600)
              .attr("d", function(d){return priceline(d.values)})

        update.enter()
              .append('path')
              .attr('class', 'line')
              .on('mouseout', hideToolTip)
              .on('mouseover', showToolTip)
              .transition().duration(600)
              .delay(function(d, i) { return (i) * 30; })
              .style("stroke", function(d,i){ return d.key.split('-')[1]})
              .attr("d", function(d){ return priceline(d.values)})
              .style('opacity',1)

        var legendSpace = chartWidth/nestedData.length;
        d3.selectAll('.legend').remove()
        nestedData.forEach(function(d,i) {

          chartArea.append("text")
            .attr("class", "legend")
            .attr("font-weight", "bold")
            .attr("x", (legendSpace/2)+i*legendSpace) // spacing
            .attr("y", chartHeight + margin.bottom/2 )
            .style("fill", function() { return d.key.split('-')[1]})
            .text(d.key.split('-')[0]);
        });

        yAxis.transition().duration(600)
             .call(d3.axisLeft(scaleY));
        xAxis.transition().duration(600)
             .attr("transform", "translate(0," + chartHeight + ")")
             .call(d3.axisBottom(scaleX))

        yLabel.transition().duration(600)
              .attr("x", 0-chartHeight/2)
              .attr("y", -margin.left+5)

        // xLabel.transition().duration(600)
        //       .attr("x", chartWidth/2)
        //       .attr("y", chartHeight + margin.bottom-90)

        chartTitle.transition().duration(600)
             .attr('x', chartWidth/2)
             .attr('y', 0-margin.top/1.5)
             .text(title)

       // here's a g for each circle and text on the line
       var mousePerLine = mouseG.selectAll('.mouse-per-line')
         .data(nestedData, function(d){ return d.key})

       mousePerLine.exit()
        .remove()
       mousePerLine.transition()
         .style("stroke", function(d) { return d.key.split('-')[1] })
         .style("fill", function(d) { return d.key.split('-')[1] })
       mousePerLine.enter()
         .append("g")
         .attr("class", "mouse-per-line")
         .append("circle")
         .attr("r", 5)
         .style("stroke", function(d) { return d.key.split('-')[1] })
         .style("fill", function(d) { return d.key.split('-')[1] })
         .on('mouseout', function(){
           hideToolTip()
           d3.selectAll('.mouse-per-line circle').attr("transform", "scale(1)")
           tip.transition()
               .duration(250)
               .style("opacity", 0);
           //tip.selectAll("text").remove()
         })
         .on('mouseover', function(d,i){

           showToolTip()
           d3.selectAll('.mouse-per-line circle').attr("transform", "scale(1.5)")

           //coordinate relative to container with transforms
           var mouseCoords = d3.mouse(d3.select('g.tip')._groups[0][0].parentElement);
           var xtrans = mouseCoords[0] < chartWidth/2 ? 5 : -90
           tip.attr("transform", "translate(" + (mouseCoords[0]+xtrans) + "," + (mouseCoords[1]-35) + ")");
           tipText.text( function(){return d.key.split('-')[0] + ": " + parseFloat(scaleY.invert(mouseCoords[1]) * 100 / 100).toFixed(2)})
            .attr("dy", "1.6em")
            .attr("dx", "4px")
           tip.transition().duration(250)
             .style("opacity", 1)
           })

      } //end of draw chart

      function hideToolTip(){ // on mouse out hide line, circles and text
          d3.event.stopPropagation();
          d3.select(".mouse-line")
            .style("opacity", "0");
          d3.selectAll(".mouse-per-line circle")
            .style("opacity", "0");
          d3.selectAll(".mouse-per-line text")
            .style("opacity", "0");
          d3.selectAll('.mouse-line-text')
            .style("opacity", "0")
      }
      function showToolTip() { // on mouse in show line, circles and text
        d3.event.stopPropagation();
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
        d3.selectAll('.mouse-line-text')
          .style("opacity", "1")
      }
      function moveToolTip() { // mouse moving over canvas
        d3.event.stopPropagation();
        mouse = d3.mouse(this);

        // move the vertical line
        d3.selectAll(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + chartHeight;
            d += " " + mouse[0] + "," + 0;
            return d;
          })
        // update the texxt
        msLnTxt.attr("x", function(){
          if(mouse[0]<chartWidth/2){
            return mouse[0]+10
          } else {
            return mouse[0]-150
          }
        })
          .text( function(){
            return formatTime( scaleX.invert(mouse[0]) )
          })

        // position the circle and text
        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {
            var y = findYatXbyBisection(mouse[0], lines[i], .01)
            return "translate(" + mouse[0] + "," + y +")";
          })
      }
    })
  }

// Function from StackOverflow to find the Y position given X on a line
// http://stackoverflow.com/questions/11503151/in-d3-how-to-get-the-interpolated-line-data-from-a-svg-line
function findYatXbyBisection(x, path, error){
    var length_end = path.getTotalLength()
      , length_start = 0
      , point = path.getPointAtLength((length_end + length_start) / 2) // get the middle point
      , bisection_iterations_max = 50
      , bisection_iterations = 0

    error = error || 0.01

    while (x < point.x - error || x > point.x + error) {
      // get the middle point
      point = path.getPointAtLength((length_end + length_start) / 2)

      if (x < point.x) {
        length_end = (length_start + length_end)/2
      } else {
        length_start = (length_start + length_end)/2
      }

      // Increase iteration
      if(bisection_iterations_max < ++bisection_iterations) break;
    }
    return point.y
  }

  chart.size = function(value){
    if(!arguments.length) return size
    size = value
    return chart
  }

  chart.data = function(value){
    if(!arguments.length) return data
    data = value
    return chart
  }

  chart.stocklist = function(value){
    if(!arguments.length) return stocklist
    stocklist = value
    return chart
  }
  chart.draw = function(){
    if(typeof drawChart === 'function') drawChart()
  }

  return chart
}
