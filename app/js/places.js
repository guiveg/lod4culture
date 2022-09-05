/*
   Copyright 2022, Guillermo Vega-Gorgojo

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/////////////////////
// RENDER DEL CAJETÍN
function renderEntradaLugares(mostrar) {
	if (mostrar && Solr != null)
		$('#lugares_heading').removeClass("d-none");
	else
		$('#lugares_heading').addClass("d-none");
}

///////////////////////////
// OBTENCIÓN DE SUGERENCIAS
async function obtenerSugerencias(entrada, types) {
	// hago una petición por type para poder diferenciar el tipo de la sugerencia
	let promesas = []; // inicializo promesas
	// preparo suggesters principal y secundario
	const suggesterPrinc = prefersSpanish()? config.solrConfig.suggester.es : config.solrConfig.suggester.en;
	const suggesterSec = prefersSpanish()? config.solrConfig.suggester.en : config.solrConfig.suggester.es;
	// inicializo resultados
	let resultados = [];

	// creo una promesa para cada petición
	for (let i=0; i<types.length; i++) {
		// preparo emoji adecuado (la razón para cambiar esto)
		let emoji = '';
		if (types[i] === "Site")
			emoji = '🏛️ ';
		else if (types[i]=== "Artwork")
			emoji = '🖼️ ';
		else if (types[i] === "Artist")
			emoji = '🧑‍🎨️ ';
		else if (types[i] === "Location")
			emoji = '🏠 ';
		// creo una promesa para cada petición
		promesas.push( new Promise(async function(resolve, reject) {
			try {
				// hago la llamada a solr y espero resultados
				const datos = await Solr.getSuggestions(entrada, types[i]);
				// objeto para comprobar si meter las sugerencias secundarias
				let urisprinc = {}; 
				// extraigo sugerencias principales
				let keys = Object.keys(datos.suggest[suggesterPrinc]);
				if (keys.length > 0) {				
					for (let i=0; i<datos.suggest[suggesterPrinc][keys[0]].suggestions.length; i++) {
						// preparo elemento
						const el = {
							uri: datos.suggest[suggesterPrinc][keys[0]].suggestions[i].payload,
							label: emoji + datos.suggest[suggesterPrinc][keys[0]].suggestions[i].term,
							score: datos.suggest[suggesterPrinc][keys[0]].suggestions[i].weight  // incremento un 10%
								+ Math.floor( datos.suggest[suggesterPrinc][keys[0]].suggestions[i].weight ),
							type: types[i]
						}
						// guardo elemento y uri
						resultados.push(el);
						urisprinc[el.uri] = true;
					}
				}
				// extraigo sugerencias secundarias ÚNICAS
				keys = Object.keys(datos.suggest[suggesterSec]);
				if (keys.length > 0) {				
					for (let i=0; i<datos.suggest[suggesterSec][keys[0]].suggestions.length; i++) {
						// sólo guardo si es único
						const uri = datos.suggest[suggesterSec][keys[0]].suggestions[i].payload;
						if (urisprinc[uri] == undefined) {					
							// preparo elemento
							const el = {
								uri: uri,
								label: emoji + datos.suggest[suggesterSec][keys[0]].suggestions[i].term,
								score: datos.suggest[suggesterSec][keys[0]].suggestions[i].weight,
								type: types[i]
							}
							// guardo elemento
							resultados.push(el);
						}
					}
				}	
				// resuelvo la promesa
				resolve(true);
			} catch(err) {
				reject(err);
			}
		}) );
	}
	// aquí espero a que terminen todas las promesas
	await Promise.all(promesas);
	// ordeno las sugerencias de las tres peticiones
	resultados = _.sortBy(resultados, "score").reverse();
	// devuelvo el slice
	return resultados.slice(0, config.maxSolrSuggestions);
}

/////////////////////
// RENDER SUGERENCIAS
function renderSugerenciasLugares(resultados) {
	// objeto sugerencias
	let sinfo = {};
	sinfo.sugerencias = resultados;
	if (resultados.length == 0)
		sinfo.nosugerencias = true;
	
	// muestro sugerencias
	const cont = Mustache.render(sugeLugaresTemplate, sinfo);
	$("#sugelugares").html(cont);
		
	// handler de los botones de sugerencias de lugares
	$(".bot_suge_lugar").click(async function() {
		// obtengo uri de la sugerencia
		const uri= $(this).attr("uri");
		// pedimos la información del lugar
		const datos = await Solr.getDocument(uri);
		// si hay algo, vamos al primero
		if (datos.response.numFound > 0) 
			seleccionarLugar(datos.response.docs[0]);
	});
	
	// inicializo focus
	Sesion.lugarfocus = -1;
}

///////////////
// AJUSTE FOCUS
function ajustarLugarfocus() {
	// Sesion.lugarfocus = 0; => cajetín entrada
	// Sesion.lugarfocus = i; => num de sugerencia
	// obtengo número de sugerencias
	var ns = $("#sugelugares").children(":enabled").length;
	// reajusto índice del focus si hace falta
	if (ns == 0) Sesion.lugarfocus = -1;
	else if (Sesion.lugarfocus >= ns) Sesion.lugarfocus = 0;
	else if (Sesion.lugarfocus < 0) Sesion.lugarfocus = ns -1;
	// y ahora las cosas visuales
	$("#sugelugares").children().removeClass("active");
	if (Sesion.lugarfocus >= 0)
		$("#sugelugares").children().eq(Sesion.lugarfocus).addClass("active");
}

////////////////////
// SELECCIONAR LUGAR
async function seleccionarLugar(lugar) {	
	// pongo nombre	en la entrada
	const label = prefersSpanish()? lugar.labes : lugar.laben;	
	$("#in_lugares").val(label);
	
	// escondo la lista de sugerencias
	$("#sugelugares").addClass("d-none");
	
	// inicializo focus
	Sesion.lugarfocus = -1;
	
	// si es un lugar me quedo en el mapa	
	if (lugar.type === 'Location' || lugar.type === 'Site') {	
		// si ya está pintado el marcador del lugar, abro el popup
		const marc = Sesion.lugaresPintados[lugar.id];
		if (marc != undefined)
			marc.openPopup();
		else // si no, guardo el lugar seleccionado para que abra el popup
			Sesion.lugarselec = lugar.id;
		
		// coordenadas
		const coords = [lugar.lat, lugar.lng];	
	
		// mando evento GA4	
		sendEvent('select_content', {
			content_type: "site_selection",
			item_id: lugar.id,
			label: label
		});
	
		// navegamos al lugar
		Mimapa.flyTo(coords, config.zPlace, {animate: true, duration: 1});
	}
	else { // se trata de un recurso
		// aprovecho lo que tenía de recursos
		go2resource(lugar.type, lugar.id, label);	
	}
	
	// pongo nuevas sugerencias para cuando vuelva a recibir el focus
	const sugs = await obtenerSugerencias(label, ["Location", "Site", "Artwork", "Artist"]);
	renderSugerenciasLugares(sugs);
	
	// escondo la lista de sugerencias
	$("#sugelugares").addClass("d-none");
}
