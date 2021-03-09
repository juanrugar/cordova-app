/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

//THIS VERSION USES THE BARCELONA CULTURA API REST SERVICE https://barcelonadadescultura.bcn.cat/dades-obertes/
//CRS url (index.html): https://dades.eicub.net


// Fragment 03 -->
// Añadir función global
var createOverlay = function (position) {
	var ll = [position.coords.latitude, position.coords.longitude];
	var result = L.circle(ll, {
		color: "#FF0000",
		fillColor: "#FF0000",
		fillOpacity: 0.2,
		radius: position.coords.accuracy || 50
	});

	var $popupContent = $("<div>");
	var $popupContentPosition = $("<div>");
	$popupContentPosition.text("" + ll);
	var $popupContentTimestamp = $("<div>");
	var date = new Date(position.timestamp);
	$popupContentTimestamp.text(date.toLocaleString());
	$popupContent.append($popupContentPosition, $popupContentTimestamp);

	result.bindPopup($popupContent[0]);

	return result;
};
// <-- Fragment 03


// Fragment 04 -->
var createExhibitOverlay = function (map, exhibition) {
	var result = L.circleMarker([exhibition.Latitud, exhibition.Longitud], {
		"color": "#000000",
		"fillColor": "#D2691E",
		"fillOpacity": 0.8,
		"radius": 8
	});
	return result;
};
// <-- Fragment 04

// Fragment 05 -->
var literals = {
	"exhibitOverlay": {
		"listButton": "Ver en mapa...",
		"mapButton": "Ver en lista...",
		"fields": {
			"Equipament": "Equipament:",
			"TipusEquipament": "Tipus:",
			"Ambit": "Àmbit:",
			"Districte": "Districte:",
			"Any": "Any",
			"Visitants": "Visitants (milers):"
		}
	}
};

var createExhibitDetails = function (exhibition) {
	var $dl = $("<dl>");
	["Equipament", "TipusEquipament", "Ambit", "Districte", "Visitants"].forEach(	//"Any",
		function (propName) {
			var name = literals.exhibitOverlay.fields[propName] || propName;
			var id = propName;
			var value = exhibition[propName];

			var $dt = $("<dt>");
			$dt.text(name);
			$dl.append($dt);
			var $dd = $("<dd>");
			$dd.attr("data-id", id);
			$dd.text(value);
			$dl.append($dd);
		});
	return $dl;
};
// <-- Fragment 05




// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

// Fragment 04 --> HERE WE SET THE URL OF THE REST SOURCE
var promiseFetch = fetch("https://dades.eicub.net/api/1/museusexposicions-visitants?Any=2019"); //https://api.citybik.es/v2/networks/bicing

promiseFetch = promiseFetch.then(
	function (response) {
		console.log("Procesando respuesta a fetch...");

		// https://developer.mozilla.org/en-US/docs/Web/API/Response
		if (!response.ok) {
			throw new Error(response.status + ": " + response.statusText);
		}
		return response.json();
	});

promiseFetch = promiseFetch.catch(
	function (error) {
		console.error("Ocurrió un error en el proceso", error);
		return {
			"exhibition": {	//"network": {
				"Array": []	//"stations": []
			}
		};
	});

// <-- Fragment 04
function onDeviceReady() {
	// Cordova is now initialized. Have fun!

	console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
	document.getElementById('deviceready').classList.add('ready');

	// Fragment 02 -->
	// https://leafletjs.com/examples/quick-start/
	// Seleccionar elemento "app", vaciarlo, y configurar como elemento para el mapa.
	var $div = $("div.app");
	$div.empty();
	$div.removeClass("app");
	$div.addClass("application");

	// Añadir clase "master" al elemento body para poder aplicar estilos
	var $body = $("body");
	$body.addClass("master");

	// Fragment 06 -->
	// Crear elemento para vista lista
	var $divListView = $("<div>");

	// Ocultar elemento lista
	$divListView.css("display", "none");
	$divListView.addClass("list-view");
	$div.append($divListView);

	// Crear elemento para vista mapa
	var $divMapView = $("<div>");
	$divMapView.addClass("leaflet-map");
	$div.append($divMapView);
	// <-- Fragment 06

	// Fragment 03 -->
	var overlay;
	// <-- Fragment 03

	// Crear el map y añadir handler para evento "load" 
	// Fragment 06 -->
	var map = L.map($divMapView[0]);
	// var map = L.map($div[0]);

	// <-- Fragment 06
	map.on("load", function (e) {
		console.log("map load event handler", e, this);
		// Fragment 03 -->
		// https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-geolocation/
		navigator.geolocation.getCurrentPosition(
			function (position) {
				console.log("Posición", position);
				if (overlay) {
					overlay.remove();
				}
				var latLng = [position.coords.latitude, position.coords.longitude];
				map.setView(latLng, 16);
				overlay = createOverlay(position);
				overlay.addTo(map);
			},
			function (error) {
				console.error("Ocurrió un error al obtener la posición", error);
			},
			{
				"timeout": 3000
			});
		// <-- Fragment 03

		// Fragment 04 -->
		// mapOverlays nos permitirá obtener un overlay a partir de un id de estación.
		var mapOverlays = {};

		// Fragment 05 -->
		var popup = L.popup();
		// <-- Fragment 05

		promiseFetch.then(
			function (exhibition) {
				console.log("exhibition", exhibition);

				//here's Colin's filtering snipet START -->
				exhibition = exhibition.filter(
					function (item) {
						if (!item.Latitud || !item.Longitud) {
							console.warn("Unlocated exhibition", item);
						}
						return item.Latitud && item.Longitud;
					});
				console.log("exhibition (filtered)", exhibition);

				//Colin's filtering snipet 	END -->

				exhibition.forEach(
					function (exhibition) {
						var overlay = createExhibitOverlay(map, exhibition);
						overlay.on("click",
							function (event) {
								console.log("Exhibition overlay - click event handler", event, this);

								// Fragment 05 -->
								// Crear lista de definiciones (dl) con elementos título (dt)/definición (dd)
								var $content = $("<div>");
								var $dl = createExhibitDetails(exhibition);
								$content.append($dl);

								// Fragment 06 -->
								//var $button = $("<button>");
								// <-- Fragment 06

								// Mostrar contenido en el popup
								// "this" referencia el overlay
								var latLng = this.getLatLng();
								popup.setLatLng(latLng);
								popup.setContent($content[0]);
								popup.openOn(map);
								// <-- Fragment 05
							});
						// Añadir referencia al overlay a mapOverlays
						mapOverlays[exhibition.id] = overlay;
						overlay.addTo(map);
					});
			});
		// <-- Fragment 04

		// Fragment 06 -->
		//promiseFetch.then(

		// <-- Fragment 06
	});

	// Posicionar mapa. Luego la posición cambiará por la geolocalización
	map.setView([41.3976, 2.1965], 13);

	// http://geoserveis.icc.cat/icc_mapesmultibase/noutm/wmts/topo/GRID3857/18/132666/97898.jpeg
		var icgc = L.tileLayer("https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/{id}/{z}/{x}/{y}.jpeg", {
			"attribution": '<a href="https://geoserveis.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya</a>',
			"maxZoom": 19,
			"id": 'topo/GRID3857'
		});	
	
	//Basemap from OpenStreetMap (https://wiki.openstreetmap.org/wiki/Standard_tile_layer)
	var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		"maxZoom": 19,
		"attribution": '&copy; <a href="http://www.openstreetmap.org/copyright"/>OpenStreetMap</a>'
	});

	osm.addTo(map);

	var baseLayers = {
		"icgc" : icgc,
		"osm" : osm
	}

	var layerControl = L.control.layers(baseLayers, null, {collapsed: false});

	layerControl.addTo(map);
	
	// <-- Fragment 02
}
