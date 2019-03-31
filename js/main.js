/* Stylesheet by Buck E. Badger, 2015 */

//First line of main.js...wrap everything in a self-executing anonymous function to move local scope
(function(){

	//Pseudo-global variables
	let attrArray = ["pop_est", "gdp_md_est"]; //List of attributes
	let expressed = attrArray[0]; //Initial attribute

//Begin script when window loads
	window.onload = setMap();

	function setMap() {

		//Map frame dimensions
		let width = 960;
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

		console.log("I'm just a pending promise so I load ASAP. Expand Me (europeCountriesData) --> ", europeCountriesData);
		console.log("I'm just a pending promise so I load ASAP. Expand Me (europeCountriesGeo) --> ", europeCountriesGeo);
		console.log("I'm just a pending promise so I load ASAP. Expand Me (franceRegionsGeo) --> ", franceRegionsGeo);

		promises = [europeCountriesData, europeCountriesGeo, franceRegionsGeo];

		Promise.all(promises).then(function (values) {
			console.log(values);
			let europeCountriesData = values[0];
			console.log("I'm a csv promise. --> ", europeCountriesData);
			let europeCountries = topojson.feature(values[1], values[1].objects.EuropeCountries_Geo);
			console.log("I'm a topojson promise converted to geojson. --> ", europeCountries);
			console.log(europeCountries.features);
			let franceRegions = topojson.feature(values[2], values[2].objects.FranceRegions).features;
			console.log("I'm a topojson promise converted to geojson. --> ", franceRegions);

			//Join csv data to GeoJson enumeration units
			console.log("Tada! ", europeCountries);
			joinData(europeCountries, europeCountriesData);
			console.log(europeCountries.features[0]);

			let colorScale = makeColorScale(europeCountriesData);

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
		});
		console.log("I'm not a promise so I load ASAP even though I come after all the other crap in the setMap() function.");
	};

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
		console.log(europeCountries);
		console.log(colorScale);
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
				console.log(d);
				console.log(typeof d.properties[expressed]);
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
		console.log(val);
		//If attribute value exists, assign a color; otherwise assign gray
		if (typeof val == "number" && !isNaN(val)){
			return colorScale(val);
		} else{
			return "#CCC";
		};
	};

})(); //Last line of main.js
