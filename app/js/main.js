/*
   Copyright 2022-2023, Guillermo Vega-Gorgojo

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

// INICIALIZACIÓN APLICACIÓN
async function inicializar() {
	// ajusto a idioma español si es necesario
	if (prefersSpanish()) 
		document.documentElement.lang = "es";

	// ajusto modal para iOS
	if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
		$("#mimodal").removeClass("fade"); // sin fade
		$("#mimodal").attr("data-backdrop", "static"); // static		
	}

	// INICIALIZACIÓN SESIÓN
	Sesion = {};
	
	// inicializo timeouts
	Sesion.timeout = config.timeout;
	Sesion.huboTimeout = false;	
		
	// bloqueo para pintar
	Sesion.actualizandoMapa = false; // bloqueo si se está actualizando el mapa
	Sesion.mapaMovido = false; // detecto si el mapa se movió para actualizar
	Sesion.idTimeoutActualizar = null; // id del timeout para actualización automática (para que no se bloquee)
	
	// datos de la vista
	Sesion.zoom = undefined;
	Sesion.zoomPrevio = undefined;
	Sesion.bounds = undefined;
	Sesion.cellN = undefined;
	Sesion.cellS = undefined;
	Sesion.cellE = undefined;
	Sesion.cellW = undefined;
	Sesion.cellSide = undefined;

	// datos num celdas para barra progreso
	Sesion.numCeldas = undefined;
	Sesion.progresoCeldas = 0;
		
	//datos del filtro de tipo de sitio
	Sesion.ts = undefined;
	Sesion.tsPrevio = undefined;
		
	// inicializo sugerencias tipos sitios
	Sesion.tsfocus = -1;
	
	// inicializo sugerencias lugares
	Sesion.lugarfocus = -1;
	Sesion.lugarselec = undefined;	
	
	// estado de la sesión
	Sesion.estado = {};
	
	// resourcePages contabiliza el número de páginas de recursos 
	// que lleva navegando para hacer un pop cuando corresponda
	// inicializo resourcePages a 0
	Sesion.estado.resourcePages = 0;
		
	// inicializo las celdas y lugares pintados
	Sesion.celdasPintadas = {};
	Sesion.lugaresPintados = {};

	// INICIALIZACIÓN DATOS
	Datos = {};
	Datos.tiposLugares = {}; // aquí meto la info de los tipos de lugares
	Datos.celdas = {}; // aquí meto la info de cada celda
	Datos.popupsArtworks = {}; // aquí meto los artworks a incluir en los popups de los marcadores
	Datos.lugares = {}; // aquí meto la información de cada sitio del mapa
	Datos.sites = {}; // aquí meto la información de cada site (independientemente de lo que hay en lugares) 
	Datos.obras = {}; // aquí meto la información de cada obra
	Datos.artistas = {}; // aquí meto la información de cada artista	
		
	// DETECCIÓN DE ANDROID CHROME
	//isAndroidChrome = indexOfNormalized(navigator.userAgent, "android") > -1 &&
	//	window.chrome != null && typeof window.chrome !== "undefined" && window.navigator.vendor === "Google Inc.";

	// CARGA INICIAL DE LA URL
	// 1) carga localización si la hay
	// 2) carga siteType sin comprobar existencia
	// 3) ajusta vista
	// 4) no hace nada en el mapa (que no está aún creado)
	cargarURL(true);

		
	// SI NO HAY POSICIÓN INICIAL, CARGO LA DE LA CONFIGURACIÓN Y PEDIRÉ GEOPOSICIONAR SI ESTOY EN EL MAPA
	let pedirgeopos = false;
	if (Sesion.estado.loc == undefined) {			
		pedirgeopos = Sesion.estado.type == undefined && Sesion.estado.uri == undefined; // sólo si está en el mapa
		Sesion.estado.loc = {
			lat: config.geolocstart[0],
			lng: config.geolocstart[1],
			z: config.zStart
		};
	}

	
	// CARGO MAPA CON LA LOCALIZACIÓN DE LA CONFIGURACIÓN
	// meto tap: false, que parece es una fuente de problemas
	Mimapa = L.map('mimapa', {zoomControl: false, tap: false} ).setView([Sesion.estado.loc.lat, Sesion.estado.loc.lng], Sesion.estado.loc.z);
	L.tileLayer(config.geotemplate, config.geooptions).addTo(Mimapa);
		
	// REPOSICIONO CONTROLES DE ZOOM Y MUESTRO ESCALA DEL MAPA
	L.control.scale( {imperial: false, position: 'bottomright'} ).addTo(Mimapa); // sin la escala imperial
	L.control.zoom( { position: 'bottomright',
		zoomInTitle: getLiteral(dict.zoomin),
		zoomOutTitle: getLiteral(dict.zoomout),
	} ).addTo(Mimapa);
	

	// INCLUYO BOTÓN DE MI LOCALIZACIÓN CON Leaflet.Locate (ver https://github.com/domoritz/leaflet-locatecontrol)
	L.control.locate({
	    position: 'bottomright',
	    icon: 'fa fa-street-view',
		locateOptions: { maxZoom: config.zPlace, animate: true, duration: 1 },
	    flyTo: true,
	    showPopup: false,
    	strings: {
        	title: getLiteral(dict.mylocation)
	    }
	}).addTo(Mimapa);	
	
	
	// INICIALIZACIÓN CRAFTS
	//console.group("Inicialización proveedor de datos");
	console.time("Configuración proveedor de datos");
	Crafts = new CraftsAPI(config.craftsConfig);
	Crafts.test()
		.then(() => {
			// OK
			console.info("Proveedor de datos funciona");						
			console.timeEnd("Configuración proveedor de datos");
			//console.groupEnd();
			
			// GA4: mando evento de crafts OK
			sendEvent('crafts_OK', { api: config.craftsConfig.api } );
			
			// CARGO PANEL (inicialmente desactivado el filtro de tipo de sitio)
			cargarPanel();

			// CONFIGURAR SOLR
			configurarSolr();
					
			// SI ES UN BOT, SÓLO CARGO LA URL
			if (navigator.userAgent === 'puppeteer') 
				cargarURL();
			else {
				// DETECCIÓN DE CAMBIOS EN EL MAPA
				Mimapa.on('moveend', mapaMovido);
						
				// CASO NO siteType
				// cargo directamente la URL sin esperar a tener los datos de los tipos de sitios
				if (Sesion.estado.siteType == undefined)
					cargarURL();	
						
				// INICIALIZACIÓN TIPOS DE LUGARES
				console.time("Inicialización tipos lugares");	
				initTiposLugares()
					.then(() => {
						console.info("Tipos de lugares cargados");	
						console.timeEnd("Inicialización tipos lugares");			
					
						// habilito el botón de filtrar por tipo (desactivado hasta ahora)
						$("#bot_types").removeAttr('disabled');					
					
						// CASO siteType
						if (Sesion.estado.siteType != undefined) {
							// si el siteType es válido
							if (Datos.tiposLugares[Sesion.estado.siteType] != undefined)
								tratarSeleccionTipoSitio(Sesion.estado.siteType);
							else
								cargarURL(); // aquí se eliminará el siteType espúreo
						}
					});
			}				
		})
		.catch(error => {
			console.error(error);
			console.timeEnd("Configuración proveedor de datos");
			//console.groupEnd();	
			
			// aviso y mando evento GA4
			errorProveedorDatosIrrecuperable(error);
		});
	
	
	// TIMESTAMP ACTUAL (para geoposición y para formulario)
	const ahora = Date.now();
	
	
	// VUELO A LA POSICIÓN DEL USUARIO SI QUIERE
	// sólo si usuario no dijo que no anteriormente o ha pasado el barbecho
	if (pedirgeopos && (localStorage.getItem('timestampPedirLoc') == undefined ||
				localStorage.getItem('timestampPedirLoc') < ahora)) {
		navigator.geolocation.getCurrentPosition( function(pos) {
			// mando evento GA4	
			sendEvent('geoloc_accepted', {});
			// vamos a la localización del usuario
			Mimapa.flyTo([ pos.coords.latitude, pos.coords.longitude], config.zMyloc);
		}, function(err) {
			// pongo barbecho si el usuario dijo que no
			// err.code 1 => https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
			if (err.code == 1) {
				// mando evento GA4	
				sendEvent('geoloc_rejected', {});
				// barbecho
				localStorage.setItem('timestampPedirLoc', ahora + config.mediumQuestGap); // barbecho de 4 días
			}
		}, {timeout: 5000, maximumAge:10*60*1000});
	} 
	
	// INICIALIZO LayerGroups DE MARCADORES DE CLUSTERS Y DE LUGARES
	MarcClusters = L.layerGroup().addTo(Mimapa);
	MarcLugares = L.layerGroup().addTo(Mimapa);
	
	
	// DETECCIÓN EVENTOS POPSTATE
	// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
	window.onpopstate = function(event) {
		// actualizado num de recursos a partir del evento (así vale si va para atrás o adelante)
		Sesion.estado.resourcePages = event.state.resourcePages;
				
		//console.warn("onpopstate - #rp: " + Sesion.estado.resourcePages);
				
		// cargo la URL
		cargarURL();
	};
		
	// INICIALIZACIÓN CUESTIONARIO
	// variables en localStorage
	// timestampMostrarCuestionario: timestamp a partir del cual es factible mostrar el cuestionario
	// si no había, inicializo timestampMostrarCuestionario primera sesión (mediumQuestGap)
	if (localStorage.getItem('timestampMostrarCuestionario') == undefined)
		localStorage.setItem('timestampMostrarCuestionario', ahora + config.mediumQuestGap);
	// detecto si debo mostrar el cuestionario en la sesión
	if (ahora > localStorage.getItem('timestampMostrarCuestionario')) {
		Sesion.ponerAlertaCuestionario = true; // puede ponerse el cuestionario en la sesión
		Sesion.inicioSesion = ahora; // guardo inicio sesión
	}
	else
		Sesion.ponerAlertaCuestionario = false;
}


/////////////////////
// CONFIGURACIÓN SOLR
/////////////////////
function configurarSolr() {
	//console.group("Inicialización motor de texto");
	console.time("Configuración motor de texto");
	
	// inicializo Solr
	Solr = new TextEngine(config.solrConfig.path + config.solrConfig.suggestHandler,
		config.solrConfig.path + config.solrConfig.selectHandler);
	Solr.test()
		.then(() => {
			// OK
			console.info("Motor de texto funciona");						
			console.timeEnd("Configuración motor de texto");
			//console.groupEnd();
			
			// GA4: mando evento de solr OK
			sendEvent('solr_OK', { path: config.solrConfig.path,
				lang_es: prefersSpanish() } );
		})
		.catch(messageError => {	
			// GA4: mando evento de error
			sendEvent('solr_error', { message: messageError });
			
			// log del error
			console.error(messageError);
			
			// pongo Solr a null y escondo la entrada de los lugares
			Solr = null;
			renderEntradaLugares(false);
			
			console.timeEnd("Configuración motor de texto");
			//console.groupEnd();
		});
}


////////////////////////
// ERROR PROVEEDOR DATOS
////////////////////////
function errorProveedorDatosIrrecuperable(messageError) {
	// ya no tiene sentido pedir datos
	Sesion.errordataprov = true; 
		
	// pongo un modal para avisar de que no se puede explorar el inventario
	let $modal = $(errorEndpointTemplate);
	$("body").append($modal);
	$("#errorEndpointModal").modal('show');
	
	// GA4: mando evento de error
	sendEvent('crafts_error', { message: messageError });

	// quito temporizador
	finActualizarMapa();
}


///////////////////
// CARGA DE LA URL
// la función clave
///////////////////
function cargarURL(inicial) {
	// 1) elimino del estado de la sesión varias cosas
	// quito filtro de tipo de sitio
	delete Sesion.estado.siteType;
	// quito recurso
	delete Sesion.estado.type;
	delete Sesion.estado.uri;
	// quito también los datos de paginación del recurso
	delete Sesion.estado.npage;
	delete Sesion.estado.search;

	// 2) actualizo el estado de la sesión a partir de la URL
	// parseo de la URL
	const urlParams = new URLSearchParams(window.location.search);		
	// actualizo localización si hay localización y está bien
	// en otro caso no borro la localización que hubiera
	const cadloc = urlParams.get('loc');
	if (cadloc != null) {
		const loc = string2loc(cadloc);
		if (loc != null) 
			Sesion.estado.loc = loc;
	}	
	// incluyo filtro de tipo de sitio si está presente o si es el caso inicial (antes de cargar los tipos de sitios)
	if (urlParams.get('siteType') != undefined) {
		let st = urlParams.get('siteType');
		// incluyo el filtro de tipo de sitio si existe
		if (Datos.tiposLugares[st] != undefined || inicial) 
			Sesion.estado.siteType = st;
	} 	// incluyo type y uri si están presentes AMBOS
	else if (urlParams.get('type') != undefined && urlParams.get('uri') != undefined) {
		// de momento type sólo puede ser Site o Artwork
		if (urlParams.get('type') === 'Site' || urlParams.get('type') === 'Artwork'|| urlParams.get('type') === 'Artist') {
			try {
				new URL(urlParams.get('uri'));
				// datos del recurso bien, guardo en el estado de la sesión
				Sesion.estado.type = urlParams.get('type');
				Sesion.estado.uri = urlParams.get('uri');
				
				// datos de paginación del recurso
				const npage = urlParams.get('npage');
				if (npage != undefined && !isNaN( Number(npage) ) && npage > 0)
					Sesion.estado.npage = npage;
				Sesion.estado.search = urlParams.get('search');							
			} catch(err) {
				// uri errónea, no hago nada
			}
		}
	}

	//3) ajusto vista según el estado cargado
	if (Sesion.estado.type != undefined && Sesion.estado.uri != undefined) {	
		// MODO RECURSO
		// bloqueo actualizaciones del mapa mientras carga recurso
		Sesion.actualizandoMapa = true;
		
		// escondo mapa y muestro página del recurso
		$("#mimapa").addClass("d-none");
		$("#mirecurso").html(''); // borro contenido página
		$("#mirecurso").removeClass("d-none");
		// actualizo viewport (puede ampliarse)
		$("#myviewport").attr("content","width=device-width, initial-scale=1, shrink-to-fit=no");
		
		// llamo a mostrar la página del recurso
		if (!inicial)
			mostrarPaginaRecurso(Sesion.estado.type, Sesion.estado.uri);
	} else {
		// MODO MAPA
		// actualizo título de la página
		document.title = getLiteral(dict.map) + ' - ' + config.title;
		
		// AJUSTE PROPIEDADES META
		// ajuste propiedad meta de la url
		$("meta[property='og:url']").attr('content', window.location);
		// title
		$("meta[property='og:title']").attr('content', document.title);
		// image
		$("meta[property='og:image']").attr('content', "https://lod4culture.gsic.uva.es/app/images/snapshot2.png");
		// description
		$("meta[property='og:description']").attr('content', getLiteral(dict.mapDesc));					
					
		/* no acaba de ir fino y me rompe otros dispositivos => lo quito
		// en Android Chrome obligo en dispositivos táctiles a mostrar la barra de direcciones
		// https://stackoverflow.com/questions/24480571/is-it-possible-to-programmatically-show-url-bar-in-chrome-for-android	
		if (isAndroidChrome) {
			document.documentElement.requestFullscreen();
			setTimeout(function () {
				document.exitFullscreen();
				setTimeout(function () {
					scrollTo(0, 0);
				}, 200);
			}, 200);	
		}*/
		
		// reseteo número de páginas de recursos e indico que ya hay mapa
		Sesion.estado.resourcePages = 0;
		Sesion.estado.hayMapa = true;
		
		// desbloqueo actualizaciones del mapa 
		Sesion.actualizandoMapa = false;
	
		// escondo recurso y muestro mapa
		$("#mirecurso").html(''); // borro contenido página
		$("#mirecurso").addClass("d-none");
		$("#mimapa").removeClass("d-none");
		// actualizo viewport (escala fijada)
		$("#myviewport").attr("content","width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no");
		
		// rehago para tratar aquí el tratamiento visual de los tipos de filtro		
		if (!inicial) {
			if (Sesion.estado.siteType == undefined) {
				// escondo el contenido
				$("#filtro_type").addClass("d-none");		
			} else {
				// pongo etiqueta y url
				const et = getLiteral(dict.filtering) +' <strong>' + Datos.tiposLugares[Sesion.estado.siteType].lab + '</strong>';
				$("#div_label_filtro_type").html(et);
				$("#bot_info_filtro_type").attr("url", Sesion.estado.siteType);
				// hago visible el filtro
				$("#filtro_type").removeClass("d-none");
			}
		}
		
		// centro el mapa en la localización del estado de la sesión
		// esto dispara un evento de mapa movido, disparando su actualización en MODO MAPA
		if (!inicial)
			Mimapa.setView([Sesion.estado.loc.lat, Sesion.estado.loc.lng], Sesion.estado.loc.z);
		
		// incluyo esto para que el mapa se reajuste
		// parece que así se resuelve el problema que había al pasar de recurso a mapa
		// tengo que poner esto después del setview, en otro caso no reacciona al setview
		if (!inicial)
			Mimapa.invalidateSize();
	}
}



// BUCLE DE CONTROL DEL MAPA
function mapaMovido() {
	if (Sesion.errordataprov == undefined) {
		if (Sesion.actualizandoMapa) {
			Sesion.mapaMovido = true; // pendiente de actualizar el mapa...
			console.log("Mapa movido: actualización de mapa pendiente...");
		}
		else {
			// actualizo info de tipo de sitio
			Sesion.tsPrevio = Sesion.ts;
			Sesion.ts = Sesion.estado.siteType;
		
			// actualizo zoom
			Sesion.zoomPrevio = Sesion.zoom;
			Sesion.zoom = Mimapa.getZoom();	
			// analizo si hubo cambio zoom y recalculo cosas en tal caso
			if (Sesion.zoomPrevio !== Sesion.zoom) {
				// ajusto grid según zoom, bounds y config.zDegreesStep4
				const potencia = Math.pow(2, Sesion.zoom - 4);
				//console.log("Potencia: " + potencia);						
				Sesion.cellSide = config.zDegreesStep4/potencia;				
				
				// obtengo número de decimales a extraer para las celdas 
				// (utilizando la milésima parte de la medida del lado de la celda)
				const millCellSide = Number.parseFloat(Sesion.cellSide/1000).toExponential();
				//console.log("Grados lado celda/1000: " + millCellSide);
				Sesion.cellNdecs = Number(millCellSide.substring(millCellSide.indexOf("-") + 1));
				// obtengo también el factor de redondeo celda
				let factor = "1";
				for (let i=0; i<Sesion.cellNdecs; i++)
					factor += "0";
				factor = Number(factor);
				Sesion.cellFactor = factor;
			}
		
			// voy con los bounds y grid de celdas
			Sesion.bounds = Mimapa.getBounds();
			Sesion.cellN = Math.floor( Sesion.bounds.getNorth() / Sesion.cellSide );
			Sesion.cellS = Math.floor( Sesion.bounds.getSouth() / Sesion.cellSide );
			Sesion.cellE = Math.floor( Sesion.bounds.getEast() / Sesion.cellSide );
			Sesion.cellW = Math.floor( Sesion.bounds.getWest() / Sesion.cellSide );
			
			/* INFO
			const x = Sesion.bounds.getEast() - Sesion.bounds.getWest();
			const y = Sesion.bounds.getNorth() - Sesion.bounds.getSouth();
			const nctx = 1 + Math.floor(x/Sesion.cellSide);
			const ncty = 1 + Math.floor(y/Sesion.cellSide);			
			const nct = nctx * ncty;
			console.log("Zoom " + Sesion.zoom + " - Num celdas teóricas: " + nct);
			console.log("GRADOS celda z" + Sesion.zoom + ": " + Sesion.cellSide );
			console.log("GRADOS X: " + x + " - nctx: " + nctx + " - ncx: " + (1 + Sesion.cellE - Sesion.cellW) );
			console.log("GRADOS Y: " + y + " - ncty: " + ncty + " - ncy: " + (1 + Sesion.cellN - Sesion.cellS) );
			console.log("Num celdas teor: " + nct);
			console.log("Num celdas: " + (1 + Sesion.cellE - Sesion.cellW)*(1 + Sesion.cellN - Sesion.cellS) );
			
			// INFO
			console.log("Filtro de tipo de sitio: " + Sesion.ts);
			console.log("Nivel de zoom: " + Sesion.zoom);
			console.log("Map bounds - west: " + Sesion.bounds.getWest() + " - east: " + Sesion.bounds.getEast() 
				+ " - north: " + Sesion.bounds.getNorth() + " - south: " + Sesion.bounds.getSouth());
			let objpars = {
				"type" : Sesion.ts,
				"latsouth" : Sesion.bounds.getSouth(),
				"latnorth" : Sesion.bounds.getNorth(),
				"lngwest" : Sesion.bounds.getWest(),
				"lngeast" : Sesion.bounds.getEast()
			};
			const url = config.craftsConfig.api + Mustache.render(config.craftsConfig.querySitesBox, objpars);			
			console.log(url);
			console.warn("N: " + objpars.latnorth + " | S: " + objpars.latsouth + " | W: " + objpars.lngwest + " | E: " + objpars.lngeast);
			
			console.log("Grados lado celda: " + Sesion.cellSide);
			console.log("Num decimales: " + Sesion.cellNdecs);
			console.log("Celda Norte: " + Sesion.cellN);
			console.log("Celda Oeste: " + Sesion.cellW);
			console.log("Celda Sur: " + Sesion.cellS);
			console.log("Celda Este: " + Sesion.cellE);*/
			
			// actualizo el mapa
			actualizarMapa();			
		}
	}
}
async function actualizarMapa() {
	inicioActualizarMapa();
	const idtimeout = Sesion.idTimeoutActualizar;
	
	//console.log("Zoom: " + Sesion.zoom);
	//console.log("Zoom previo: " + Sesion.zoomPrevio);
	
	// inicializo
	let zoomout = false;
	
	// si hubo un cambio de filtro de tipo de sitio borro todo
	if (Sesion.ts !== Sesion.tsPrevio) {		
		MarcLugares.clearLayers(); // quito marcadores sitios
		MarcClusters.clearLayers(); // quito marcadores clusters
		Sesion.celdasPintadas = {}; // ninguna celda pintada
		Sesion.lugaresPintados = {}; // ningún marcador de lugar
	} 
	else if (Sesion.zoom != Sesion.zoomPrevio) { // CAMBIO DE ZOOM => fuera clusters y a repintar cada celda 
		MarcClusters.clearLayers(); // quito marcadores clusters
		Sesion.celdasPintadas = {}; // obligo a pintar cada celda
		// marco zoomout
		if (Sesion.zoom < Sesion.zoomPrevio)
			zoomout = true;
	}
	
	// inicializo promesas
	let promesas = [];
	
	// incluyo número de celdas en EventData
	addEventData('num_cells', Sesion.numCeldas);
	
	// trabajo celda a celda
	for (let x=Sesion.cellW; x<=Sesion.cellE; x++) {
		for (let y=Sesion.cellS; y<=Sesion.cellN; y++) {
			// preparo objeto de la celda
			const objcelda = {
				type: Sesion.ts,
				zoom: Sesion.zoom,
				cellSide: Sesion.cellSide,
				cellX: x,
				cellY: y,
				et: 'z' + Sesion.zoom+ '_x' + x + '_y' + y+'_'+Sesion.ts
			}
				
			/* INFO
			console.warn("N: " + Math.ceil((objcelda.cellY + 1) * objcelda.cellSide * Sesion.cellFactor) / Sesion.cellFactor
			 + " | S: " + Math.floor(objcelda.cellY * objcelda.cellSide * Sesion.cellFactor) / Sesion.cellFactor
			  + " | W: " + Math.floor(objcelda.cellX * objcelda.cellSide * Sesion.cellFactor) / Sesion.cellFactor
			   + " | E: " + Math.ceil((objcelda.cellX + 1) * objcelda.cellSide * Sesion.cellFactor) / Sesion.cellFactor);*/
			
			// le enchufo también un render
			objcelda.render = function() {
				/* INFO rendering celdas
				console.log("RENDER CELDA " + objcelda.et);
				if (Datos.lugaresCeldas[objcelda.et] == undefined && Datos.numLugaresCeldas[objcelda.et] == 0)
					console.log(" => 0 marcadores");
				else if (Datos.lugaresCeldas[objcelda.et] == undefined && Datos.numLugaresCeldas[objcelda.et] > 0)
					console.log(" => cluster " + Datos.numLugaresCeldas[objcelda.et] );
				else
					console.log(" => " + Datos.numLugaresCeldas[objcelda.et] + " marcadores");*/					
					
				// reajuste de longitud por el antimeridiano
				// nciclos será un entero menor que 0 para longitudes menores de -180
				// nciclos será un entero mayor que 0 para longitudes mayores de -180
				const nciclos = Math.floor((objcelda.cellX*Sesion.cellSide + Sesion.cellSide/2 + 180)/360);
			
				// sólo hago el rendering si coincide el zoom y el filtro de type con el de la sesión
				if (objcelda.zoom === Sesion.zoom && objcelda.type === Sesion.ts) {
					// actualizo progreso y llamo a pintar la barra de progreso
					Sesion.progresoCeldas++;
					pintarBarraProgreso(true);				
					// el rendering...
					if (Sesion.celdasPintadas[objcelda.et] == undefined) {
						// recupero mi celda
						const mycell = Datos.celdas[objcelda.et];
						
						// LIMPIEZA CASO ZOOM-OUT (si toca cluster borramos los marcadores que aglutina)
						if (zoomout && mycell.lugares == undefined) { // hay que borrar todo!
							// preparo objeto bounds de la celda
							const bounds = L.latLngBounds([
								[objcelda.cellY * Sesion.cellSide, objcelda.cellX * Sesion.cellSide],
								[(objcelda.cellY + 1) * Sesion.cellSide, (objcelda.cellX + 1) * Sesion.cellSide]
							]);
							// borrado de lugares en la celda
							let lborrar = [];
							MarcLugares.eachLayer(function(l) {
								if( bounds.contains(l.getLatLng()) ) {
									// guardo el lugar
									lborrar.push(l);
								}
							});							
							for (let i=0; i<lborrar.length; i++) {						
								MarcLugares.removeLayer(lborrar[i]);
								// borro también el lugar de Sesion.lugaresPintados
								delete Sesion.lugaresPintados[ lborrar[i].uri ];
							}
						}
						
						// CLUSTERS: si no hay lugares, pinto un cluster con el número
						if (mycell.lugares == undefined && mycell.numl > 0) {							
							// pongo el cluster en el sitio más popular cercano o si no hay en el centro de la celda
							// incluyo longitud con tratamiento de antimeridiano
							const mLatLng = mycell.popLoc != null ?
								L.latLng( mycell.popLoc.lat, mycell.popLoc.lng + nciclos*360 ) :
								L.latLng( objcelda.cellY*Sesion.cellSide + Sesion.cellSide/2, objcelda.cellX*Sesion.cellSide + Sesion.cellSide/2);							
							// preparo icono
							const micon = new L.divIcon({
								html: '<div class="marcadorTexto"><span>' + mycell.numl + '</span></div>',
							    className: '',	
							    iconSize: [48, 48],
								iconAnchor:   [24, 24], // point of the icon which will correspond to marker's location
								tooltipAnchor:[12, 0], // point from which tooltips will "open", relative to the icon anchor
							});
							// pongo marcador con +3 de zoom al hacer click
							const cpint = L.marker(mLatLng, { icon: micon, zIndexOffset: Number(mycell.numl) } ) // uso número de lugares como zindex
								.on('click', function(e) { // añado aquí también handler de click
									if (Mimapa.getZoom() <= config.zPlace) // sólo si el zoom no es muy grande
										Mimapa.flyTo(mLatLng, Sesion.zoom + 3); })
								//.on('dblclick', function(e) { Mimapa.flyTo(mLatLng, Sesion.zoom + 2); }) // añado aquí también handler de dblclick
								.addTo(MarcClusters);							
							// añado tooltip si no es táctil
							if (!(('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)))								
								cpint.bindTooltip(mycell.numl + getLiteral(dict.nsites));
						} 
						else if (mycell.lugares != undefined) {
							// LUGARES: pinto un marcador por cada sitio en la celda
							for (let i=0; i<mycell.lugares.length; i++) {
								const luri = mycell.lugares[i];
								
								// sólo pinto lugar si no estaba libre (para evitar efectos borde entre celdas)
								if (Sesion.lugaresPintados[luri] == undefined) {
									// inicializo objeto lugar con los datos necesarios
									let lobj = {};
									lobj.uri = luri;
									lobj.image = Datos.lugares[luri].image;
									// incluyo este renombramiento para evitar warning: "Cargando contenido visual mixto (no seguro) en una página segura"
									if (lobj.image != undefined)
										lobj.image = lobj.image.replace('http://', 'https://');
									// incluyo longitud con tratamiento de antimeridiano
									lobj.latLng = L.latLng(Datos.lugares[luri].lat, Datos.lugares[luri].lng + nciclos*360);
									lobj.label = getLiteral(Datos.lugares[luri].label);
									lobj.desc = firstUppercase(getLiteral(Datos.lugares[luri].desc));
									lobj.acronym = getAcronym(lobj.label, 3);
									// obtengo puntuación y valoración de PRO o no
									lobj.score = getResourceScore(Datos.lugares[luri]);
									lobj.pro = esRecursoPRO(Datos.lugares[luri]);
									// obtengo tamaño icono dependiendo de si es pro o no
									const isize = lobj.pro? 56 : 48;
																
									// obtengo html del icono
									const iconhtml = Mustache.render(iconSiteTemplate, lobj);
									// genero icono
									const micon = new L.divIcon({
										html: iconhtml,
										className: '',	
										iconSize: [isize, isize],
										iconAnchor: [isize/2, isize/2], // point of the icon which will correspond to marker's location
										tooltipAnchor:[12, 0] // point from which tooltips will "open", relative to the icon anchor
									});
									
									// obtengo html del popup
									const popuptml = Mustache.render(popupSiteTemplate, lobj);
									
									// ajusto zindex con la puntuación del marcador (más populares arriba)
									let mpint = L.marker(lobj.latLng, { icon: micon, zIndexOffset: lobj.score } )										
										.on('click', async function(e) { 
											// preparo posición para mover mapa al clickar (1 celda más alto para que se vea mejor el marcador)
											const potencia = Math.pow(2, Mimapa.getZoom() - 4);											
											const inclat = config.zDegreesStep4/potencia;	
											const nuevoLatLng = L.latLng( lobj.latLng.lat + inclat, lobj.latLng.lng );
											Mimapa.flyTo(nuevoLatLng);
											// detecto si hace falta obtener los artworks
											if (mpint.artworksPending) {
												// recupero los artworks y los guardo
												lobj.artworks = await getArtworksSite(mpint.uri);
												// indico si hay artworks y si los hay escojo uno al azahar para arrancar el carrusel
												if (lobj.artworks.length == 0)
													lobj.noartworks = true;
												else {
													lobj.noartworks = false;
													const ind = Math.floor(Math.random() * lobj.artworks.length);
													lobj.artworks[ind].active = true;												
												}												
												// genero el nuevo html del popup
												const pophtmlpro = Mustache.render(popupSiteTemplatePRO, lobj);
												// se lo enchufo
												this.bindPopup(pophtmlpro);												
												// quito el flag
												delete mpint.artworksPending;												
												// rotación cada 2 segundos
												$('.carousel').carousel({ 'interval': 2500 });
												
												// pongo aquí el handler porque regenero el marcador y no captura bien el evento
												// handler botón más info para ir a la página del recurso
												$('.moreinfo').click(function() {		
													// mando evento GA4	
													sendEvent('select_content', {
														content_type: "more_info",
														item_id: $(this).attr("uri")
													});			
													// compruebo si es un sitio o un artwork
													const type = $(this).hasClass("site")? "Site" : "Artwork";			
													// una página de recursos más (siempre será 1 al partir de 0)
													Sesion.estado.resourcePages++;
													// reajusto url y creo nueva página en la historia
													const url = window.location.pathname + '?type='+type+'&uri=' + $(this).attr("uri");			
													history.pushState(Sesion.estado, "", url);
													// cargo la url
													cargarURL();
												});
											}											
										}) // añado aquí también handler de click
										.bindPopup(popuptml)
										.addTo( MarcLugares );
									
									// le añado también la uri (para poder borrarlo en caso de zoom out)
									mpint.uri = luri;
									// le añado también un flag para que pida los artworks
									mpint.artworksPending = true;

									// reactivo y paro el carrusel
									mpint.on('popupopen', function(e) {
										// Find the popup element
									  	let popup = this._popup._container;
									  	// Find the carousel within the popup
									 	let carousel = popup.querySelector('.carousel');
									  	// Start the carousel
									  	$(carousel).carousel('cycle');
									  	
									  	// pongo aquí el handler para escuchar los eventos al abrir el popup
										// handler botón más info para ir a la página del recurso
										$('.moreinfo').click(function() {		
											// mando evento GA4	
											sendEvent('select_content', {
												content_type: "more_info",
												item_id: $(this).attr("uri")
											});			
											// compruebo si es un sitio o un artwork
											const type = $(this).hasClass("site")? "Site" : "Artwork";			
											// una página de recursos más (siempre será 1 al partir de 0)
											Sesion.estado.resourcePages++;
											// reajusto url y creo nueva página en la historia
											const url = window.location.pathname + '?type='+type+'&uri=' + $(this).attr("uri");			
											history.pushState(Sesion.estado, "", url);
											// cargo la url
											cargarURL();
										});
									});
									mpint.on('popupclose', function(e) {
									  	// Find the popup element
									  	let popup = this._popup._container;
									  	// Find the carousel within the popup
									  	let carousel = popup.querySelector('.carousel');
									  	// Stop the carousel
									  	$(carousel).carousel('pause');
									});
									
									// añado tooltip si no es táctil
									if (!(('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)))
										mpint.bindTooltip(lobj.label);
									
									// si es el lugar seleccionado abro el popup
									if (Sesion.lugarselec === luri)	 {
										mpint.openPopup();
										Sesion.lugarselec = undefined;
									}
									
									// guardo lugar pintado
									Sesion.lugaresPintados[luri] = mpint;
								}							
							}						
						} // fin else lugares
											
						// actualizo las celdas pintadas
						Sesion.celdasPintadas[objcelda.et] = true;
					}
				}
			};
			// hago la petición de datos de sitios de la celda
			promesas.push( processSitesCell(objcelda) );
		}
	}
	
	// espero a que terminen todas las promesas
	await Promise.all(promesas);
	
	// llamo a fin de actualizar mapa
	finActualizarMapa();
}
function inicioActualizarMapa() {
	// mapa actual
	Sesion.mapaMovido = false;
	// quito timeout anterior (importante llamar tras Sesion.mapaMovido = false)
	finActualizarMapa();
	// pongo bloqueo a actualizaciones
	Sesion.actualizandoMapa = true;
	
	// escondo botón home y muestro botón spinner
	$("#bot_home").addClass("d-none");
	$("#bot_spinner").removeClass("d-none");
	
	// inicializo num de celdas y pinto la barra de progreso
	Sesion.numCeldas = (1 + Sesion.cellE - Sesion.cellW)*(1 + Sesion.cellN - Sesion.cellS);	
	Sesion.progresoCeldas = 0;	
	pintarBarraProgreso(true);
	
	// actualizo la localización del estado de la sesión
	Sesion.estado.loc.lat = Mimapa.getCenter().lat;
	Sesion.estado.loc.lng = Mimapa.getCenter().lng;
	Sesion.estado.loc.z = Mimapa.getZoom();
		
	// reajusto url y actualizo página en la historia
	let url = window.location.pathname + '?loc=' + loc2string(Sesion.estado.loc);
	if (Sesion.estado.siteType != undefined) // incluyo filtro de tipo de sitio si está incluido en el estado de la sesión
		url += '&siteType=' + Sesion.estado.siteType;
	history.replaceState(Sesion.estado, "", url);
	
	// ajuste propiedad meta de la url
	$("meta[property='og:url']").attr('content', window.location);
		
	// pongo timeout para que quite el bloqueo tras 10 segundos (por si acaso se bloquea indefinidamente)
	Sesion.idTimeoutActualizar = setTimeout(function(){	
		// GA4: mando evento de timeout a GA	
		sendMapTimeoutEvent();
		// aviso
		console.warn("Venció el temporizador de " +  Math.round(Sesion.timeout/1000) + " segundos antes de terminar de actualizar el mapa");
		console.groupEnd();
		Sesion.actualizandoMapa = false;
		Sesion.idTimeoutActualizar = null;
		// actualizo timeout
		Sesion.timeout += config.timeoutStep;
		Sesion.huboTimeout = true;		
		// y llamo a mapaMovido
		mapaMovido();
	}, Sesion.timeout); // era 10000
	// logging
	console.group("I" + Sesion.idTimeoutActualizar + " - Actualizando mapa");
	console.time("Actualización I" + Sesion.idTimeoutActualizar);
	console.log("URL: " + window.location);
	//console.log(" -> bloqueando actualizaciones y poniendo temporizador antibloqueo: " + Sesion.idTimeoutActualizar);
	
	// GA4: inicializo el evento de mapa para enviar a Google Analytics
	initMapEvent();
}
function finActualizarMapa() {
	//console.log(" -> fin de actualización del mapa, quito temporizador antibloqueo");
	Sesion.actualizandoMapa = false; // quito bloqueo
	Sesion.mapaIni = false; // ya no estamos en la fase inicial
	// escondo la barra de progreso
	pintarBarraProgreso(false);
	// cancelo timeout anterior (si existiera)
	if (Sesion.idTimeoutActualizar != null) {
		clearTimeout(Sesion.idTimeoutActualizar);
		if (EventData != undefined)
			console.log("#num_cells: " + EventData.num_cells + " - #crafts_requests: " + EventData.crafts_reqs);
		console.timeEnd("Actualización I" + Sesion.idTimeoutActualizar);
		console.info("I" + Sesion.idTimeoutActualizar + " - Fin actualización del mapa");
		console.groupEnd();
		Sesion.idTimeoutActualizar = null;
		// actualización timeout
		if (!Sesion.huboTimeout) // si no hubo timeout, inicializo al valor inicial
			Sesion.timeout = config.timeout;
		Sesion.huboTimeout = false; // inicializo para la siguiente
		
		// GA4: mando evento de fin de actualización del mapa
		sendMapEvent();	
	}	
	
	// muestro botón home y escondo botón spinner
	$("#bot_home").removeClass("d-none");
	$("#bot_spinner").addClass("d-none");
		
	// llamo a actualizar el mapa si es necesario
	if (Sesion.mapaMovido) {
		console.info("El mapa se había movido, vuelvo a actualizar");
		mapaMovido();
	}
	else if (Sesion.ponerAlertaCuestionario) {
		// miro si pongo el cuestionario
		const ahora = Date.now();
		if (ahora - Sesion.inicioSesion > config.sessionQuestGap) {
			// pongo el cuestionario
			$("#mimapa").append(alertQuestionnaireTemplate);
			// ya no lo vuelvo a poner en la sesión
			Sesion.ponerAlertaCuestionario = false;			
			// y pongo los handlers de los botones
			$("#questbotyes").click(function() {
				// mando evento GA4	
				sendEvent('select_content', {
					content_type: "feedback",
					item_id: "quest_yes"
				});
								
				// actualizo timestampMostrarCuestionario (LONG)
				localStorage.setItem('timestampMostrarCuestionario', ahora + config.longQuestGap);
				// quito la alerta
				$("#questalert").alert('close');		
				// vamos al questionario (nueva pestaña)
				let questurl = $(this).attr("questurl");
				let win = window.open(questurl, '_blank');
				win.focus();
			});
			$("#questbotno").click(function() {
				// mando evento GA4	
				sendEvent('select_content', {
					content_type: "feedback",
					item_id: "quest_no"
				});
								
				// actualizo timestampMostrarCuestionario (LONG)
				localStorage.setItem('timestampMostrarCuestionario', ahora + config.longQuestGap);
				// quito la alerta
				$("#questalert").alert('close');
			});
			$("#questbotlater").click(function() {
				// mando evento GA4	
				sendEvent('select_content', {
					content_type: "feedback",
					item_id: "quest_later"
				});
				
				// reajusto timestampMostrarCuestionario (MEDIUM)
				localStorage.setItem('timestampMostrarCuestionario', ahora + config.mediumQuestGap);
				// quito la alerta
				$("#questalert").alert('close');
			});		
		}
	}
}
function pintarBarraProgreso(mostrar) {
	if (mostrar) {	
		// muestro la barra de progreso
		$("#mibarradiv").removeClass('d-none');		
		// ajusto progreso
		const porc = Math.floor((100*Sesion.progresoCeldas)/Sesion.numCeldas);
		$("#mibarra").attr("style","width: "+porc+"%");
		$("#mibarra").attr("aria-valuenow", porc);
		$("#mibarra").html(porc+"%");
		//console.warn("Progreso: " + Sesion.progresoCeldas + "/" + Sesion.numCeldas + " (" + porc + "%)");
	} else // escondo la barra
		$("#mibarradiv").addClass('d-none');
}
