/* Stylesheet by Buck E. Badger, 2015 */

//First line of main.js...wrap everything in a self-executing anonymous function to move local scope
(function(){

	//Pseudo-global variables
	let attrArray = ["pop_est", "gdp_md_est"]; //List of attributes
	let expressed = attrArray[0]; //Initial attribute

	//Chart frame dimensions
	let chartWidth = window.innerWidth * 0.425,
		chartHeight = 460,
		leftPadding = 25,
		rightPadding = 2,
		topBottomPadding = 5,
		chartInnerWidth = chartWidth - leftPadding - rightPadding,
		chartInnerHeight = chartHeight - topBottomPadding * 2,
		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

	//Create a scale to size bars proportionally to frame
	let yScale = d3.scaleLinear()
		.range([0, 450])
		.domain([0, 90000000]);

//Begin script when window loads
	window.onload = setMap();

	function setMap() {

		//Map frame dimensions
		let width = window.innerWidth * 0.5;
		let height = 460;

		//Create a new svg container for the map
		let map = d3.select("body")
			.append("svg")
			.attr("class", "map")
			.attr("width", width)
			.attr("height", height);

		//Create Albers equal area conic projection centered on France
		let projection = d3.geoAlbers()
			.center([0, 46.2])
			.rotate([-2, 0, 0])
			.parallels([43, 62])
			.scale(2500)
			.translate([width / 2, height / 2]);

		let path = d3.geoPath()
			.projection(projection);


		setGraticule(map, path);

		//Use promises instead of queue to parallelize asynchronous data loading
		let europeCountriesData = d3.csv("data/EuropeCountries.csv");
		let europeCountriesGeo = d3.json("data/EuropeCountries_Geo.topojson");
		let franceRegionsGeo = d3.json("data/FranceRegions_Geo.topojson");

		promises = [europeCountriesData, europeCountriesGeo, franceRegionsGeo];

		Promise.all(promises).then(function (values) {
			let europeCountriesData = values[0];
			let europeCountries = topojson.feature(values[1], values[1].objects.EuropeCountries_Geo);
			let franceRegions = topojson.feature(values[2], values[2].objects.FranceRegions).features;

			//Join csv data to GeoJson enumeration units
			joinData(europeCountries, europeCountriesData);

			//Create color scale
			let colorScale = makeColorScale(europeCountriesData);
			console.log(colorScale);

			//Add enumeration units to the map
			setEnumerationUnits(europeCountries, map, path, colorScale);

/*			//Add France regions to the map
			let regions = map.selectAll(".regions")
				.data(franceRegions)
				.enter()
				.append("path")
				.attr("class", function (d) {
					return "regions " + d.properties.adm1_code;
				})
				.attr("d", path);*/

			//Add coordinated visualization to the map
			setChart(europeCountriesData, colorScale);

			//Add dropdown to the map
			createDropdown(attrArray, europeCountriesData);
		});
	}; //End of setMap()

	function setGraticule(map, path) {
		//Create graticule generator
		let graticule = d3.geoGraticule()
			.step([5, 5]); //Place graticule lines every 5 degrees of longitude and latitude

		//Create graticule background
		let gratBackground = map.append("path")
			.datum(graticule.outline()) //Bind graticule background
			.attr("class", "gratBackground") //Assign class for styling
			.attr("d", path); //Project graticule

		//Create graticule lines
		let gratLines = map.selectAll(".gratLines") //Select graticule elements that will be created
			.data(graticule.lines()) //Bind graticule lines to each element to be created
			.enter() //Create an element for each datum
			.append("path") //Append each element to the svg as a path element
			.attr("class", "gratLines") //Assign class for styling
			.attr("d", path); //Project graticule lines
	};

	function joinData(europeCountries, europeCountriesData){
		//Loop through csv to assign each set of csv attribute values to geojson country
		for (let i = 0; i < europeCountriesData.length; i++) {
			//console.log(europeCountriesData[i]);
			let csvCountry = europeCountriesData[i]; //The current country
			let csvKey = csvCountry.name; //The CSV primary key
			//console.log(csvKey);

			//Loop through geojson countries to find the correct country
			for (let a = 0; a < europeCountries.features.length; a++) {
				//console.log(europeCountries.features[a]);
				let geojsonProps = europeCountries.features[a].properties; //The current country geojson properties
				let geojsonKey = geojsonProps.name; //The geojson primary key
				//console.log(geojsonKey);

				//Where primary keys match, transfer csv data to geojson properties object
				if (geojsonKey == csvKey) {
					//Assign all attributes and values
					attrArray.forEach(function (attr) {
						let val = parseInt(csvCountry[attr]); //Get csv attribute value
						geojsonProps[attr] = val; //Assign attribute and value to geojson properties
					});
				};
			};
		};
	};

	function setEnumerationUnits(europeCountries, map, path, colorScale){
		//Add Europe countries to the map
/*		let countries = map.append("path")
			.datum(europeCountries)
			.attr("class", "countries")
			.attr("d", path)
			.style("fill", function(d){
				console.log(d);
				return colorScale(d.properties[expressed]);
			});*/
		let countries = map.selectAll(".countries")
			.data(europeCountries.features)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "countries " + d.properties.name;
			})
			.attr("d", path)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale);
			});
	};

	//Function to create color scale generator
	function makeColorScale(data){
		let colorClasses = [
			"#D4B9DA",
			"#C994C7",
			"#DF65B0",
			"#DD1C77",
			"#980043"
		];

		//Create color scale generator
		let colorScale = d3.scaleThreshold()
			.range(colorClasses);

		//Build array of all values of the expressed attribute
		let domainArray = [];
		for (let i=0; i<data.length; i++){
			let val = parseInt(data[i][expressed]);
			domainArray.push(val);
		};

		//Cluster data using ckmeans clustering algorithm to create natural breaks
		let clusters = ss.ckmeans(domainArray, 5);
		//Reset domain array to cluster minimums
		domainArray = clusters.map(function(d){
			return d3.min(d);
		});

		//Remove first value from the domain array to create class breakpoints
		domainArray.shift();

		//Assign array last 4 cluster minimums as domain
		colorScale.domain(domainArray);

		return colorScale;
	};

	//Function to test for data value and return color
	function choropleth(props, colorScale){
		//Make sure attribute value is a number
		let val = parseInt(props[expressed]);

		//If attribute value exists, assign a color; otherwise assign gray
		if (typeof val == "number" && !isNaN(val)){
			return colorScale(val);
		}else{
			return "#CCC";
		};
	};

	//Function to create the coordinated bar chart
	function setChart(europeCountriesData, colorScale){
		//Create a second svg element to hold the bar chart
		let chart = d3.select("body")
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("class", "chart");

		//Create a rectangle for the chart background fill
		let chartBackground = chart.append("rect")
			.attr("class", "chartBackground")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);

		//Set bars for each country
		let bars = chart.selectAll(".bars")
			.data(europeCountriesData)
			.enter()
			.append("rect")
			.sort(function(a, b){
				return b[expressed] - a[expressed]
			})
			.attr("class", function(d){
				return "bars " + d.name;
			})
			.attr("width", chartInnerWidth / europeCountriesData.length - 1);

		//Create text element for the chart title
		let chartTitle = chart.append("text")
			.attr("x", 60)
			.attr("y", 60)
			.attr("class", "chartTitle")
			.text("Estimated Population in each country (thousands)");

		//Create vertical axis generator
		let yAxis = d3.axisLeft()
			.scale(d3.scaleLinear().range([450,0]).domain([0,900]));

		//Place axis
		let axis = chart.append("g")
			.attr("class", "axis")
			.attr("transform", translate)
			.call(yAxis);

		//Create frame for chart border
		let chartFrame = chart.append("rect")
			.attr("class", "chartFrame")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);

		updateChart(bars, europeCountriesData.length, colorScale);
	}; //End of setChart()

	//Function to create a dropdown menu for attribute selection
	function createDropdown(attrArray, europeCountriesData) {
		//Add select element
		let dropdown = d3.select("body")
			.append("select")
			.attr("class", "dropdown")
			.on("change", function () {
				changeAttribute(this.value, europeCountriesData)
			});

		//Add initial option
		let titleOption = dropdown.append("option")
			.attr("class", "titleOption")
			.attr("disabled", "true")
			.text("Select Attribute");

		//Add attribute name options
		let attrOptions = dropdown.selectAll("attrOptions")
			.data(attrArray)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d
			})
			.text(function (d) {
				return d
			});
	};

	//Dropdown change listener handler
	function changeAttribute(attribute, europeCountriesData){
		//Change the expressed attribute
		expressed = attribute;

		//Recreate the color scale
		let colorScale = makeColorScale(europeCountriesData);
		console.log(colorScale);

		//Recolor enumeration units
		let countries = d3.selectAll(".countries")
			.transition()
			.duration(1000)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale)
			});

		//Re-sort, resize, and recolor bars
		let bars = d3.selectAll(".bars")
		//Re-sort bars
			.sort(function(a, b){
				return b[expressed] - b[expressed];
			})
			.transition()
			.delay(function(d, i){
				return i * 20
			})
			.duration(500);

		updateChart(bars, europeCountriesData.length, colorScale);
	}; //End of changeAttribute()

	function updateChart(bars, n, colorScale){
		//Position bars
		bars.attr("x", function(d, i){
				return i * (chartWidth / n) + leftPadding;
			})
			//Size/resize bars
			.attr("height", function(d, i){
				return yScale(parseInt(d[expressed]));
			})
			.attr("y", function(d){
				return 450 - yScale(parseInt(d[expressed])) + topBottomPadding;
			})
			.style("fill", function(d){
				return choropleth(d, colorScale);
			})
		let chartTitle = d3.select(".chartTitle")
			.text("Estimated Population in each country (thousands)");
	}
})(); //Last line of main.js

/*
			.attr("x", function(d, i){
				return i * (chartWidth / europeCountriesData.length) + leftPadding;
			})
			.attr("height", function(d){
				return yScale(parseInt(d[expressed]));
			})
			.attr("y", function(d){
				return 450 - yScale(parseInt(d[expressed])) + topBottomPadding;
			})
			.style("fill", function(d){
				return choropleth(d, colorScale);
			});




			.attr("x", function(d, i){
				return i * (chartInnerWidth / europeCountriesData.length) + leftPadding;
			})
		//Resize bars
			.attr("height", function(d, i){
				return 460 - yScale(parseInt(d[expressed]));
			})
			.attr("y", function(d, i){
				return yScale(parseInt(d[expressed])) + topBottomPadding;
			})
		//Recolor bars
			.style("fill", function(d){
				return choropleth(d, colorScale);
			});*/
