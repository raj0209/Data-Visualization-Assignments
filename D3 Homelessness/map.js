//setting up global variables related to states

var activeState = "United States";  //refers to state on which mouse is hovered
var activeStateIndex = 51;  //corresponding index of a state (from states array) which is hovered on

var states=["Alabama","Alaska","Arkansas",
"Arizona","California",
"Colorado","Connecticut","Dist. Of Columbia","Delaware","Florida","Georgia","Hawaii","Iowa","Idaho","Illinois","Indiana","Kansas","Kentucky",
"Louisiana","Massachusetts","Maryland","Maine","Michigan","Minnesota","Missouri","Mississippi","Montana","North Carolina","North Dakota","Nebraska",
"New Hampshire","New Jersey","New Mexico","Nevada","New York","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
"Tennessee","Texas","Utah","Virginia","Vermont","Washington","Wisconsin","West Virginia","Wyoming","United States"];

//setting up margin for line chart
var margin = {top: 30, right: 30, bottom: 40, left: 30},
    width_chart = 600 - margin.left - margin.right,
    height_chart = 500 - margin.top - margin.bottom;

//setting up format of x & y axis of line chart
var format_percentage = d3.format("+.0%"),
    format_percentage_change = function(x) { return format_percentage(x - 1); },
    parse_date = d3.time.format("%d-%b-%y").parse;
    
//setting up x & y axis variables
var x = d3.time.scale()
    .range([0, width_chart]);

var y = d3.scale.log()
    .range([height_chart, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-width_chart, 0)
    .tickFormat(format_percentage_change);

//setting up line chart variables
var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.ratio); });

var chart = d3.select("#line").append("svg")
    .attr("width", width_chart + margin.left + margin.right)
    .attr("height", height_chart + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var gX = chart.append("g")
              .attr("class", "axis axis--x")
              .attr("transform", "translate(0," + height_chart + ")");

var gY = chart.append("g")
              .attr("class", "axis axis--y");

gY.append("text")
  .attr("class", "axis-title")
  .attr("y", 12)
  .attr("dx","18em")
  .attr("dy", "-1.5em")
  .text("% Change in Homelessness in " + activeState);

//retreiving data for line chart
d3.csv("YearWiseHomeless.csv", function(error, data2) {
    if (error) throw error;
    var prevValue = +data2[0+(activeStateIndex*10)].homeless;
    for(var i=0;i<10;i++){
        data2[i].date = parse_date(data2[i+(activeStateIndex*10)].date);
        data2[i].ratio = data2[i+(activeStateIndex*10)].homeless / prevValue;
        prevValue=data2[i+(activeStateIndex*10)].homeless;  
    }
    x.domain(d3.extent(data2, function(d) { return d.date; }));
    y.domain(d3.extent(data2, function(d) { return d.ratio; }));


    yAxis.tickValues(d3.scale.linear()
         .domain(y.domain())
         .ticks(20));

    gX.call(xAxis);

    gY.call(yAxis)
      .selectAll(".tick")
      .classed("tick--one", function(d) { return Math.abs(d - 1) < 1e-6; });

    chart.append("path")
        .datum(data2)
        .attr("class", "line")
        .attr("d", line);
});

//loading the data for maps
d3.csv("mapsData.csv", function(err, data) {

    //setting up default values and color saturation for maps
    var map_config = {"color1":"#ccccff","color2":"#00004d","stateDataColumn":"state","defaultValue":"Homeless Population","state":"state"};
    var width = 800, height = 600;
    var color_count = 15;
    var scale = 0.8;

    //defining color saturation
    function Interpolate(start, end, steps, count) {
        var s = start,
        e = end,
        final = s + (((e - s) / steps) * count);
        return Math.floor(final);
    }

    function Color(_r, _g, _b) {
        var r, g, b;
        var setColors = function(_r, _g, _b) {
            r = _r;
            g = _g;
            b = _b;
        };

        setColors(_r, _g, _b);
        this.getColors = function() {
            var colors = {
                r: r,
                g: g,
                b: b
            };
            return colors;
        };
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    //setting up fields for maps
    var ctr;
    var fields = Object.keys(data[0]);
    var option_select = d3.select('#map_selector').append("select")
                          .attr("class", "option-select");

    for (var i = 0; i < fields.length; i++) {
        if (fields[i] !== map_config.state) {
            var opt = option_select.append("option")
                                   .attr("value", fields[i])
                                   .text(fields[i]);

            if (fields[i] === map_config.defaultValue) {
                opt.attr("selected", "true");
            }
        }
    }

    //setting up color range for fields
    var color_first = map_config.color1, color_last = map_config.color2;

    var rgb = hexToRgb(color_first);

    var color_start = new Color(rgb.r, rgb.g, rgb.b);

    rgb = hexToRgb(color_last);

    var color_end = new Color(rgb.r, rgb.g, rgb.b);
  
    var startColors = color_start.getColors(),
    endColors = color_end.getColors();

    var colors = [];

    for (var i = 0; i < color_count; i++) {
        var r = Interpolate(startColors.r, endColors.r, color_count, i);
        var g = Interpolate(startColors.g, endColors.g, color_count, i);
        var b = Interpolate(startColors.b, endColors.b, color_count, i);
        colors.push(new Color(r, g, b));
    }

    var quantize = d3.scale.quantize()
                           .domain([0, 1])
                           .range(d3.range(color_count).map(function(i) { return i }));

    //setting up variables for map
    var path = d3.geo.path();

    var svg = d3.select("#map").append("svg")
                .attr("width", width)
                .attr("height", height);

    d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
    d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {

    var name_id_map = {};
    var id_name_map = {};

    for (var i = 0; i < names.length; i++) {
      name_id_map[names[i].name] = names[i].id;
      id_name_map[names[i].id] = names[i].name;
    }

    var dataMap = {};

    data.forEach(function(d) {
        if (!dataMap[d[map_config.state]]) {
            dataMap[d[map_config.state]] = {};
    }

    for (var i = 0; i < Object.keys(data[0]).length; i++) {
        if (Object.keys(data[0])[i] !== map_config.state) {
            dataMap[d[map_config.state]][Object.keys(data[0])[i]] =+d[Object.keys(data[0])[i]];
        }
    }
    });

    function drawMap(dataColumn) {
        var valueById = d3.map();
        data.forEach(function(d) {
            var id = name_id_map[d[map_config.state]];
            valueById.set(id, +d[dataColumn]);
        });

    quantize.domain([0,d3.max(data, function(d){ return +d[dataColumn] })]);

    //ctr for which map is selected. 1 = raw data, 2 = per capita
    if($("#map_selector").find(".option-select").val()==="Homeless Population Per Capita")
        ctr=2;
    else
        ctr=1;
        svg.append("g")
           .attr("class", "states-choropleth")
           .selectAll("path")
           .data(topojson.feature(us, us.objects.states).features)
           .enter().append("path")
           .attr("transform", "scale(" + scale + ")")
           .style("fill", function(d) {
           if (valueById.get(d.id)) {
                var i = quantize(valueById.get(d.id));
                var color = colors[i].getColors();
                return "rgb(" + color.r + "," + color.g + "," + color.b + ")";
           } 
           else {
              return "";
           }
          })
          .attr("d", path)
          //implementing hover functionality for states
          .on("mousemove", function(d) {
              activeState = id_name_map[d.id];

                  for(var a=0;a<states.length;a++){
                    if(states[a]==activeState){
                        activeStateIndex=a;
                     }
                }

              //setting up content of tooltip
              var description = "";

              description += "<div class=\"tooltip_kv\">";
              description += "<span class=\"tooltip_format\">";
              description += id_name_map[d.id];
              description += "</span>";
              description += "</div>";
              description += "<div class=\"tooltip_kv\">";
              description += "<span class='tooltip_format'>";
              description += Object.keys(data[0])[ctr];
              description += "</span>";
              description += "<span class=\"tooltip_value\">";
              description += dataMap[id_name_map[d.id]][Object.keys(data[0])[ctr]];
              if(ctr==2)
                description+="%";
              description += "";
              description += "</span>";
              description += "</div>";


              $("#tooltip-container").html(description);
              $(this).attr("fill-opacity", "0.7");
              $("#tooltip-container").show();

              var coordinates = d3.mouse(this);

              var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;

              if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX + 15) + "px");
              } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
              }
              
            })
            .on("mouseout", function() {
                  $(this).attr("fill-opacity", "1.0");
                  $("#tooltip-container").hide();
              })
            //implementing on click functionality for states
            .on("click",function(){
                chart.selectAll("*").remove();

                //drawing line chart for the clicked state
                var gX = chart.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height_chart + ")");

                var gY = chart.append("g")
                    .attr("class", "axis axis--y");

                gY.append("text")
                    .attr("class", "axis-title")
                    .attr("y", 12)
                    .attr("dx","18em")
                    .attr("dy", "-1.5em")
                    .text("% Change in Homelessness in " + activeState);

                //retreiving data for line chart
                d3.csv("YearWiseHomeless.csv", function(error, data2) {
                    if (error) throw error;
                    var prevValue = +data2[0+(activeStateIndex*10)].homeless;
                    for(var i=0;i<10;i++){
                        data2[i].date = parse_date(data2[i+(activeStateIndex*10)].date);
                        data2[i].ratio = data2[i+(activeStateIndex*10)].homeless / prevValue;
                        prevValue=data2[i+(activeStateIndex*10)].homeless;  
                    }
                    x.domain(d3.extent(data2, function(d) { return d.date; }));
                    y.domain(d3.extent(data2, function(d) { return d.ratio; }));


                    yAxis.tickValues(d3.scale.linear()
                      .domain(y.domain())
                      .ticks(20));

                    gX.call(xAxis);

                    gY.call(yAxis)
                      .selectAll(".tick")
                      .classed("tick--one", function(d) { return Math.abs(d - 1) < 1e-6; });

                    chart.append("path")
                        .datum(data2)
                        .attr("class", "line")
                        .attr("d", line);

                    });
                });

    svg.append("path")
       .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
       .attr("class", "states")
       .attr("transform", "scale(" + scale + ")")
       .attr("d", path);
    }
    //toggling between two maps
    drawMap(map_config.defaultValue);
    option_select.on("change", function() {
        drawMap($("#map_selector").find(".option-select").val());
    });
    
  });
  });
});