let data = null;
let currentScene = null;
let initialLoad = true;

function resetFilter(event) {

 var clickedElement = event.target;
 if (!clickedElement.closest("rect")) {
     if (currentScene == "s1") {
         // Clear the visualization
         d3.select("#visualization").html("");
         // Draw Scene 1
         drawScene1(null);
     }
 }

}

// Load the data
d3.csv("data/tess_confirmed_plannets.csv").then(function(myData) {
 data = myData;

 // Scene 1: Overview
 drawScene1(null);
});

function drawScene1(filteredData) {

 // set the current scene
 currentScene = "s1";

 // contorl filtered data
 if (!filteredData) {
     filteredData = data;
 }

 var filteredYear = filteredData.length < data.length ? filteredData[0].disc_year : null;

 // control animation logic
 var animate = initialLoad;
 initialLoad = false;

 // Count discoveries per year
 var discoveriesPerYear = d3.rollup(data, v => v.length, d => d.disc_year);
 var countedData = Array.from(discoveriesPerYear, ([year, count]) => ({
     year,
     count
 }));

 // Sort data by discovery year
 data.sort((a, b) => a.disc_year - b.disc_year);
countedData.sort((a, b) => a.year - b.year );


 // Prepare color scale
 var colorScale = d3.scaleSequential()
     .domain([2018, 2023])
     .interpolator(d3.interpolateOranges);

 // Create SVG for the visualization
 var svg = d3.select("#visualization").append("svg")
     .attr("width", 1200)
     .attr("height", 950);

 // reset the filter
 svg.on("click", resetFilter);

 // Histogram
 var histogramWidth = 400;
 var histogramHeight = 300;

 var x = d3.scaleBand()
     .domain(data.map(d => d.disc_year))
     .range([0, histogramWidth])
     .padding(0.1);

 var y = d3.scaleLinear()
     .domain([0, d3.max(countedData, d => +d.count)])
     .range([histogramHeight, 0]);

 var histogram = svg.append("g")
     .attr("transform", "translate(50, 50)");

 var rect = histogram.selectAll("rect")
     .data(countedData)
     .enter()
     .append("rect")
     .attr("x", d => x(d.year))
     .attr("width", x.bandwidth())
     .attr("y", d => y(0) )
     .attr("height", d => 0)
     .attr("fill", d => colorScale(d.year))
     .classed("unfocused", d => d.year !== filteredYear && filteredYear != null)
     .on("mouseover", function(event, d) {
         tooltip.transition()
             .duration(200)
             .style("opacity", .9);
         tooltip.html("Year: " + d.disc_year + "<br/>Number of Exoplanets: " + d.count)
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
     }).on("click", function(event, d) {

         // clean the tool tip
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
         // Filter the data based on the selected year
         filteredData = data.filter(p => p.disc_year === d.year);

         // Clear the visualization
         d3.select("#visualization").html("");

         // Draw the updated charts
         drawScene1(filteredData);
     });

 // Animate the bar drawing
 if (animate) {
    rect.transition()
    .duration(1000)
    .delay((d, i) => 400 * (d.year - 2018))
    .attr("y", d => y(d.count))
    .attr("height", d => histogramHeight - y(d.count))
} else {
    rect.attr("y", d => y(d.count))
        .attr("height", d => histogramHeight - y(d.count))
}

 histogram.append("g")
     .attr("transform", "translate(0, " + histogramHeight + ")")
     .call(d3.axisBottom(x))
     .selectAll("text")
     .attr("transform", "rotate(-45)")
     .style("text-anchor", "end");

 histogram.append("g")
     .call(d3.axisLeft(y));

 histogram.append("text")
     .attr("x", histogramWidth / 2)
     .attr("y", histogramHeight + 50)
     .text("Discovery Year")
     .style("text-anchor", "middle");

 histogram.append("text")
     .attr("x", -histogramHeight / 2)
     .attr("y", -30)
     .text("Number of Exoplanets")
     .style("text-anchor", "middle")
     .attr("transform", "rotate(-90)");

 histogram.append("text")
     .attr("x", histogramWidth / 2)
     .attr("y", -30)
     .text("Histogram of Exoplanet Discoveries by Year")
     .style("text-anchor", "middle")
     .style("font-size", "20px");



 // Scatter plot 1
 var scatterWidth = 400;
 var scatterHeight = 300;

 var xScatter = d3.scaleLinear()
     .domain([d3.min(data, d => +d.pl_eqt), d3.max(data, d => +d.pl_eqt)])
     .range([0, scatterWidth]);

 var yScatter = d3.scaleLinear()
     .domain([d3.min(data, d => +d.pl_orbeccen), d3.max(data, d => +d.pl_orbeccen)])
     .range([scatterHeight, 0]);

 var scatter = svg.append("g")
     .attr("transform", "translate(" + (histogramWidth + 200) + ", 50)");

  var circles1 =scatter.selectAll("circle")
     .data(filteredData)
     .enter().append("circle")
     .attr("cx", d => xScatter(d.pl_eqt))
     .attr("cy", d => yScatter(d.pl_orbeccen))
     .attr("r", 0)
     .attr("fill", (d) => colorScale(d.disc_year))
     .attr("stroke", (d) => {
         if (d.pl_eqt >= 273.15 && d.pl_eqt <= 373.15 && d.pl_orbeccen >= 0 && d.pl_orbeccen <= 0.2) {
             return "black";
         } else {
             return null;
         }
     })
     .attr("stroke-width", (d) => {
         if (d.pl_eqt >= 273.15 && d.pl_eqt <= 373.15 && d.pl_orbeccen >= 0 && d.pl_orbeccen <= 0.2) {
             return 1.5;
         } else {
             return 0;
         }
     })
     .on("mouseover", function(event, d) {
         tooltip.transition()
             .duration(200)
             .style("opacity", .9);
         tooltip.html("Palent Name: " + d.pl_name + "<br/>Equilibrium Tempe.: " + d.pl_eqt + "<br/>Orbital Eccentricity: " + d.pl_orbeccen + "<br/>Distance (pc): " + d.sy_dist)
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
     })
     .on("click", function(event, d) {
         // clean the tool tip
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
         // Clear the visualization
         d3.select("#visualization").html("");
         // Draw Scene 2
         drawScene2(d);
     });

// Animation the circles
if (animate) {
     circles1.transition()
         .duration(1000)
         .delay((d, i) => 500 * (Number(d.disc_year) - 2018))
         .attr("r", 5);
 } else {
     circles1.attr("r", 5);
 }

 scatter.append("g")
     .attr("transform", "translate(0, " + scatterHeight + ")")
     .call(d3.axisBottom(xScatter));

 scatter.append("g")
     .call(d3.axisLeft(yScatter));

 scatter.append("text")
     .attr("x", scatterWidth / 2)
     .attr("y", scatterHeight + 50)
     .text("Equilibrium Temperature")
     .style("text-anchor", "middle");

 scatter.append("text")
     .attr("x", -scatterHeight / 2)
     .attr("y", -30)
     .text("Orbital Eccentricity")
     .style("text-anchor", "middle")
     .attr("transform", "rotate(-90)");

 scatter.append("text")
     .attr("x", scatterWidth / 2)
     .attr("y", -30)
     .text("Orbital Eccentricity vs Equilibrium Temp")
     .style("text-anchor", "middle")
     .style("font-size", "20px");

 // Annotations for Stellar 1
 var annotations = [{
     note: {
         label: "Potential Habitable Zone",
         align: "left"
     },
     x: xScatter(350), // Adjusted x position for annotation
     y: yScatter(0.05), // Adjusted y position for annotation
     dx: 200,
     dy: -50,
     subject: {
         radius: 30
     },
     type: d3.annotationCalloutCircle
 }];

 var makeAnnotations = d3.annotation()
     .annotations(annotations);

 scatter.append("g")
     .attr("class", "annotation-group")
     .call(makeAnnotations);

 // Scatter plot 2: Stellar Mass vs Radius
 var scatter2Y = 530;  // Y offset
 var scatter2Width = 800;
 var scatter2Height = 300;

 var xScatter2 = d3.scaleLinear()
     .domain([d3.min(data, d => +d.st_mass), d3.max(data, d => +d.st_mass)])
     .range([0, scatter2Width]);

 var yScatter2 = d3.scaleLinear()
     .domain([d3.min(data, d => +d.st_rad), d3.max(data, d => +d.st_rad)])
     .range([scatter2Height, 0]);

 var scatter2 = svg.append("g")
     .attr("transform", "translate(" + (histogramWidth / 2) + ", " + scatter2Y + ")");

 var circles2 = scatter2.selectAll("circle")
     .data(filteredData)
     .enter().append("circle")
     .attr("cx", d => xScatter2(d.st_mass))
     .attr("cy", d => yScatter2(d.st_rad))
     .attr("r", 0)
     .attr("fill", (d) => colorScale(d.disc_year))
     .attr("stroke", (d) => {
         if (d.st_mass >= 0.8 && d.st_mass <= 1.2 && d.st_rad >= 0.8 && d.st_rad <= 1.2) {
             // condition for earth similar stars
             return "black";
         } else {
             return null;
         }
     })
     .attr("stroke-width", (d) => {
         if (d.st_mass >= 0.8 && d.st_mass <= 1.2 && d.st_rad >= 0.8 && d.st_rad <= 1.2) {
             return 1.5;
         } else {
             return 0;
         }
     })
     .on("mouseover", function(event, d) {
         tooltip.transition()
             .duration(200)
             .style("opacity", .9);
         tooltip.html("Palent Name: " + d.pl_name + "<br/>Stellar Mass: " + d.st_mass + "<br/>Stellar Radius: " + d.st_rad + d.pl_orbeccen + "<br/>Distance (pc): " + d.sy_dist)
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
     })
     .on("click", function(event, d) {
         // clean the tool tip
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
         // Clear the visualization
         d3.select("#visualization").html("");
         // Draw Scene 2
         drawScene2(d);
     });

 // Animation the circles
if (animate) {
     circles2.transition()
         .duration(1000)
         .delay((d, i) => 500 * (Number(d.disc_year) - 2018))
         .attr("r", 5);
 } else {
     circles2.attr("r", 5);
 }

 scatter2.append("g")
     .attr("transform", "translate(0, " + scatter2Height + ")")
     .call(d3.axisBottom(xScatter2));

 scatter2.append("g")
     .call(d3.axisLeft(yScatter2));

 scatter2.append("text")
     .attr("x", scatter2Width / 2)
     .attr("y", scatter2Height + 40)
     .text("Stellar Mass")
     .style("text-anchor", "middle");

 scatter2.append("text")
     .attr("x", -scatter2Height / 2)
     .attr("y", -30)
     .text("Stellar Radius")
     .style("text-anchor", "middle")
     .attr("transform", "rotate(-90)");

 scatter2.append("text")
     .attr("x", scatter2Width / 2)
     .attr("y", -30)
     .text("Host Start - Stellar Radius vs Stellar Mass")
     .style("text-anchor", "middle")
     .style("font-size", "20px");

 // Annotation for Scatter 2
 var annotations2 = [{
     note: {
         label: "Potential Habitable Zone",
         align: "left"
     },
     x: xScatter2(1), // Adjusted x position for annotation for stellar mass
     y: yScatter2(1), // Adjusted y position for annotation for stellar radius
     dx: -200,
     dy: -50,
     subject: {
         radius: 40
     },
     type: d3.annotationCalloutCircle
 }];

 var makeAnnotations2 = d3.annotation()
     .annotations(annotations2);

 scatter2.append("g")
     .attr("class", "annotation-group")
     .call(makeAnnotations2);

 // Legend
 var legend = svg.append("g")
     .attr("class", "legend")
     .attr("transform", "translate(1400, 50)");

 var legendData = Array.from(new Set(data.map(d => d.disc_year)));

 var legendItem = legend.selectAll(".legend-item")
     .data(legendData)
     .enter().append("g")
     .attr("class", "legend-item")
     .attr("transform", (d, i) => "translate(0, " + (i * 20) + ")");

 legendItem.append("circle")
     .attr("cx", 5)
     .attr("cy", 5)
     .attr("r", 5)
     .attr("fill", colorScale);

 legendItem.append("text")
     .attr("x", 15)
     .attr("y", 5)
     .attr("dy", "0.35em")
     .text(d => d);

 legend.attr("transform", "translate(" + (histogramWidth + 700) + ", 50)");



 // Tooltip
 var tooltip = d3.select("body").append("div")
     .attr("class", "tooltip")
     .style("opacity", 0);


 // Add button to go to Scene 3
   svg.append("text")
       .attr("x", 10)
       .attr("y", 920) // adjust accordingly
       .text("Explore Interactive Dashboard")
       .attr("class", "scene3-button")
       .on("click", function() {
           currentScene = "s3";
           // clean the tool tip
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
         // Clear the visualization
         d3.select("#visualization").html("");
           // Draw Scene 3
           drawScene3();
       });

   // Make the button look like a real button
   svg.selectAll(".scene3-button")
       .style("cursor", "pointer")
       .style("fill", "steelblue")
       .style("text-decoration", "underline");
 
}

function drawScene2(planet) {
 // set the current scene
 currentScene = "s2";

 // Comparison data
 var comparisonData = [{
         parameter: 'Equilibrium Temperature',
         earth: {
             min: 273.15,
             max: 373.15
         },
         planet: +planet.pl_eqt
     },
     {
         parameter: 'Orbital Semi-Major Axis (AU)',
         earth: {
             min: 0.9,
             max: 1.5
         },
         planet: +planet.pl_orbsmax
     },
     {
         parameter: 'Planet Radius (Jupiter Radii)',
         earth: {
             min: 0.0892,
             max: 0.1427
         },
         planet: +planet.pl_radj
     },
     {
         parameter: 'Orbital Eccentricity',
         earth: {
             min: 0,
             max: 0.2
         },
         planet: +planet.pl_orbeccen
     },
     {
         parameter: 'Stellar Radius (Solar Rad.)',
         earth: {
             min: 1,
             max: 1
         },
         planet: +planet.st_rad
     },
     {
         parameter: 'Stellar Mass (Solar Mass)',
         earth: {
             min: 1,
             max: 1
         },
         planet: +planet.st_mass
     }
 ];

 // Create SVG for the visualization
 var svg = d3.select("#visualization").append("svg")
     .attr("width", 800)
     .attr("height", 680);

 var barHeight = 20;
 var barMaxWidth = 200;
 var barScale = d3.scaleLinear().range([0, barMaxWidth]);

 comparisonData.forEach(function(row, i) {
     // Define the scale for the parameter
     var scaleMax = Math.max(row.earth.max, row.planet, row.earth.min)
     barScale.domain([0, scaleMax]);

     var yPos = 65 * i + 100; // Adjust y position for each bar

     svg.append("text")
         .attr("x", 10)
         .attr("y", yPos)
         .text(row.parameter)
         .style("font-size", "14px");
     
     var earthLabel = "Earth: ";
     if (row.parameter.includes("Solar")) {
       var earthLabel = "Host Star: ";
     }

     svg.append("text")
         .attr("x", 10)
         .attr("y", yPos + 20)
         .text(earthLabel + row.earth.min + " - " + row.earth.max)
         .style("font-size", "10px");

     svg.append("text")
         .attr("x", 10)
         .attr("y", yPos + 35)
         .text("Selected Planet: " + row.planet.toFixed(2))
         .style("font-size", "10px");

     // Draw Earth's optimal range bar
     svg.append("rect")
         .attr("x", 300 + barScale(row.earth.min))
         .attr("y", yPos)
         .attr("width", barScale((row.earth.max - row.earth.min) === 0 ? 0.01 : (row.earth.max - row.earth.min)))
         .attr("height", barHeight)
         .attr("fill", "steelblue");

     // Draw circle for the planet's value
     svg.append("circle")
         .attr("cx", 300 + barScale(row.planet))
         .attr("cy", yPos + barHeight / 2)
         .attr("r", 5)
         .attr("fill", "orange");

     // Draw x-axis for reference
     var xAxis = d3.axisBottom(barScale).ticks(5);
     svg.append("g")
         .attr("transform", "translate(300," + (yPos + barHeight + 10) + ")")
         .call(xAxis)
         .attr("font-size", "10px");
 });

 // Add back button to go back to Scene 1
 svg.append("text")
     .attr("x", 10)
     .attr("y", 640)
     .text("Back to Scene 1")
     .attr("class", "back-button")
     .on("click", function() {
         // Clear the visualization
         d3.select("#visualization").html("");
         // Draw Scene 1
         drawScene1(null);
     });

 // Make the back button look like a real button
 svg.selectAll(".back-button")
     .style("cursor", "pointer")
     .style("fill", "steelblue")
     .style("text-decoration", "underline");


   // Add button to go to Scene 3
   svg.append("text")
       .attr("x", 160)
       .attr("y", 640) // adjust accordingly
       .text("Explore Interactive Dashboard")
       .attr("class", "scene3-button")
       .on("click", function() {
           // Clear the visualization
           d3.select("#visualization").html("");
           // Draw Scene 3
           drawScene3();
       });

   // Make the button look like a real button
   svg.selectAll(".scene3-button")
       .style("cursor", "pointer")
       .style("fill", "steelblue")
       .style("text-decoration", "underline");

 // Adding a title
 svg.append("text")
     .attr("x", 170)
     .attr("y", 50)
     .attr("text-anchor", "middle")
     .style("font-size", "24px")
     .text(planet.pl_name+" Palnet Parameters");

 // Adding a legend
 var legendData = [{
         color: "steelblue",
         text: "Earth's Range"
     },
     {
         color: "orange",
         text: "Selected Planet's Value"
     }
 ];

 var legend = svg.selectAll(".legend")
     .data(legendData)
     .enter().append("g")
     .attr("class", "legend")
     .attr("transform", function(d, i) {
         return "translate(0, " + (20 * i) + ")";
     });

 var marginX = 340;
 var marginY = 500;

 legend.append("circle")
     .attr("cx", marginX + 20)
     .attr("cy", marginY + 20)
     .attr("r", 5)
     .style("fill", function(d) {
         return d.color;
     });

 legend.append("text")
     .attr("x", marginX + 30)
     .attr("y", marginY + 20)
     .attr("dy", ".35em")
     .style("text-anchor", "start")
     .text(function(d) {
         return d.text;
     });
}

function drawScene3() {

currentScene = "s3";

// Define variables to store slider values
var tempValue, eccenValue, radiusValue, smassValue, sradValue;
var xAxisValue = "pl_eqt", yAxisValue = "st_mass";

// Create SVG 
var svg = d3.select("#visualization").append("svg")
.attr("width", 1200)
.attr("height", 800);

// Create filters title
svg.append("text")
.attr("x", 10)
.attr("y", 20)
.text("Filter Parameters")
.style("font-size", "24px");

// Develop sliders using D3 slider module
var sliderWidth = 200;

// 1. Equilibrium Temperature Filter
svg.append("text")
.attr("x", 10)
.attr("y", 80)
.text("Equilibrium Temperature");

var tempSlider = d3
.sliderHorizontal()
.min(0)
.max(5000)
.step(50)
.width(sliderWidth)
.ticks(5)
.displayValue(false)
.on('onchange', val => { tempValue = val; applyFilters(); });

svg.append("g")
.attr("transform", "translate(10,100)")
.call(tempSlider);

// 2. Orbital Eccentricity Filter
svg.append("text")
.attr("x", 10)
.attr("y", 180)
.text("Orbital Eccentricity");

var eccenSlider = d3
.sliderHorizontal()
.min(0)
.max(1)
.step(0.01)
.width(sliderWidth)
.displayValue(false)
.on('onchange', val => { eccenValue = val; applyFilters(); });

svg.append("g")
.attr("transform", "translate(10,200)")
.call(eccenSlider);

// 3. Planet Radius Filter
svg.append("text")
.attr("x", 10)
.attr("y", 280)
.text("Planet Radius");

var radiusSlider = d3
.sliderHorizontal()
.min(0)
.max(10)
.step(0.1)
.width(sliderWidth)
.displayValue(false)
.on('onchange', val => { radiusValue = val; applyFilters(); });

svg.append("g")
.attr("transform", "translate(10,300)")
.call(radiusSlider);

// 4. Stellar Mass Filter
svg.append("text")
.attr("x", 10)
.attr("y", 380)
.text("Stellar Mass");

var smassSlider = d3
.sliderHorizontal()
.min(0)
.max(5)
.step(0.1)
.width(sliderWidth)
.displayValue(false)
.on('onchange', val => { smassValue = val; applyFilters(); });

svg.append("g")
.attr("transform", "translate(10,400)")
.call(smassSlider);

// 5. Stellar Radius Filter
svg.append("text")
.attr("x", 10)
.attr("y", 480)
.text("Stellar Radius");

var sradSlider = d3
.sliderHorizontal()
.min(0)
.max(10)
.step(0.1)
.width(sliderWidth)
.displayValue(false)
.on('onchange', val => { sradValue = val; applyFilters(); });

svg.append("g")
.attr("transform", "translate(10,500)")
.call(sradSlider);

// Create filters title
var marginTop = 10;
svg.append("text")
.attr("x", 10)
.attr("y", ""+(580+marginTop)+"px")
.text("Axis Columns")
.style("font-size", "24px");

// Add dropdowns for selecting x and y axes
var fields = ["pl_eqt", "pl_orbeccen", "pl_radj", "st_mass", "st_rad"];

// x drop down
svg.append("text")
.attr("x", 10)
.attr("y", (635+marginTop))
.text("X:");

var dropdownX = d3.select("#visualization")
.append("select")
.style("position", "absolute")
.style("top", ""+(680+marginTop)+"px")
.style("left", "60px")
.on("change", function() {
 xAxisValue = this.value;
 applyFilters();
});
dropdownX.selectAll("option").data(fields).enter().append("option").text(d => d);
dropdownX.property("value", "pl_eqt");

// y drop down
svg.append("text")
.attr("x", 10)
.attr("y", (695+marginTop))
.text("Y:");
var dropdownY = d3.select("#visualization")
.append("select")
.style("position", "absolute")
.style("top", ""+(740+marginTop)+"px")
.style("left", "60px")
.on("change", function() {
 yAxisValue = this.value;
 applyFilters();
});
dropdownY.selectAll("option").data(fields).enter().append("option").text(d => d);
dropdownY.property("value", "st_mass");

// Apply filters function using the slider variables
function applyFilters() {
let filteredData = data;
if (tempValue) { filteredData = filteredData.filter(planet => planet.pl_eqt >= tempValue) }
if (eccenValue) { filteredData = filteredData.filter(planet => planet.pl_orbeccen <= eccenValue) }
if (radiusValue) { filteredData = filteredData.filter(planet => planet.pl_radj <= radiusValue) }
if (smassValue) { filteredData = filteredData.filter(planet => planet.st_mass <= smassValue) }
if (sradValue) { filteredData = filteredData.filter(planet => planet.st_rad <= sradValue) }

// Update the chart based on the filtered data
drawChart(filteredData);
}

// Tooltip
var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

// drawChart function goes here
function drawChart(data) {
// Clear any previous charts
svg.selectAll(".chart").remove();

// Create a dictionary to map the selected axes to their corresponding titles and ranges
var axisDict = {
 "pl_eqt": {
   title: "Equilibrium Temperature",
   xRange: [0, 5000],
   yRange: [0, 5]
 },
 "pl_orbeccen": {
   title: "Orbital Eccentricity",
   xRange: [0, 1],
   yRange: [0, 5]
 },
 "pl_radj": {
   title: "Planet Radius [Jupiter Radius]",
   xRange: [0, 10],
   yRange: [0, 5]
 },
 "st_mass": {
   title: "Stellar Mass [Solar mass]",
   xRange: [0, 5],
   yRange: [0, 5]
 },
 "st_rad": {
   title: "Stellar Radius [Solar Radius]",
   xRange: [0, 5],
   yRange: [0, 5]
 }
};

var selectedXAxis = xAxisValue;
var selectedYAxis = yAxisValue;

var xTitle = axisDict[selectedXAxis].title || selectedXAxis;
var yTitle = axisDict[selectedYAxis].title || selectedYAxis;

var xRange = axisDict[selectedXAxis].xRange;
var yRange = axisDict[selectedYAxis].yRange;

// Generate scatter plot chart here
var margin = { top: 50, right: 50, bottom: 50, left: 350 },
 width = 1100 - margin.left - margin.right,
 height = 600 - margin.top - margin.bottom;

var x = d3.scaleLinear()
 .domain(xRange)
 .range([0, width]);

var y = d3.scaleLinear()
 .domain(yRange)
 .range([height, 0]);

var chart = svg.append("g")
 .attr("class", "chart")
 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

chart.selectAll("circle")
 .data(data)
 .enter()
 .append("circle")
 .attr("cx", d => x(d[selectedXAxis]))
 .attr("cy", d => y(d[selectedYAxis]))
 .attr("r", 3)
 .style("fill", d => colorScale(d.disc_year))
 .on("mouseover", function(event, d) {
    tooltip.transition()
             .duration(200)
             .style("opacity", .9);
    tooltip.html("Palent Name: " + d.pl_name)
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", function(d) {
    tooltip.transition()
             .duration(500)
             .style("opacity", 0);
}).on("click", function(event, d) {
     // clean the tool tip
     tooltip.transition()
         .duration(500)
         .style("opacity", 0);
     // Clear the visualization
     d3.select("#visualization").html("");
     // Draw Scene 2
     drawScene2(d);
});

chart.append("g")
 .attr("transform", "translate(0," + height + ")")
 .call(d3.axisBottom(x))
 .append("text")
 .attr("x", width / 2)
 .attr("y", 40)
 .text(xTitle)
 .style("text-anchor", "middle");

chart.append("g")
 .call(d3.axisLeft(y))
 .append("text")
 .attr("transform", "rotate(-90)")
 .attr("x", -height / 2)
 .attr("y", -30)
 .text(yTitle)
 .style("text-anchor", "middle");

chart.append("text")
 .attr("x", width / 2)
 .attr("y", -30)
 .text("Filtered Exoplanets")
 .style("text-anchor", "middle")
 .style("font-size", "20px");

// Draw the axis labels
chart.append("text")
.attr("x", width / 2)
.attr("y", height + 40)
.text(xTitle)
.style("text-anchor", "middle");

chart.append("text")
.attr("transform", "rotate(-90)")
.attr("x", -height / 2)
.attr("y", -30)
.text(yTitle)
.style("text-anchor", "middle");
};

// Add colors
var colorScale = d3.scaleSequential()
.domain([2018, 2023])
.interpolator(d3.interpolateOranges);

// Add back button to go back to Scene 1
svg.append("text")
 .attr("x", 10)
 .attr("y", 770)
 .text("Back to Scene 1")
 .attr("class", "back-button")
 .on("click", function () {
   
   // Clear the visualization
   d3.select("#visualization").html("");
   // Draw Scene 1
   drawScene1(null);
 });

// Make the back button look like a real button
svg.selectAll(".back-button")
 .style("cursor", "pointer")
 .style("fill", "steelblue")
 .style("text-decoration", "underline");

//draw default data
applyFilters()
}