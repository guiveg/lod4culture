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

// PANEL DE CONTROL
function cargarPanel() {
	//  panel de control de info
	Info = L.control({'position':'topleft'});
	Info.onAdd = function (map) {
		// creo div con clases "card" de bootstrap y "mipanel"
		this._div = L.DomUtil.create('div', 'mipanel card ml-1 ml-sm-2 mt-1 mt-sm-2');		
		return this._div;
	};
	Info.init = function () {
		// inicializo el panel detectando si es móvil para poner padding
		// no consigo ajustar el padding por defecto, así que uso Mustache
		const obj = {
			esmovil: screen.width < 576
		};
		const cardhtml = Mustache.render(cardTemplate, obj);
		$(".mipanel").html(cardhtml);
		
		// HANDLERS
		// icono casa
		$('#bot_home').click(function() {
			// mando evento GA4	
			sendEvent('select_content', {
				content_type: "home",
				item_id: window.location.origin
			});
			
			// vamos a la landing page
			window.location.href = '../index.html';
		});		
		
		// quitar filtro de tipo de sitio
		$("#bot_quitar_tipo").click(function() {
			// mando evento GA4	(sólo si hay tipo)
			if (Sesion.estado.siteType != undefined) {
				sendEvent('select_content', {
					content_type: "remove_site_type_filter",
					item_id: Sesion.estado.siteType,
					label: Datos.tiposLugares[Sesion.estado.siteType].lab
				});
			}
			
			// reajusto url y actualizo página en la historia
			const url = window.location.pathname + '?loc=' + loc2string(Sesion.estado.loc);
			history.replaceState(Sesion.estado, "", url);
	
			// cargo la URL
			cargarURL();
		});
		
		// muestro info del tipo de filtro en un iframe
		$("#bot_info_filtro_type").click(function() {
			// extraigo url
			const url = $(this).attr("url");
			// pongo título al modal
			$("#mimodaltitle").text( Datos.tiposLugares[url].lab );
			// preparo iframe y lo incluyo
			const snippet =	'<iframe class="embed-responsive-item" src="' + url.replace('http://', 'https://') + '" sandbox></iframe>';
			$("#miiframediv").html(snippet);
			// TODO: el iframe enreda la historia de la sesión si se pincha en enlaces, pero no veo manera buena de evitarlo
			// muestro modal
			$('#mimodal').modal();
			// GA4: mando evento
			sendEvent('select_content', {
				content_type: "type_site_url",
				item_id: url,
				label: Datos.tiposLugares[url].lab
			});
		});		
						
		// detecto cambios en la entrada de lugares
		// "search" es para detectar si el usuario hizo click en la X del formulario (clear button)
		$("#in_lugares").on("keyup search", async function(e) {				
			// trato las teclas de arriba, abajo y enter			
			if (e.which == 13) { // tecla ENTER
				// sólo actúo si hay al menos una sugerencia (y habilitada)
				if ($("#sugelugares").children(":enabled").length > 0) {
					// si no había ninguna sugerencia seleccionada activo la primera
					if (Sesion.lugarfocus == -1) {
						Sesion.lugarfocus = 0;
						ajustarLugarfocus();
					}
					// y ahora vamos al lugar seleccionado
					$("#sugelugares").children(":enabled").eq(Sesion.lugarfocus).click();
				}
			}
			else if (e.which == 40) { // tecla ABAJO			
				// incremento focus
				Sesion.lugarfocus++;
				ajustarLugarfocus();				
			}
			else if (e.which == 38) { // tecla ARRIBA
				// decremento focus
				Sesion.lugarfocus--;
				ajustarLugarfocus();
			}
			else if (e.which != undefined) { // caso normal
				// actúo según la entrada
				let entrada = $(this).val();
				if (entrada.length == 0) {// no hay entrada
					$("#sugelugares").html("");
					$("#sugelugares").addClass("d-none");
				}
				else {// obtengo sugerencias y hago su render
					$("#sugelugares").removeClass("d-none");
					const sugs = await obtenerSugerencias(entrada, ["Location", "Site", "Artwork", "Artist"]);
					renderSugerenciasLugares(sugs);
					// mando evento GA4 si la entrada > 2
					if (entrada.length > 2) {
						sendEvent('search', {
							search_term: entrada,
							content: "sites"
						});
					}
				}
			}
			else  {
				// caso de la X del formulario... (quito las sugerencias)
				let entrada = $(this).val();
				if (entrada.length == 0) {// no hay entrada
					$("#sugelugares").html("");
					$("#sugelugares").addClass("d-none");
				}
			}
		}).focusin(function() {			
			// vuelve el focus, muestro las sugerencias si hay algo
			let entrada = $(this).val();
			if (entrada.length > 0)
				$("#sugelugares").removeClass("d-none");			
		}).focusout(function() {
			// si pierde el focus escondemos las sugerencias tras un delay
			// el delay es importante para que se pueda clickar un botón antes de eliminar las sugerencias
			setTimeout(function(){
				if (!$("#in_lugares").is(":focus")) // si vuelve el focus no escondo
					$("#sugelugares").addClass("d-none");	
					//$("#sugemunis").html("");
			}, 300);			
		});

		// handler de tipos de sitios
		$("#bot_types").click(handlerTipoSitio);		
	};
	
	// incluyo el panel en el mapa
	Info.addTo(Mimapa);
		    
    // si es terminal táctil desactivo los eventos de dragging del mapa en el panel del formulario
    if (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
    	Info.getContainer().addEventListener('touchstart', function () {
    		Mimapa.dragging.disable();
    	}); 
    	Info.getContainer().addEventListener('touchend', function () {
    		Mimapa.dragging.enable();
    	});
    } else { // para terminales no táctiles desactivo los listeners del mapa al entrar en el panel del formulario
    	// Disable dragging, scrollWheelZoom and doubleClickZoom when user's cursor enters the element
		Info.getContainer().addEventListener('mouseover', function () {
			Mimapa.dragging.disable();
			Mimapa.scrollWheelZoom.disable();
			Mimapa.doubleClickZoom.disable();
		});
		// Re-enable dragging, scrollWheelZoom and doubleClickZoom when user's cursor leaves the element
		Info.getContainer().addEventListener('mouseout', function () {
			Mimapa.dragging.enable();
			Mimapa.scrollWheelZoom.enable();
			Mimapa.doubleClickZoom.enable();
		});
    }
	
	// inicializo panel
	Info.init();
}

// HANDLER FILTRAR TIPO DE SITIO
function handlerTipoSitio() {
	// obtengo nuevo estado del botón
	const activar = !$("#bot_types").hasClass("active");
	
	// mando evento GA4
	sendEvent('select_content', {
		content_type: "type_site_taxonomy",
		item_id: activar? 'show' : 'hide'
	});
		
	// pongo el botón activo o no
	if (activar)
		$("#bot_types").addClass("active");
	else 
		$("#bot_types").removeClass("active");
	
	// render de la selección de tipo de sitio
	renderSeleccionTipoSitio(activar);
}
function renderSeleccionTipoSitio(activar) {
	// RENDER ENTRADA LUGARES (para que no interfiera)
	renderEntradaLugares(!activar);		

	// BÚSQUEDA CON ENTRADA DE TEXTO Y SUGERENCIAS DE TIPOS DE SITIOS
	if (activar) {
		// rendering del subheading
		const content = Mustache.render(typesSubheadingTemplate, {'activar': activar} );
		$("#types_subheading").html(content);
		$("#types_subheading").removeClass("d-none");
		// handler de buscar tipo sitio...
		$("#in_types").on("keyup search", function(e) {
			// trato las teclas de arriba, abajo y enter			
			if (e.which == 13) { // tecla ENTER
				// actúo según el focus
				if (Sesion.tsfocus == -1)	{ // ninguna sugerencia seleccionada
					// si hay al menos una sugerencia (y habilitada) voy a la primera
					if ($("#sugetypes").children(":enabled").length > 0)
						$("#sugetypes").children(":enabled").eq(0).click();
				}
				else // obtengo la sugerencia y vamos a ella
					$("#sugetypes").children().eq(Sesion.tsfocus).click();
			}
			else if (e.which == 40) { // tecla ABAJO
				// incremento focus
				Sesion.tsfocus++;
				ajustarTipofocus();
			}
			else if (e.which == 38) { // tecla ARRIBA
				// decremento focus
				Sesion.tsfocus--;
				ajustarTipofocus();
			}
			else { // caso normal
				const entrada = $(this).val();		
				// analizo la cadena de entrada
				if (entrada.length < 1) { // está vacía: muestro la taxonomía y elimino las sugerencias
					$("#types_block").removeClass("d-none");
					$("#sugetypes").html("");
				}
				else {	// hay algo: muestro sugerencias y escondo la taxonomía
					$("#types_block").addClass("d-none");
					// obtengo sugerencias de tipos de sitios
					const suges = sugeTiposSitios(entrada);
					// renderizo las sugerencias
					renderSugeTiposSitios(entrada, suges);
					// mando evento GA4 si la entrada > 2
					if (entrada.length > 2) {
						sendEvent('search', {
							search_term: entrada,
							content: "type_sites"
						});
					}
				}
			}
		});
	} 
	else
		$("#types_subheading").addClass("d-none");	
	
	// NAVEGACIÓN ONTOLOGÍA DE TIPOS
	if (activar) { // mostrar el bloque de contenido de las especies
		$("#types_block").removeClass("d-none");
		// ¿caso inicial?
		if ($("#types_block").html() == "") {
			// cojo los tipos top
			const indice = 0;						
			// generate aux object for the template
			let auxobj = [];
			for (let i=0; i<config.topTypes.length; i++) {
				const turi = config.topTypes[i];
				// calculo score si hace falta		
				if (Datos.tiposLugares[turi].score == undefined)
					Datos.tiposLugares[turi].score = contarIndividuosSubclases(turi, 3);			
				let tobj = {
					indice: indice,
					uri: turi,
					label: Datos.tiposLugares[turi].lab,
					nosubclasses: Datos.tiposLugares[turi].subclasses.length == 0,
					score: Datos.tiposLugares[turi].score
				};
				// añado objeto si score mayor que 0
				if (tobj.score > 0)
					auxobj.push(tobj);
			}
		
			// sort elements
			auxobj = _.sortBy(auxobj, 'score').reverse();
			
			// reformateo score para millones y miles
			for (let i=0; i<auxobj.length; i++) {	
				if (auxobj[i].score > 1000000)
					auxobj[i].score = "+" + Math.floor(+auxobj[i].score/1000000) + "M";
				else if (auxobj[i].score > 1000)
					auxobj[i].score = "+" + Math.floor(+auxobj[i].score/1000) + "K";
			}
	
			// show more button
			if (auxobj.length > config.hidemax) {
				// include fake element for the button
				auxobj.splice(config.hidebegin, 0, { "botonesconder" : true, "indice" : indice });
				for (let ind = config.hidebegin + 1; ind < auxobj.length; ind++)
					auxobj[ind].esconder = true;						
			}

			// generate content and add	to the DOM
			const content = Mustache.render(typesBlockTemplate, auxobj);	

			// pongo el contenido
			$("#types_block").html(content);			

			// HANDLERS
			// handler de seleccionar tipo de sitio
			$(".bot_sel_tipo").click(handlerSeleccionarTipoSitio);
			// handler de expandir tipo
			$(".bot_expandir_tipo").click(handlerExpandTipoSitio);
			// handler de showmore
			$(".showmore").click(handlerShowmore);
		}
		else // simplemente mostrar lo que tenía
			$("#types_block").removeClass("d-none");
	}
	else // esconder el bloque de contenido de los tipos
		$("#types_block").addClass("d-none");
}


//////////////////////////////
// AUX CUENTA INDIVS SUBCLASES
//////////////////////////////
// versión rápida con concats y un uniq al final (con _.union va mucho más lento)
function contarIndividuosSubclases(turi, niveles) {
	if (Datos.tiposLugares[turi] == undefined)
		return null;
	let allturis = [ ]; // aquí guardo todos los tipos a considerar 
	let ituris = [ turi ];
	for (let j=0; j<1+niveles; j++) { // 0 es la iteración del tipo inicial
		// meto las uris de la iteración
		allturis = allturis.concat(ituris);
		// preparo las uris de la iteración siguiente
		let nituris = [];
		for (let k=0; k<ituris.length; k++) {
			if (Datos.tiposLugares[ituris[k]] != undefined && Datos.tiposLugares[ituris[k]].subclasses != undefined)
				nituris = nituris.concat(Datos.tiposLugares[ituris[k]].subclasses);
		}
		// reajusto ituris
		ituris = nituris;
	}
	// quito duplicados
	allturis = _.uniq(allturis);
	// obtengo suma de los individuos en allturis	
	let cuenta = 0;
	for (let j=0; j<allturis.length; j++) {
		if (Datos.tiposLugares[allturis[j]] != undefined)
			cuenta += Datos.tiposLugares[allturis[j]].count;
	}
	
	return cuenta;
}


//////////////////////
// HANDLER SUGERENCIAS
//////////////////////
function sugeTiposSitios(entrada) {
	let sugerencias = [];
	// sólo actúo si la entrada no es una cadena vacía
	if (entrada.length > 0) {
		// obtengo las uris de los tipos de sitios
		const turis = Object.keys(Datos.tiposLugares);
		// evalúo cada tipo si vale
		for (let i=0; i<turis.length; i++) {
			// obtengo etiqueta del tipo
			let lab = Datos.tiposLugares[turis[i]].lab;
			// si coincide, a las sugerencias
			if (indexOfNormalized(lab, entrada) > -1)
				sugerencias.push(turis[i]);
		}
	}
	return sugerencias;
}
function renderSugeTiposSitios(entrada, sugerencias) {
	// preparo sugerencias
	let tinfo = {};
	tinfo.sugerencias = [];
		
	// obtengo las sugerencias si la entrada no está vacía
	if (sugerencias.length == 0)
		tinfo.nosugerencias = true;
	else {
		for (let i=0; i<sugerencias.length; i++) {
			// calculo score si hace falta
			if (Datos.tiposLugares[sugerencias[i]].score == undefined)
				Datos.tiposLugares[sugerencias[i]].score = contarIndividuosSubclases(sugerencias[i], 3);
			// preparo objeto
			let sobj = {			
				uri: sugerencias[i],
				//labelshown: Datos.tiposLugares[sugerencias[i]].lab,
				score: Datos.tiposLugares[sugerencias[i]].score
			};
			// sólo añado el objeto si el score es positivo
			if (sobj.score > 0) {
				tinfo.sugerencias.push(sobj);
				// añado etiqueta formateada en negritas
				const label = Datos.tiposLugares[sugerencias[i]].lab;
				const ind = indexOfNormalized(label, entrada);
				sobj.labelshown = "";
				if (ind > 0)
					sobj.labelshown += label.substr(0, ind);
				sobj.labelshown += "<strong>" + label.substr(ind, entrada.length) + "</strong>"
				sobj.labelshown += label.substr(ind + entrada.length);
			}
		}
	}
		
	// ordeno sugerencias por score
	tinfo.sugerencias = _.sortBy(tinfo.sugerencias, 'score').reverse();
			
	// corto número de sugerencias
	tinfo.sugerencias = tinfo.sugerencias.slice(0, config.numsugs);
		
	// reformateo score para millones y miles
	for (let i=0; i<tinfo.sugerencias.length; i++) {	
		if (tinfo.sugerencias[i].score > 1000000)
			tinfo.sugerencias[i].score = "+" + Math.floor(+tinfo.sugerencias[i].score/1000000) + "M";
		else if (tinfo.sugerencias[i].score > 1000)
			tinfo.sugerencias[i].score = "+" + Math.floor(+tinfo.sugerencias[i].score/1000) + "K";
	}
	
	// muestro sugerencias
	const cont = Mustache.render(sugeTypesTemplate, tinfo);
	$("#sugetypes").html(cont);
			
	// handler de los botones de sugerencias
	$(".bot_suge_type").click(handlerSeleccionarTipoSitio);
	
	// inicializo focus
	Sesion.espfocus = -1;
}
function ajustarTipofocus() {
	// Sesion.tsfocus = 0; => cajetín entrada
	// Sesion.tsfocus = i; => num de sugerencia
	// obtengo número de sugerencias que no están deshabilitadas
	const ns = $("#sugetypes").children(":enabled").length;
	//if (ns == 1 && $("#sugetypes").children().eq(0)  )// corrección por si no es una sugerencia real
	// reajusto índice del focus si hace falta
	if (ns == 0) Sesion.tsfocus = -1;
	else if (Sesion.tsfocus >= ns) Sesion.tsfocus = 0;
	else if (Sesion.tsfocus < 0) Sesion.tsfocus = ns -1;
	// y ahora las cosas visuales
	$("#sugetypes").children().removeClass("active");
	if (Sesion.tsfocus >= 0)
		$("#sugetypes").children().eq(Sesion.tsfocus).addClass("active");
}


///////////////////////////
// HANDLER NAVEGACIÓN TIPOS
///////////////////////////
function handlerExpandTipoSitio() {
	// obtengo i para el icono
	let $i = $(this).find("i");
	let $div = $(this).closest(".sitetype");
	
	if ($(this).hasClass("active")) { // colapsar
		// desactivo botón
		$(this).removeClass("active");
		// pongo otro icono
		$i.removeClass("fa-chevron-down");
		$i.addClass("fa-chevron-right");
				
		// mando evento GA4
		const turi = $div.find(".bot_sel_tipo").attr("turi");
		sendEvent('select_content', {
			content_type: "collapse_site_type",
			item_id: turi,
			label: Datos.tiposLugares[turi].lab
		});
		
		// itero para quitar los elementos de la lista
		const indice = +$div.attr("indice");
		do {
			var $nextdiv = $div.next();
			var fin = true;
			if (+$nextdiv.attr("indice") > indice) {
				$nextdiv.remove();
				fin = false;
			}				
		} while (!fin);
	}
	else { // expandir
		// activo botón
		$(this).addClass("active");
		// pongo otro icono
		$i.removeClass("fa-chevron-right");
		$i.addClass("fa-chevron-down");
		
		// get uri of the class and new indice (one more)
		const turi = $div.find(".bot_sel_tipo").attr("turi");
		const newindice = +$div.attr("indice") + 1;
		let indentspace = "";
		for (let ind = 0; ind < newindice; ind++) 
			indentspace += "&nbsp;&nbsp;&nbsp;";
		
		// generate aux object for the template
		let auxobj = [];
		for (let i=0; i<Datos.tiposLugares[turi].subclasses.length; i++) {
			const sturi = Datos.tiposLugares[turi].subclasses[i];
			// sólo meto las clases que estén definidas
			if (Datos.tiposLugares[sturi] != undefined) {
				// calculo score si hace falta		
				if (Datos.tiposLugares[sturi].score == undefined)
					Datos.tiposLugares[sturi].score = contarIndividuosSubclases(sturi, 3);			
				let stobj = {
					indice: newindice,
					indentspace: indentspace,
					uri: sturi,
					label: Datos.tiposLugares[sturi].lab,
					nosubclasses: Datos.tiposLugares[sturi].subclasses.length == 0,
					score: Datos.tiposLugares[sturi].score
				};
				// añado objeto si score mayor que 0
				if (stobj.score > 0) 
					auxobj.push(stobj);
			}
		}
		
		// sort elements
		auxobj = _.sortBy(auxobj, 'score').reverse();
		
		// reformateo score para millones y miles
		for (let i=0; i<auxobj.length; i++) {	
			if (auxobj[i].score > 1000000)
				auxobj[i].score = "+" + Math.floor(+auxobj[i].score/1000000) + "M";
			else if (auxobj[i].score > 1000)
				auxobj[i].score = "+" + Math.floor(+auxobj[i].score/1000) + "K";
		}
		
		// show more button
		if (auxobj.length > config.hidemax) {
			// include fake element for the button
			auxobj.splice(config.hidebegin, 0, { "botonesconder" : true, "indice" : newindice });
			for (let ind = config.hidebegin + 1; ind < auxobj.length; ind++)
				auxobj[ind].esconder = true;						
		}

		// generate content and add	to the DOM
		const newcontent = Mustache.render(typesBlockTemplate, auxobj);							
		$div.after(newcontent);
		
		// mando evento GA4
		sendEvent('select_content', {
			content_type: "expand_site_type",
			item_id: turi,
			label: Datos.tiposLugares[turi].lab
		});		
		
		// handler de seleccionar tipo de sitio
		$(".bot_sel_tipo").off('click');
		$(".bot_sel_tipo").click(handlerSeleccionarTipoSitio);
		
		// recreate handlers of the expand/collapse buttons
		$(".bot_expandir_tipo").off('click');
		$(".bot_expandir_tipo").click(handlerExpandTipoSitio);
		
		// recreate handlers of the showmore buttons
		$(".showmore").off('click');
		$(".showmore").click(handlerShowmore);
	}
}
function handlerShowmore() {
	let $div = $(this).closest(".sitetype");
	const indice = +$div.attr("indice");
	// show elements
	let $aux = $div;
	let fin;
	do {
		$aux = $aux.next();
		fin = true;
		if (+$aux.attr("indice") == indice && $aux.hasClass("d-none")) {
			$aux.removeClass("d-none");
			$aux.addClass("d-flex");			
			fin = false;
		}
	} while (!fin);	
	// remove show more button
	$div.remove();
}



/////////////////////////
// HANDLER SELECCIÓN TIPO
/////////////////////////
function handlerSeleccionarTipoSitio() {
	// obtengo uri del tipo
	const turi = $(this).attr("turi");
	
	// vamos a la selección del sitio
	tratarSeleccionTipoSitio(turi);
	
	// click en botón de seleccionar tipo de sitio para cerrar el panel
	$("#bot_types").click();
}
function tratarSeleccionTipoSitio(turi) {	
	// mando evento GA4	
	sendEvent('select_content', {
		content_type: "site_type_filter",
		item_id: turi,
		label: Datos.tiposLugares[turi].lab
	});
	
	// reajusto url y actualizo página en la historia
	const url = window.location.pathname + '?loc=' + loc2string(Sesion.estado.loc) + '&siteType=' + turi;	
	history.replaceState(Sesion.estado, "", url);
	
	// cargo la URL
	cargarURL();
}
