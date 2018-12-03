    //setting up the margin
    var margin = {top: 20, right: 0, bottom: 50, left: 50},
        width1 = 800 - margin.left - margin.right,
        height1 = 500 - margin.top - margin.bottom;

    
    var winners = [];                //global variable for storing all the champions of Aus Open
    var years = [];                  //global variable for storing all the years
    var uniqueWinners = [];          //global variable that stores unique names of the champions
    var activeYear;                  //to store the corresponding year to the selected point during hovering

    //svg for scatter plot
    var chart1 = d3.select("#scatter").append("svg")
                   .attr("width", width1 + margin.left + margin.right)
                   .attr("height", height1 + margin.top + margin.bottom)
                   .append("g")
                   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //tooltip for scatter plot
    var tooltip = d3.select("#scatter").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

    //retrieving the relevant data from the dataset
    d3.csv("10yearAUSOpenMatches.csv", function(data) {

      //converting year into integer value
      data.forEach(function(dw) {
        dw.year = +dw.year;
      });

      //retrieving all the years available in the dataset & sorting them 
      for (var i=0,j=0; i < data.length; i++) {
        if(data[i].round=="Final"){
            years[j] = data[i].year;
            j++;
        }
      }
      years.sort(d3.ascending);

      //retrieving winners of final for each year
      for(var j=0;j<years.length;j++){
        for (var i=0; i < data.length; i++) {
            if((data[i].round=="Final") && (data[i].year==years[j])){
                winners[j] = data[i].winner;
                    break;
            }
        }
      }

      //idetifying the unique champions in order to plot them on x-axis
      var flag = false;
      var ctr = 0;
      for(var i=0;i<winners.length;i++,flag=false){
        for(var j=0;j<uniqueWinners.length;j++){
            if(winners[i]==uniqueWinners[j]){
                flag=true;
            }
        }
        if(flag==false){
            uniqueWinners[ctr]=winners[i];
            ctr++;
        }
      }


      //setting up variables related to x-axis
      var xsValue = function(d){ return winners}, 
      xsScale = d3.scale.ordinal().domain(winners).rangeRoundBands([57, width1-50],0.1), 
      xsMap = function(d) { return xsScale(xsValue(d));}, 
      xsAxis = d3.svg.axis().scale(xsScale).orient("bottom");
      xsScale.domain(uniqueWinners);


      //setting up variables related to y-axis
      var ysValue = function(d){ return d.years}, 
      ysScale = d3.scale.linear().range([height1, 0]), 
      ysMap = function(d) { return ysScale(ysValue(d));}, 
      ysAxis = d3.svg.axis().scale(ysScale).orient("left");
      ysScale.domain([d3.min(years)-1, d3.max(years)+1]);


      //setting up x-axis  
      chart1.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(-57," + height1 + ")")
          .call(xsAxis)
          .append("text")
          .attr("class", "label")
          .attr("x", width1-375)
          .attr("y", +45)
          .style("text-anchor", "end")
          .text("Players");

      //setting up y-axis
      chart1.append("g")
          .attr("class", "y axis")
          .call(ysAxis)
          .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.7em")
          .style("text-anchor", "end")
          .text("Year");

      var color = ["crimson","steelblue","crimson","crimson","green","darkorange","crimson","green","green","green","MediumOrchid"];

      //plotting the scatter points & adding the hovering effect
      chart1.selectAll("circle")
            .data(winners)
            .enter().append("circle")
            .attr("class", "bar")
            .attr("r", 9)
            .attr("cx", function(d,i) {return xsScale(winners[i]);})
            .attr("cy", function(d,i) {return ysScale(years[i]);})
            .style("fill", function(d,i) { return color[i];})
            .on("mouseover", function(d,i) {
                activeYear = years[i];
                tooltip.transition()
                       .duration(200)
                       .style("opacity", 3);
                tooltip.html((winners[i]+ ", " + years[i]))
                       .style("left", (d3.event.pageX + 5) + "px")
                       .style("top", (d3.event.pageY - 28) + "px");
                chart2.selectAll("rect")
                      .style("fill",function(d,i) {
                          if (years[i] == activeYear) {
                            return "brown";
                          }
                          else{
                            return "steelblue";
                          }
                      });
            })
            .on("mouseout", function(dw) {
            tooltip.transition()
                   .duration(500)
                   .style("opacity", 0);
            chart2.selectAll("rect").style("fill", "steelblue");
            chart2.selectAll("rect").attr("class", "bars");
            }
            );
       });
