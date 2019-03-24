/* Stylesheet by Buck E. Badger, 2015 */


//Begin script when window loads
window.onload = setMap();

/*function setMap(){
	//Use queue to parallelize asynchronous data loading
	d3.queue()
		.defer(d3.csv, "data/EuropeCountries.csv")
		.defer(d3.json, "data/EuropeanCountries_Geo.topojson")
		.defer(d3.json, "data/FranceRegions_Geo.topojson")
		.await(callback);

	function callback(error, test1, test2, test3){
		console.log();
	};
};*/

function setMap(){
	//Use promises instead of queue to parallelize asynchronous data loading
	let europeCountriesData = d3.csv("data/EuropeCountries.csv");
	let europeCountriesGeo = d3.json("data/EuropeCountries_Geo.topojson");
	let franceRegionsGeo = d3.json("data/FranceRegions_Geo.topojson");

	console.log("I'm just a pending promise so I load ASAP. Expand Me (europeCountriesData) --> ", europeCountriesData);
	console.log("I'm just a pending promise so I load ASAP. Expand Me (europeCountriesGeo) --> ", europeCountriesGeo);
	console.log("I'm just a pending promise so I load ASAP. Expand Me (franceRegionsGeo) --> ", franceRegionsGeo);

	europeCountriesData.then(function(values){
		console.log("I'm a resolved promise. (europeCountriesData) --> ", values);
	});
/*	europeCountriesGeo.then(function(values){
		console.log("I'm a resolved promise. (europeCountriesGeo) --> ", values);
	});
	franceRegionsGeo.then(function(values){
		console.log("I'm a resolved promise. (franceRegionsGeo) --> ", values);
	});*/

	europeCountriesGeo.then(function(values) {
		console.log("I'm part of the Europe Countries promise so I have to wait to load until the promise is resolved.");
		let europeCountries = topojson.feature(values, values.objects.EuropeCountries_Geo).features;
		console.log("I'm a topojson promise converted to geojson. --> ", europeCountries);
	});

	franceRegionsGeo.then(function(values) {
		console.log("I'm part of the France Regions promise so I have to wait to load until the promise is resolved.");
		let franceRegions = topojson.feature(values, values.objects.FranceRegions).features;
		console.log("I'm a topojson promise converted to geojson. --> ", franceRegions);
	});

	console.log("I'm not a promise so I load ASAP even though I come after all the other crap in the setMap() function.");
};
