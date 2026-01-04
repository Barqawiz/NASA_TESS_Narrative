let data = null;
let currentScene = null;
let initialLoad = true;
let tooltip = null;
let navInitialized = false;

// --- Earth references (scientific note) ---
// The dataset field `pl_eqt` is equilibrium temperature (K), which for Earth is ~255 K.
// A common "temperate" equilibrium-temperature window used as a heuristic is ~185–303 K.
const EARTH_EQT = 255;
const EARTH_EQT_RANGE = { min: 185, max: 303 };
const EARTH_ECC_RANGE = { min: 0, max: 0.2 };
const SUNLIKE_RANGE = { min: 0.8, max: 1.2 };

function toNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "" || s.toLowerCase() === "nan") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fmt(v, digits = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "N/A";
  return Number(v).toFixed(digits);
}

function getTooltip() {
  if (tooltip) return tooltip;
  tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  return tooltip;
}

function getDiscYearExtent() {
  if (!data) return [2018, 2023];
  const years = data.map(d => d.disc_year).filter(v => v !== null && Number.isFinite(v));
  const extent = d3.extent(years);
  if (!extent || extent[0] === undefined || extent[1] === undefined) return [2018, 2023];
  return extent;
}

function makeColorScale() {
  const [minY, maxY] = getDiscYearExtent();
  return d3.scaleSequential()
    .domain([minY, maxY])
    .interpolator(d3.interpolateOranges);
}

function setActiveNav(scene) {
  const s1 = document.getElementById("nav-scene1");
  const s3 = document.getElementById("nav-scene3");
  if (!s1 || !s3) return;
  s1.classList.toggle("nav-btn--active", scene === "s1" || scene === "s2");
  s3.classList.toggle("nav-btn--active", scene === "s3");
}

function initNav() {
  if (navInitialized) return;
  navInitialized = true;

  const s1 = document.getElementById("nav-scene1");
  const s3 = document.getElementById("nav-scene3");
  if (s1) {
    s1.addEventListener("click", () => {
      if (!data) return;
      d3.select("#visualization").html("");
      drawScene1(null);
    });
  }
  if (s3) {
    s3.addEventListener("click", () => {
      if (!data) return;
      d3.select("#visualization").html("");
      drawScene3();
    });
  }
}

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
d3.csv("data/tess_confirmed_plannetsv2.csv", (d) => {
  // Defensive mapping: only keep columns actually used by the visualization.
  // This prevents crashes if the CSV gains extra columns or changes ordering.
  return {
    pl_name: d.pl_name,
    disc_year: toNum(d.disc_year),
    pl_eqt: toNum(d.pl_eqt),
    pl_orbeccen: toNum(d.pl_orbeccen),
    sy_dist: toNum(d.sy_dist),
    st_mass: toNum(d.st_mass),
    st_rad: toNum(d.st_rad),
    pl_orbsmax: toNum(d.pl_orbsmax),
    pl_radj: toNum(d.pl_radj),
  };
}).then(function(myData) {
 // Keep all rows so the dataset size matches the archive snapsho.
 data = myData;

 // wire nav once data is ready
 initNav();

 // Scene 1: Overview
 drawScene1(null);
});

function drawScene1(filteredData) {

 // set the current scene
 currentScene = "s1";
 setActiveNav("s1");

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
 data.sort((a, b) => (a.disc_year ?? 0) - (b.disc_year ?? 0));
countedData.sort((a, b) => a.year - b.year );


 // Prepare color scale
 var colorScale = makeColorScale();

 // Create SVG for the visualization
 var svg = d3.select("#visualization").append("svg")
     .attr("viewBox", "0 0 1200 950")
     .attr("preserveAspectRatio", "xMidYMid meet");

 // reset the filter
 svg.on("click", resetFilter);

 // Histogram
 var histogramWidth = 400;
 var histogramHeight = 300;

 var x = d3.scaleBand()
     .domain(countedData.map(d => d.year))
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
         const tooltip = getTooltip();
         tooltip.transition()
             .duration(200)
             .style("opacity", .9);
         tooltip.html("Year: " + d.year + "<br/>Number of Exoplanets: " + d.count)
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
         const tooltip = getTooltip();
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
     }).on("click", function(event, d) {
         event.stopPropagation();

         // clean the tool tip
         const tooltip = getTooltip();
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

 const eqtExtent = d3.extent(data.map(d => d.pl_eqt).filter(v => v !== null));
 const eccExtent = d3.extent(data.map(d => d.pl_orbeccen).filter(v => v !== null));

 var xScatter = d3.scaleLinear()
     .domain([eqtExtent[0] ?? 0, eqtExtent[1] ?? 1])
     .range([0, scatterWidth]);

 var yScatter = d3.scaleLinear()
     .domain([eccExtent[0] ?? 0, eccExtent[1] ?? 1])
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
         if (
           d.pl_eqt !== null &&
           d.pl_orbeccen !== null &&
           d.pl_eqt >= EARTH_EQT_RANGE.min &&
           d.pl_eqt <= EARTH_EQT_RANGE.max &&
           d.pl_orbeccen >= EARTH_ECC_RANGE.min &&
           d.pl_orbeccen <= EARTH_ECC_RANGE.max
         ) {
             return "black";
         } else {
             return null;
         }
     })
     .attr("stroke-width", (d) => {
         if (
           d.pl_eqt !== null &&
           d.pl_orbeccen !== null &&
           d.pl_eqt >= EARTH_EQT_RANGE.min &&
           d.pl_eqt <= EARTH_EQT_RANGE.max &&
           d.pl_orbeccen >= EARTH_ECC_RANGE.min &&
           d.pl_orbeccen <= EARTH_ECC_RANGE.max
         ) {
             return 1.5;
         } else {
             return 0;
         }
     })
     .on("mouseover", function(event, d) {
         const tooltip = getTooltip();
         tooltip.transition()
             .duration(200)
             .style("opacity", .9);
         tooltip.html(
           "Planet: " + d.pl_name +
           "<br/>Equilibrium Temperature (K): " + fmt(d.pl_eqt) +
           "<br/>Orbital Eccentricity: " + fmt(d.pl_orbeccen, 3) +
           "<br/>Distance (pc): " + fmt(d.sy_dist, 1)
         )
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
         const tooltip = getTooltip();
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
     })
     .on("click", function(event, d) {
         event.stopPropagation();
         // clean the tool tip
         const tooltip = getTooltip();
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
     .text("Equilibrium Temperature (K)")
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
     .text("Orbital Eccentricity vs Equilibrium Temperature")
     .style("text-anchor", "middle")
     .style("font-size", "20px");

 // Annotations for Stellar 1
 var annotations = [{
     note: {
         label: "Potential Habitable Zone",
         align: "left"
     },
     x: xScatter(290),
     y: yScatter(0.05),
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

 const stMassExtent = d3.extent(data.map(d => d.st_mass).filter(v => v !== null));
 const stRadExtent = d3.extent(data.map(d => d.st_rad).filter(v => v !== null));

 var xScatter2 = d3.scaleLinear()
     .domain([stMassExtent[0] ?? 0, stMassExtent[1] ?? 1])
     .range([0, scatter2Width]);

 var yScatter2 = d3.scaleLinear()
     .domain([stRadExtent[0] ?? 0, stRadExtent[1] ?? 1])
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
         if (
           d.st_mass !== null &&
           d.st_rad !== null &&
           d.st_mass >= SUNLIKE_RANGE.min &&
           d.st_mass <= SUNLIKE_RANGE.max &&
           d.st_rad >= SUNLIKE_RANGE.min &&
           d.st_rad <= SUNLIKE_RANGE.max
         ) {
             // condition for earth similar stars
             return "black";
         } else {
             return null;
         }
     })
     .attr("stroke-width", (d) => {
         if (
           d.st_mass !== null &&
           d.st_rad !== null &&
           d.st_mass >= SUNLIKE_RANGE.min &&
           d.st_mass <= SUNLIKE_RANGE.max &&
           d.st_rad >= SUNLIKE_RANGE.min &&
           d.st_rad <= SUNLIKE_RANGE.max
         ) {
             return 1.5;
         } else {
             return 0;
         }
     })
     .on("mouseover", function(event, d) {
         const tooltip = getTooltip();
         tooltip.transition()
             .duration(200)
             .style("opacity", .9);
         tooltip.html(
           "Planet: " + d.pl_name +
           "<br/>Stellar Mass (M☉): " + fmt(d.st_mass, 2) +
           "<br/>Stellar Radius (R☉): " + fmt(d.st_rad, 2) +
           "<br/>Distance (pc): " + fmt(d.sy_dist, 1)
         )
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
         const tooltip = getTooltip();
         tooltip.transition()
             .duration(500)
             .style("opacity", 0);
     })
     .on("click", function(event, d) {
         event.stopPropagation();
         // clean the tool tip
         const tooltip = getTooltip();
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
     .text("Stellar Mass (M☉)")
     .style("text-anchor", "middle");

 scatter2.append("text")
     .attr("x", -scatter2Height / 2)
     .attr("y", -30)
     .text("Stellar Radius (R☉)")
     .style("text-anchor", "middle")
     .attr("transform", "rotate(-90)");

 scatter2.append("text")
     .attr("x", scatter2Width / 2)
     .attr("y", -30)
     .text("Host Star: Stellar Radius vs Stellar Mass")
     .style("text-anchor", "middle")
     .style("font-size", "20px");

 // Annotation for Scatter 2
 var annotations2 = [{
     note: {
         label: "Potential Habitable Zone",
         align: "left"
     },
     x: xScatter2(1),
     y: yScatter2(1),
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
     .attr("transform", "translate(1040, 60)");

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

 legend.attr("transform", "translate(1040, 60)");


 // Add button to go to Scene 3
 // Navigation lives in the top menu now
 
}

function drawScene2(planet) {
 // set the current scene
 currentScene = "s2";
 setActiveNav("s2");

 // Comparison data
 var comparisonData = [{
         parameter: 'Equilibrium Temperature',
         earth: {
             min: EARTH_EQT_RANGE.min,
             max: EARTH_EQT_RANGE.max
         },
         planet: planet.pl_eqt
     },
     {
         parameter: 'Orbital Semi-Major Axis (AU)',
         earth: {
             min: 0.9,
             max: 1.5
         },
         planet: planet.pl_orbsmax
     },
     {
         parameter: 'Planet Radius (Jupiter Radii)',
         earth: {
             min: 0.0892,
             max: 0.1427
         },
         planet: planet.pl_radj
     },
     {
         parameter: 'Orbital Eccentricity',
         earth: {
             min: EARTH_ECC_RANGE.min,
             max: EARTH_ECC_RANGE.max
         },
         planet: planet.pl_orbeccen
     },
     {
         parameter: 'Stellar Radius (Solar Rad.)',
         earth: {
             min: 1,
             max: 1
         },
         planet: planet.st_rad
     },
     {
         parameter: 'Stellar Mass (Solar Mass)',
         earth: {
             min: 1,
             max: 1
         },
         planet: planet.st_mass
     }
 ];

 // SVG for the visualization
 const vizRoot = d3.select("#visualization");
 var svg = vizRoot.append("svg")
     .attr("viewBox", "0 0 800 600")
     .attr("preserveAspectRatio", "xMidYMid meet");

 var barHeight = 20;
 var barMaxWidth = 200;
 var barScale = d3.scaleLinear().range([0, barMaxWidth]);

 comparisonData.forEach(function(row, i) {
     // Define the scale for the parameter
     var scaleMax = Math.max(row.earth.max, row.planet, row.earth.min)
     barScale.domain([0, scaleMax]);

     var yPos = 65 * i + 100;

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
         .text("Selected Planet: " + (row.planet === null ? "N/A" : row.planet.toFixed(2)))
         .style("font-size", "10px");

     // Draw Earth's optimal range bar
     svg.append("rect")
         .attr("x", 300 + barScale(row.earth.min))
         .attr("y", yPos)
         .attr("width", barScale((row.earth.max - row.earth.min) === 0 ? 0.01 : (row.earth.max - row.earth.min)))
         .attr("height", barHeight)
         .attr("fill", "steelblue");

     // Draw circle for the planet's value
     if (row.planet !== null) {
       svg.append("circle")
           .attr("cx", 300 + barScale(row.planet))
           .attr("cy", yPos + barHeight / 2)
           .attr("r", 5)
           .attr("fill", "orange");
     }

     // Draw x-axis for reference
     var xAxis = d3.axisBottom(barScale).ticks(5);
     svg.append("g")
         .attr("transform", "translate(300," + (yPos + barHeight + 10) + ")")
         .call(xAxis)
         .attr("font-size", "10px");
 });

 // Scene 2 actions (real buttons below the chart)
 const actions = vizRoot.append("div").attr("class", "scene-actions");
 actions.append("button")
   .attr("class", "btn btn-outline-primary")
   .text("Back to Scene 1")
   .on("click", () => {
     d3.select("#visualization").html("");
     drawScene1(null);
   });
 actions.append("button")
   .attr("class", "btn btn-primary")
   .text("Explore Interactive Dashboard")
   .on("click", () => {
     d3.select("#visualization").html("");
     drawScene3();
   });

 // Adding a title
 svg.append("text")
     .attr("x", 170)
     .attr("y", 50)
     .attr("text-anchor", "middle")
     .style("font-size", "24px")
     .text(planet.pl_name + " Planet Parameters");

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
setActiveNav("s3");

// State
let tempMin = 0;
let eccenMax = 1;
let radiusMax = 10;
let smassMax = 5;
let sradMax = 10;
let xAxisValue = "pl_eqt";
let yAxisValue = "st_mass";
let nameQuery = "";
let showEarth = true;
const colorScale = makeColorScale();

// Root layout
const root = d3.select("#visualization");
const layout = root.append("div").attr("class", "scene3-layout");
const controls = layout.append("div").attr("class", "controls-panel");
const viz = layout.append("div").attr("class", "viz-panel");

controls.append("h2").text("Interactive Filters");

// Search
const searchGroup = controls.append("div").attr("class", "control-group");
searchGroup.append("div").attr("class", "control-label").text("Search (planet name)");
const searchInput = searchGroup.append("input")
  .attr("type", "search")
  .attr("placeholder", "e.g., AU Mic b")
  .on("input", function () {
    nameQuery = String(this.value || "").trim().toLowerCase();
    applyFilters();
  });

// Axis dropdowns
const fields = ["pl_eqt", "pl_orbeccen", "pl_radj", "st_mass", "st_rad"];
const fieldLabels = {
  pl_eqt: "Equilibrium Temperature (K)",
  pl_orbeccen: "Orbital Eccentricity",
  pl_radj: "Planet Radius (Rj)",
  st_mass: "Stellar Mass (Msun)",
  st_rad: "Stellar Radius (Rsun)"
};

const axisGroup = controls.append("div").attr("class", "control-group");
axisGroup.append("div").attr("class", "control-label").text("Axes");
const axisRow = axisGroup.append("div").attr("class", "axis-row");
axisRow.append("span").style("font-size", "12px").style("font-weight", "600").text("X:");
const xSelect = axisRow.append("select")
  .on("change", function () { xAxisValue = this.value; applyFilters(); });
xSelect.selectAll("option").data(fields).enter().append("option")
  .attr("value", d => d)
  .text(d => fieldLabels[d] || d);
xSelect.property("value", xAxisValue);

axisRow.append("span").style("font-size", "12px").style("font-weight", "600").text("Y:");
const ySelect = axisRow.append("select")
  .on("change", function () { yAxisValue = this.value; applyFilters(); });
ySelect.selectAll("option").data(fields).enter().append("option")
  .attr("value", d => d)
  .text(d => fieldLabels[d] || d);
ySelect.property("value", yAxisValue);

// Toggle Earth overlay
const earthGroup = controls.append("div").attr("class", "control-group");
earthGroup.append("div").attr("class", "control-label").text("Earth overlay");
const earthRow = earthGroup.append("div").attr("class", "btn-row");
const earthCheckbox = earthRow.append("input")
  .attr("type", "checkbox")
  .property("checked", showEarth)
  .on("change", function () { showEarth = !!this.checked; applyFilters(); });
earthRow.append("label")
  .style("font-size", "13px")
  .style("margin", "0")
  .text("Show Earth reference + ranges");

// Sliders
function addSlider({ title, min, max, step, initial, fmtValue, onChange }) {
  const group = controls.append("div").attr("class", "control-group");
  const label = group.append("div").attr("class", "control-label");
  label.append("span").text(title);
  const readout = label.append("span").style("font-weight", "700").text(fmtValue(initial));

  const sliderSvg = group.append("svg").attr("width", 280).attr("height", 56);
  const slider = d3.sliderHorizontal()
    .min(min)
    .max(max)
    .step(step)
    .width(240)
    .ticks(4)
    .displayValue(false)
    .default(initial)
    .on("onchange", (val) => {
      readout.text(fmtValue(val));
      onChange(val);
      applyFilters();
    });
  sliderSvg.append("g").attr("transform", "translate(14,22)").call(slider);
}

addSlider({
  title: "Equilibrium Temperature >=",
  min: 0,
  max: 5000,
  step: 50,
  initial: tempMin,
  fmtValue: (v) => `${Math.round(v)} K`,
  onChange: (v) => { tempMin = v; }
});

addSlider({
  title: "Orbital Eccentricity <=",
  min: 0,
  max: 1,
  step: 0.01,
  initial: eccenMax,
  fmtValue: (v) => `${Number(v).toFixed(2)}`,
  onChange: (v) => { eccenMax = v; }
});

addSlider({
  title: "Planet Radius (Rj) <=",
  min: 0,
  max: 10,
  step: 0.1,
  initial: radiusMax,
  fmtValue: (v) => `${Number(v).toFixed(1)}`,
  onChange: (v) => { radiusMax = v; }
});

addSlider({
  title: "Stellar Mass (Msun) <=",
  min: 0,
  max: 5,
  step: 0.1,
  initial: smassMax,
  fmtValue: (v) => `${Number(v).toFixed(1)}`,
  onChange: (v) => { smassMax = v; }
});

addSlider({
  title: "Stellar Radius (Rsun) <=",
  min: 0,
  max: 10,
  step: 0.1,
  initial: sradMax,
  fmtValue: (v) => `${Number(v).toFixed(1)}`,
  onChange: (v) => { sradMax = v; }
});

const stats = controls.append("div").attr("class", "filter-stats").text("");

// Actions (reset + back) live at bottom for consistent spacing
const actionsRow = controls.append("div").attr("class", "panel-actions");
actionsRow.append("button")
  .attr("class", "btn btn-outline-secondary")
  .text("Reset filters")
  .on("click", () => {
    // easiest reset: redraw scene3
    d3.select("#visualization").html("");
    drawScene3();
  });

// slider variables
function applyFilters() {
let filteredData = data;
filteredData = filteredData.filter(p => p.pl_name); // guard
filteredData = filteredData.filter(p => p.disc_year !== null);

// Only apply numeric filters when the user has moved away from default "no filter"
if (tempMin > 0) filteredData = filteredData.filter(p => p.pl_eqt !== null && p.pl_eqt >= tempMin);
if (eccenMax < 1) filteredData = filteredData.filter(p => p.pl_orbeccen !== null && p.pl_orbeccen <= eccenMax);
if (radiusMax < 10) filteredData = filteredData.filter(p => p.pl_radj !== null && p.pl_radj <= radiusMax);
if (smassMax < 5) filteredData = filteredData.filter(p => p.st_mass !== null && p.st_mass <= smassMax);
if (sradMax < 10) filteredData = filteredData.filter(p => p.st_rad !== null && p.st_rad <= sradMax);
if (nameQuery) filteredData = filteredData.filter(p => String(p.pl_name).toLowerCase().includes(nameQuery));

// Update the chart based filtered data
drawChart(filteredData);
}

// drawChart function goes here
function drawChart(chartData) {
// Clear any previous charts
viz.selectAll("svg").remove();

// Create a dictionary to map the selected axes
var axisDict = {
 "pl_eqt": {
   title: "Equilibrium Temperature (K)",
   range: [0, 5000]
 },
 "pl_orbeccen": {
   title: "Orbital Eccentricity",
   range: [0, 1]
 },
 "pl_radj": {
   title: "Planet Radius (Rj)",
   range: [0, 10]
 },
 "st_mass": {
   title: "Stellar Mass (Msun)",
   range: [0, 5]
 },
 "st_rad": {
   title: "Stellar Radius (Rsun)",
   range: [0, 10]
 }
};

var selectedXAxis = xAxisValue;
var selectedYAxis = yAxisValue;

var xTitle = axisDict[selectedXAxis].title || selectedXAxis;
var yTitle = axisDict[selectedYAxis].title || selectedYAxis;

var xRange = axisDict[selectedXAxis].range || [0, 1];
var yRange = axisDict[selectedYAxis].range || [0, 1];

// Only plot rows where selected axes exist
const plottedData = chartData.filter(d => d[selectedXAxis] !== null && d[selectedYAxis] !== null);
stats.text(`Showing ${plottedData.length} of ${data.length} planets (filters + available axis data).`);

// Generate scatter plot
var margin = { top: 60, right: 40, bottom: 60, left: 70 },
 width = 820,
 height = 560;

var svg = viz.append("svg")
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

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
 .data(plottedData)
 .enter()
 .append("circle")
 .attr("cx", d => x(d[selectedXAxis] ?? 0))
 .attr("cy", d => y(d[selectedYAxis] ?? 0))
 .attr("r", 3.2)
 .style("fill", d => colorScale(d.disc_year))
 .on("mouseover", function(event, d) {
    const tooltip = getTooltip();
    tooltip.transition()
             .duration(200)
             .style("opacity", .9);
    tooltip.html(
      "Planet: " + d.pl_name +
      "<br/>" + xTitle + ": " + fmt(d[selectedXAxis]) +
      "<br/>" + yTitle + ": " + fmt(d[selectedYAxis]) +
      "<br/>Discovery year: " + (d.disc_year ?? "N/A")
    )
             .style("left", (event.pageX) + "px")
             .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", function(d) {
    const tooltip = getTooltip();
    tooltip.transition()
             .duration(500)
             .style("opacity", 0);
}).on("click", function(event, d) {
     event.stopPropagation();
     // clean the tool tip
     const tooltip = getTooltip();
     tooltip.transition()
         .duration(500)
         .style("opacity", 0);
     // Clear the visualization
     d3.select("#visualization").html("");
     // Draw Scene 2
     drawScene2(d);
});

// Earth overlay and reference ranges (only for supported axes)
if (showEarth) {
  const earth = {
    pl_eqt: EARTH_EQT,
    pl_orbeccen: 0.0167,
    pl_radj: 0.0892, // ~Earth radius in Jupiter radii
    st_mass: 1.0,
    st_rad: 1.0
  };
  const earthRanges = {
    pl_eqt: { min: EARTH_EQT_RANGE.min, max: EARTH_EQT_RANGE.max },
    pl_orbeccen: { min: EARTH_ECC_RANGE.min, max: EARTH_ECC_RANGE.max },
    pl_radj: { min: 0.0892, max: 0.1427 },
    st_mass: { min: SUNLIKE_RANGE.min, max: SUNLIKE_RANGE.max },
    st_rad: { min: SUNLIKE_RANGE.min, max: SUNLIKE_RANGE.max }
  };

  const xr = earthRanges[selectedXAxis];
  const yr = earthRanges[selectedYAxis];
  const hasRangeBox = !!(xr && yr);
  if (xr && yr) {
    chart.append("rect")
      .attr("x", x(xr.min))
      .attr("y", y(yr.max))
      .attr("width", Math.max(0, x(xr.max) - x(xr.min)))
      .attr("height", Math.max(0, y(yr.min) - y(yr.max)))
      .attr("fill", "rgba(70,130,180,0.10)")
      .attr("stroke", "rgba(70,130,180,0.35)")
      .attr("stroke-width", 1);
  }

  const ex = earth[selectedXAxis];
  const ey = earth[selectedYAxis];
  const hasEarthPoint = (ex !== undefined && ey !== undefined);
  if (ex !== undefined && ey !== undefined) {
    chart.append("circle")
      .attr("cx", x(ex))
      .attr("cy", y(ey))
      .attr("r", 5.5)
      .attr("fill", "white")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2);
  }

  // Legend goes inside the plot area (top-right)
  if (hasEarthPoint || hasRangeBox) {
    const legendPadding = 10;
    const legendX = width - 260;
    const legendY = 10;
    const legendW = 250;
    const legendH = 68;

    const legend = chart.append("g")
      .attr("class", "earth-chart-legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendW)
      .attr("height", legendH)
      .attr("rx", 10)
      .attr("fill", "rgba(255,255,255,0.92)")
      .attr("stroke", "rgba(0,0,0,0.12)");

    legend.append("text")
      .attr("x", legendPadding)
      .attr("y", 18)
      .text("Earth overlay")
      .style("font-size", "12px")
      .style("font-weight", "700")
      .style("fill", "#111827");

    // row 1: Earth point
    legend.append("circle")
      .attr("cx", legendPadding + 8)
      .attr("cy", 36)
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2);
    legend.append("text")
      .attr("x", legendPadding + 22)
      .attr("y", 40)
      .text("Earth reference point (approx.)")
      .style("font-size", "11px")
      .style("fill", "#111827");

    // row 2: Range box
    legend.append("rect")
      .attr("x", legendPadding + 2)
      .attr("y", 50)
      .attr("width", 12)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("fill", "rgba(70,130,180,0.10)")
      .attr("stroke", "rgba(70,130,180,0.35)");
    legend.append("text")
      .attr("x", legendPadding + 22)
      .attr("y", 59)
      .text("Earth-like range box")
      .style("font-size", "11px")
      .style("fill", "#111827");
  }
}

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
 .text("Filtered Exoplanets (click a point for full comparison)")
 .style("text-anchor", "middle")
 .style("font-size", "20px");

if (plottedData.length === 0) {
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .text("No planets match these filters / axes.")
    .style("text-anchor", "middle")
    .style("fill", "#5b6473")
    .style("font-size", "14px");
}

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

// Add back button to go back to Scene 1
actionsRow.append("button")
  .attr("class", "btn btn-outline-primary")
  .text("Back to Scene 1")
  .on("click", function () {
    d3.select("#visualization").html("");
    drawScene1(null);
  });

//draw default data
applyFilters()
}
