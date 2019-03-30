/* Stylesheet by Buck E. Badger, 2015 */


//Begin script when window loads
window.onload = setMap();

function setMap(){

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

	//Use promises instead of queue to parallelize asynchronous data loading
	let europeCountriesData = d3.csv("data/EuropeCountries.csv");
	let europeCountriesGeo = d3.json("data/EuropeCountries_Geo.topojson");
	let franceRegionsGeo = d3.json("data/FranceRegions_Geo.topojson");

	console.log("I'm just a pending promise so I load ASAP. Expand Me (europeCountriesData) --> ", europeCountriesData);
	console.log("I'm just a pending promise so I load ASAP. Expand Me (europeCountriesGeo) --> ", europeCountriesGeo);
	console.log("I'm just a pending promise so I load ASAP. Expand Me (franceRegionsGeo) --> ", franceRegionsGeo);


	//OPTION #1

	promises = [europeCountriesData, europeCountriesGeo, franceRegionsGeo];

	Promise.all(promises).then(function(values){
		console.log(values);
		let europeCountriesData = values[0];
		console.log("I'm a csv promise. --> ", europeCountriesData);
		let europeCountries = topojson.feature(values[1], values[1].objects.EuropeCountries_Geo);
		console.log("I'm a topojson promise converted to geojson. --> ", europeCountries);
		let	franceRegions = topojson.feature(values[2], values[2].objects.FranceRegions).features;
		console.log("I'm a topojson promise converted to geojson. --> ", franceRegions);

	//End OPTION #1

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

		//Add Europe countries to the map
		let countries = map.append("path")
			.datum(europeCountries)
			.attr("class", "countries")
			.attr("d", path);

		//Add France regions to the map
		let regions = map.selectAll(".regions")
			.data(franceRegions)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "regions " + d.properties.adm1_code;
			})
			.attr("d", path);
	});


/*
	//OPTION #2

	europeCountriesData.then(function(values){
		console.log("I'm a resolved promise. (europeCountriesData) --> ", values);
	});

	europeCountriesGeo.then(function(values) {
		console.log("I'm part of the Europe Countries promise so I have to wait to load until the promise is resolved.");
		let europeCountries = topojson.feature(values, values.objects.EuropeCountries_Geo);
		console.log("I'm a topojson promise converted to geojson. --> ", europeCountries);
	});

	franceRegionsGeo.then(function(values) {
		console.log("I'm part of the France Regions promise so I have to wait to load until the promise is resolved.");
		let franceRegions = topojson.feature(values, values.objects.FranceRegions);
		console.log("I'm a topojson promise converted to geojson. --> ", franceRegions);
	});
*/

	console.log("I'm not a promise so I load ASAP even though I come after all the other crap in the setMap() function.");
};
