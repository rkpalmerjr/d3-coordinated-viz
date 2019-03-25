/* Stylesheet by Buck E. Badger, 2015 */


//Begin script when window loads
window.onload = setMap();

function setMap(){

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
		let	franceRegions = topojson.feature(values[2], values[2].objects.FranceRegions);
		console.log("I'm a topojson promise converted to geojson. --> ", franceRegions);
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
