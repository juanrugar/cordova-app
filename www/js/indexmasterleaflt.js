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

// Fragment 03 -->
// Añadir función global
var createOverlay = function (position) {
	var ll = [position.coords.latitude, position.coords.longitude];
	var result = L.circle(ll, {
		color: "rgba(255,0,0,0.8)",
		fillColor: "rgba(255,0,0,0.3)",
		fillOpacity: 1,
		radius: position.coords.accuracy || 100
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
		"color": "rgba(0,255,0,0.8)",
		"fillColor": "rgba(0,255,0,0.3)",
		"fillOpacity": 1,
		"radius": 10
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
	["Equipament", "TipusEquipament", "Ambit", "Districte", "Any", "Visitants"].forEach(
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
var promiseFetch = fetch("https://dades.eicub.net/api/1/museusexposicions-visitants?Any=2019&format=json"); //https://api.citybik.es/v2/networks/bicing
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
	map.on("load",
		function (e) {
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
				function (exhibition) 
				{	
					console.log("exhibition", exhibition);
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
									var $button = $("<button>");
									$button.attr("type", "button");
									$button.text(literals.exhibitOverlay.mapButton);
									$button.on("click",
										function (event) {
											console.log("Popup button click");
											event.stopPropagation();

											$divMapView.css("display", "none");
											$divListView.css("display", "");

											// Asegurar que el elemento es visible en la lista, y abrir detalles
											var $liselected = $("li[data-id=" + exhibition.id + "]", $divListView);
											if ($liselected.length > 0) {
												$liselected[0].scrollIntoView();
												var $details = $("div.exhibition-data", $liselected);
												$details.css("display", "");
											}
										});
									$content.append($button);
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
			promiseFetch.then(
				function (exhibition) {
					// Crear elemento list sin orden (ul) para contener las estaciones
					var $ul = $("<ul>");
					exhibition.forEach(
						function (exhibition) {
							// Crear elemento de lista (li) para la estación, y añadir identificador para poderlo seleccionar
							// desde código.
							var $li = $("<li>");
							$li.attr("data-id", exhibition.id);

							// Crear elemento con nombre de la estación
							var $div = $("<div>");
							$div.addClass("exhbition-name");
							$div.text(exhibition.name);
							$li.append($div);

							var $divData = $("<div>");
							$divData.css("display", "none");
							$divData.addClass("exhibition-data");
							var $dlData = createExhibitDetails(exhibition);
							$divData.append($dlData);
							// Fragment 06 -->
							// Botón detalles lista
							var $button = $("<button>");
							$button.attr("type", "button");
							$button.text(literals.exhibitOverlay.listButton);
							$button.on("click",
								function (event) {
									console.log("List details button click");
									event.stopPropagation();

									$divListView.css("display", "none");
									$divMapView.css("display", "");
									// Asegurar que el mapa todo el elemento (si todavía no se ha visuaizado, es
									// posible que no lo hará)
									map.invalidateSize();

									// Centrar mapa en marcador de la estación
									var overlay = mapOverlays[exhibition.id];
									if (overlay) {
										var ll = overlay.getLatLng();
										map.flyTo(ll);
										overlay.fire("click");
									}
								});
							// Cuidado - hay error en el fragmento, el botón se ha de añadir al elemento $divData
							$divData.append($button);
							// $details.append($button);

							// <-- Fragment 06
							$li.append($divData);
							$li.on("click",
								function (event) {
									// Evitar que el evento llega a otras elementos
									event.stopPropagation();

									$divData.toggle();
								});

							$ul.append($li);
						});
					$divListView.append($ul);
				});
			// <-- Fragment 06
		});

	// Posicionar mapa. Luego la posición cambiará por la geolocalización
	map.setView([41.3976, 2.1965], 13);

	// http://geoserveis.icc.cat/icc_mapesmultibase/noutm/wmts/topo/GRID3857/18/132666/97898.jpeg
	var tileLayer = L.tileLayer("https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/{id}/{z}/{x}/{y}.jpeg", {
		"attribution": '<a href="https://geoserveis.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya</a>',
		"maxZoom": 20,
		"id": 'topo/GRID3857'
	});

	tileLayer.addTo(map);
	// <-- Fragment 02
}
