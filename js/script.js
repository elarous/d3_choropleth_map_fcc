const EDUCATION_FILE = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTY_FILE = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

const margin = {top: 100,right: 100,bottom: 100,left: 100};
const h = 600,
      w = 960,
      legRectHeight = 14,
      legRectWidth = 40,
      minVal = 2.6,
      maxVal= 75.1,
      colorCount = 9;

const color = d3.scaleQuantize()
      .domain([minVal,maxVal])
      .range(d3.schemeReds[colorCount]);

const legendScale = d3.scaleLinear()
      .domain([minVal,maxVal])
      .range([0, legRectWidth * colorCount]);

let legendAxis = d3.axisBottom(legendScale)
    .tickValues(color.range()
                .slice(1,color.range().length)
                .map((d,i) => {
                     return color.invertExtent(d)[0];
                }))
    .tickFormat((d) => d3.format("d")(d)+"%") ;

let tooltip = d3.select("#container")
    .append("div")
    .attr("id","tooltip");

let svg = d3.select("#container")
    .append("svg")
    .attr("height",h)
    .attr("width",w);

let legend = svg.append("g")
    .attr("id","legend")
    .attr("transform","translate("+(w - (legRectWidth * colorCount) - margin.left)+","+legRectHeight+")");

legend.append("g")
    .attr("transform","translate(0,"+ 2 * legRectHeight+")")
    .call(legendAxis);

legend.selectAll("rect")
    .data(color.range())
    .enter()
    .append("rect")
    .attr("height", legRectHeight)
    .attr("width",legRectWidth)
    .attr("x",(d,i) => i * legRectWidth)
    .attr("y",legRectHeight)
    .attr("fill",(d) => d);


let path = d3.geoPath();

Promise.all([COUNTY_FILE,EDUCATION_FILE].map((url) => d3.json(url)))
    .then((values) => createMap(values[0],values[1]));

function findData(education,id){
    const result = education.filter((item) => item.fips == id);
    if (result[0])
        return result[0].bachelorsOrHigher;
    return null;
}

function findFullData(education,id){
    const result = education.filter((item) => item.fips == id);
    if(result[0])
        return result[0];
    return null;
}

function createMap(us,education){
    svg.append("g")
        .attr("class","counties")
        .selectAll("path")
        .data(topojson.feature(us,us.objects.counties).features)
        .enter()
        .append("path")
        .attr("d",path)
        .attr("class","county")
        .attr("data-fips", (d) => d.id)
        .attr("data-education", (d) => {
            const item = findData(education,d.id);
            if (item) return item;
            console.log('No data found for : ',d.id);
        })
        .attr("fill",(d) => {
            const item = findData(education,d.id);
            if (item)
                return color(item);
            return color(0);
        })
        .on("mouseover", function(d) {
            const mouse = d3.mouse(this);
            const eduData = findFullData(education,d.id);
            tooltip.transition()
                .duration(200)
                .style("opacity",1)
                .style("left", mouse[0]+ 10 +"px")
                .style("top", mouse[1] + 10+"px");
            tooltip.attr("data-education", eduData.bachelorsOrHigher)
                .html("<div class=\"county\">"+eduData.area_name+"</div>"
                      +"<div class=\"state\">"+eduData.state+"</div>"
                     +"<div class=\"percent\">"+eduData.bachelorsOrHigher+"%</div>");
        })
        .on("mouseout", (d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity","0");
        });

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a,b) => a !== b))
        .attr("class","states")
        .attr("d",path);
}
