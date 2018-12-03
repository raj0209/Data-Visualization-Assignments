    //setting up the margin
    var margin = {top: 20, right: 10, bottom: 50, left: 40},
        width2 = 600 - margin.left - margin.right,
        height2 = 500 - margin.top - margin.bottom;



    var aces = []; //global variable to store number of aces

    //svg for bar chart
    var chart2 = d3.select("#bar").append("svg")
        .attr("width", width2 + margin.left + margin.right)
        .attr("height", height2 + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");


    //retrieving the relevant data from the datase
    d3.csv("10yearAUSOpenMatches.csv", function(data) {

        //converting number of aces into integer value
        data.forEach(function(da) {
            da.ace1 = +da.ace1;
        });

        //retrieving number of aces scored by champion in the tournament that he won
        var currentYear;        
        var currentWinner;
        var sum = 0;
        for (var i=0,j=0; i < years.length; i++,sum=0) {
            currentYear = years[i];
            currentWinner = winners[i];
            for(var j=0;j<data.length;j++){ 
                if((data[j].year == currentYear) && (data[j].winner == currentWinner)){
                    sum = sum + data[j].ace1;
                }
            }
            aces[i]=sum;
     }

    //setting up x & y variables 
    var xaScale = d3.scale.ordinal().rangeRoundBands([0, width2], 0.1);
    var yaScale = d3.scale.linear().range([height2, 0]);

    var xaAxis = d3.svg.axis()
        .scale(xaScale)
        .orient("bottom")
        .ticks(10);

    var yaAxis = d3.svg.axis()
        .scale(yaScale)
        .orient("left")
        .ticks(10);
      xaScale.domain(years);
      yaScale.domain([0, d3.max(aces)+10]);

      //setting up x-axis  
      chart2.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xaAxis)
          .append("text")
          .attr("class", "label")
          .attr("x", width2-200)
          .attr("y", +50)
          .style("text-anchor", "end")
          .text("Year");

      //setting up y-axis  
      chart2.append("g")
          .attr("class", "y axis")
          .call(yaAxis)
          .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 10)
          .attr("dy", "-3.4em")
          .style("text-anchor", "end")
          .text("Total Aces");

      //plotting the bars
      chart2.selectAll("rect")
          .data(aces)
          .enter().append("rect")
          .attr("class","bars")
          .attr("x", function(da,i) { return xaScale(years[i]); })
          .attr("width", xaScale.rangeBand())
          .attr("y", function(da,i) { return yaScale(aces[i]); })
          .attr("height", function(da,i) { return height2 - yaScale(aces[i]); });
          
    });

