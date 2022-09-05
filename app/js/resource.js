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

async function mostrarPaginaRecurso(type, uri) {
	// GA4: inicializo evento del recurso
	initResourceEvent();
	
	// logging
	console.group("Carga recurso " + uri + " - " + type);
	console.time("Recurso " + uri);
	console.log("URL: " + window.location);

	// pongo spinner con mensaje de cargando	
	$("#mirecurso").html(spinnerTemplate);
	window.scrollTo(0, 0);
	
	// pongo temporizador con mensajes aleatorios para amenizar la espera
	Sesion.idTimeoutSpinner = setTimeout(nuevoInfoSpinner, 
		config.timeoutSpinner); // 20s
	
	// pido datos a CRAFTS del recurso
	try {
		await getDatosRecurso(type, uri);		
		//throw {mes: "prueba", status: 429};		
	} catch(err) {
		// error, cancelo temporizador
		clearTimeout(Sesion.idTimeoutSpinner);
		// hago logging
		console.error(err);
		console.timeEnd("Recurso " + uri);
		console.groupEnd();
		
		// detecto si hay error 429 (too many requests)
		if (err.status === 429) {
			// GA4: mando evento de error 429
			sendError429Event();
	
			// enmascaro error 429 con una nueva petición en un intervalo de 3-10s
			const nsecs = 3 + Math.floor(Math.random() * 8);
			setTimeout(function(){
				console.info("Reintento carga recurso " + uri + " - " + type);
				mostrarPaginaRecurso(type, uri);
			}, nsecs * 1000);
		} 
		else // otro error y aquí no podemos hacer nada más...
			errorProveedorDatosIrrecuperable(err);
		return;
	}

	// fue todo bien, cancelo temporizador y pongo nuevos mensajes
	clearTimeout(Sesion.idTimeoutSpinner);
	$("#titleSpinner").html(getLiteral(dict.spinnerRendering));
	$("#infoSpinner").html(getLiteral(dict.spinnerInfoRender));

	// trato los datos según sea site o artwork	
	if (type === 'Site')
		tratarSite(type, uri);
	else if (type === 'Artwork')
		tratarObra(type, uri);
	else if (type === 'Artist')
		tratarArtista(type, uri);
	else {
		console.error("Recurso no existe");
		console.timeEnd("Recurso " + uri);
		console.groupEnd();
		recursoNoExiste();
	}
}

function nuevoInfoSpinner() {
	// pongo un mensaje aleatorio
	const ind = Math.floor(Math.random() * dict.spinnerMore.length);
	const mens = getLiteral(dict.spinnerMore[ind]);
	$("#infoSpinner").html(mens);
	// nuevo temporizador
	Sesion.idTimeoutSpinner = setTimeout(nuevoInfoSpinner, config.timeoutSpinner); // 20s
}

async function tratarSite(type, uri) {
	// si no hay label asumo que el lugar no existe...	
	if (Datos.sites[uri].label == undefined) {		
		recursoNoExiste();
		return;
	}

	// preparo objeto plantilla para el renderizado
	let tobj = {};
	tobj.tipo = getLiteral(dict.typeSite);
	tobj.iwidth = getImageWidth();
	tobj.uri = uri;
	tobj.label = getLiteral(Datos.sites[uri].label);
	// me quedo con una única descripción (con primera letra en mayúsculas)
	tobj.desc = firstUppercase( getLiteral( extractAllElements(Datos.sites[uri], [ "desc" ]) ) );
	// me quedo con un único comment
	tobj.comment = getLiteral( extractAllElements(Datos.sites[uri], [ "comment-dben" ]) );
	// puede haber varios types...
	tobj.types = _.map( extractAllElements(Datos.sites[uri], [ "types" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// puede haber varias categorías dbpedia
	tobj.cats = _.map( extractAllElements(Datos.sites[uri], [ "cats-dben" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
		
	// puede haber varias URIs de dbpedia para una misma entidad Wikidata (ver caso del Prado)
	tobj.dbpedia = extractAllElements(Datos.sites[uri], [ "dben" ]);
	// preparo sources (al menos Wikidata)
	tobj.sources = [];
	tobj.sources.push( { label: "Wikidata: " + tobj.label, uri: uri });
	for (let i=0; i<tobj.dbpedia.length; i++)
		tobj.sources.push( { label: "DBpedia: " + getLiteral(tobj.dbpedia[i].label), uri: tobj.dbpedia[i].iri });

	// imágenes, todo lo que haya
	tobj.images = extractAllElements(Datos.sites[uri], [ "image" ]);
	tobj.images = tobj.images.concat(extractAllElements(Datos.sites[uri], [ "imageNight" ]));
	tobj.images = tobj.images.concat(extractAllElements(Datos.sites[uri], [ "imageInterior" ]));
	tobj.images = tobj.images.concat(extractAllElements(Datos.sites[uri], [ "imagePlanView" ]));
	tobj.images = _.uniq(tobj.images);
	// incluyo este renombramiento para evitar warning: "Cargando contenido visual mixto (no seguro) en una página segura"
	tobj.images = _.map(tobj.images, function(img){ return img.replace('http://', 'https://'); } );
	
	// partof, puede haber varios
	tobj.partof = _.map( extractAllElements(Datos.sites[uri], [ "partOf" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
	// para inception sólo quiero uno, de haberlo
	tobj.inception = extractFirstElement(Datos.sites[uri], [ "inception" ], true);	
	// localizaciones, puede haber varias
	tobj.locations = _.map( extractAllElements(Datos.sites[uri], [ "location" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
	// país, sólo uno
	tobj.country = { label: getLiteral( extractFirstElement(Datos.sites[uri], [ "country", "label" ]) ),
		uri: extractFirstElement(Datos.sites[uri], [ "country", "iri" ]) };
		
	// materiales, puede haber varios
	tobj.materials = _.map( extractAllElements(Datos.sites[uri], [ "material" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// para length sólo quiero uno, de haberlo
	tobj.length = extractFirstElement(Datos.sites[uri], [ "length" ], true);
	if (tobj.length != undefined) {
		tobj.length.unit = getLiteral(tobj.length.unit);
		if (tobj.length.value != undefined && !isNaN(Number(tobj.length.value)))
			tobj.length.value = new Intl.NumberFormat().format(tobj.length.value);
	}
	// para width sólo quiero uno, de haberlo
	tobj.width = extractFirstElement(Datos.sites[uri], [ "width" ], true);
	if (tobj.width != undefined) {
		tobj.width.unit = getLiteral(tobj.width.unit);
		if (tobj.width.value != undefined && !isNaN(Number(tobj.width.value)))
			tobj.width.value = new Intl.NumberFormat().format(tobj.width.value);
	}
	// para height sólo quiero uno, de haberlo
	tobj.height = extractFirstElement(Datos.sites[uri], [ "height" ], true);
	if (tobj.height != undefined) {
		tobj.height.unit = getLiteral(tobj.height.unit);
		if (tobj.height.value != undefined && !isNaN(Number(tobj.height.value)))
			tobj.height.value = new Intl.NumberFormat().format(tobj.height.value);
	}
	// para area sólo quiero uno, de haberlo
	tobj.area = extractFirstElement(Datos.sites[uri], [ "area" ], true);
	if (tobj.area != undefined) {
		tobj.area.unit = getLiteral(tobj.area.unit);
		if (tobj.area.value != undefined && !isNaN(Number(tobj.area.value)))
			tobj.area.value = new Intl.NumberFormat().format(tobj.area.value);
	}
	
	// estilo arquitectónico, puede haber varios
	tobj.archStyles = _.map( extractAllElements(Datos.sites[uri], [ "archStyle" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// arquitecto, puede haber varios
	tobj.architect = _.map( extractAllElements(Datos.sites[uri], [ "architect" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
	// fundador, puede haber varios
	tobj.founder = _.map( extractAllElements(Datos.sites[uri], [ "foundedBy" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// designación patrimonio, puede haber varios
	tobj.heritageDesignations = _.map( extractAllElements(Datos.sites[uri], [ "heritageDesignation" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
	// visitantes por año, hago sorting por año
	tobj.visitorsPerYear = _.sortBy(extractAllElements(Datos.sites[uri], [ "visitorsPerYear" ]), "year").reverse();
	// hago también formateo especial valores visitantes
	for (let i=0; i<tobj.visitorsPerYear.length; i++) {
		if (tobj.visitorsPerYear[i].value != undefined && !isNaN(Number(tobj.visitorsPerYear[i].value))) {
			tobj.visitorsPerYear[i].value = Number(tobj.visitorsPerYear[i].value).toLocaleString(  undefined, // leave undefined to use the visitor's browser 
            	// locale or a string like 'en-US' to override it.
				{ minimumFractionDigits: 0 } );
		}
	}
		
	// works
	if (Datos.sites[uri].works) {
		tobj.works = [];
		for (let i=0; i<Datos.sites[uri].works.length; i++) {
			let wobj = {
				uri: Datos.sites[uri].works[i].iri,
				label: getLiteral(Datos.sites[uri].works[i].label)//,
				//score: getResourceScore(Datos.lugares[uri].works[i]),
				//pro: esRecursoPRO(Datos.lugares[uri].works[i])
			};
			// si no hay label, no lo meto...
			if (wobj.label != undefined)
				tobj.works.push(wobj);
		}		
		// hago el sorting por el score
		//tobj.works = _.sortBy(tobj.works, 'score').reverse();
		// pagino
		tobj.numWorkPages = 1 + Math.floor(tobj.works.length/10);
		for (let i=0; i<tobj.works.length; i++) {
			tobj.works[i].npage = 1 + Math.floor(i/10);
			tobj.works[i].esconder = tobj.works[i].npage > 1;
		}
		// activaré controles de paginación si hay más de una página
		tobj.workPaging = tobj.numWorkPages > 1;
	}
	
	// localización (primera latitud y longitud disponibles)
	tobj.lat = Number( extractFirstElement(Datos.sites[uri], [ "latWGS84" ], true) );	
	tobj.lng = Number( extractFirstElement(Datos.sites[uri], [ "lngWGS84" ], true) );	
	// cargo localización en el estado de la sesión y activo mapa
	if (tobj.lat != undefined && !isNaN(tobj.lat) && tobj.lng!= undefined && !isNaN(tobj.lng)) {
		Sesion.estado.loc.lat = tobj.lat;
		Sesion.estado.loc.lng = tobj.lng;
		if (Sesion.estado.loc.z <= config.zStart)
			Sesion.estado.loc.z = config.zPlace;
		// activo mapa
		tobj.haymapa = true;
	}
		
	// pro
	tobj.pro = esRecursoPRO(Datos.sites[uri]);
	
	// llamo al render
	renderPagina(type, uri, sitePageTemplate, tobj);
}

async function tratarObra(type, uri) {
	// si no hay label asumo que la obra no existe...
	if (Datos.obras[uri].label == undefined) {		
		recursoNoExiste();
		return;
	}
	
	// preparo objeto plantilla para el renderizado
	let tobj = {};
	tobj.tipo = getLiteral(dict.typeArtwork);
	tobj.iwidth = getImageWidth();
	tobj.uri = uri;
	tobj.label = getLiteral( Datos.obras[uri].label );
	// me quedo con una única descripción (con primera letra en mayúsculas)
	tobj.desc = firstUppercase( getLiteral( extractAllElements(Datos.obras[uri], [ "desc" ]) ) );
	// me quedo con un único comment
	tobj.comment = getLiteral( extractAllElements(Datos.obras[uri], [ "comment-dben" ]) );
	// puede haber varios types...
	tobj.types = _.map( extractAllElements(Datos.obras[uri], [ "types" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// puede haber varias categorías dbpedia
	tobj.cats = _.map( extractAllElements(Datos.obras[uri], [ "cats-dben" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	
	// puede haber varias URIs de dbpedia para una misma entidad Wikidata (ver caso del Prado)
	tobj.dbpedia = extractAllElements(Datos.obras[uri], [ "dben" ]);
	// preparo sources (al menos Wikidata)
	tobj.sources = [];
	tobj.sources.push( { label: "Wikidata: " + tobj.label, uri: uri });
	for (let i=0; i<tobj.dbpedia.length; i++)
		tobj.sources.push( { label: "DBpedia: " + getLiteral(tobj.dbpedia[i].label), uri: tobj.dbpedia[i].iri });

	// imágenes, sólo una
	tobj.image = extractFirstElement(Datos.obras[uri], [ "image" ], true);
	// si no hay, caso especial de la imagen de  DBpedia con reemplazos
	if (tobj.image == undefined) {
		tobj.image = extractFirstElement(Datos.obras[uri], [ "imageDbpedia" ], true);
		if (tobj.image != undefined) {
			// ajusto url por problemas conocidos con wikimedia
			tobj.image = tobj.image.replace("http://commons.wikimedia.org/", "http://en.wikipedia.org/");
			tobj.image = tobj.image.replace("?width=300", "");		
		}
	}
	// incluyo este renombramiento para evitar warning: "Cargando contenido visual mixto (no seguro) en una página segura"
	if (tobj.image != undefined)
		tobj.image = tobj.image.replace('http://', 'https://');
	
	// creador (permito varios, pero seguramente sólo haya uno...)
	// el _.compact es para eliminar los nulls...
	tobj.creator = _.compact(_.map( extractAllElements(Datos.obras[uri], [ "creator" ]), function(el) {
		if (el.label == undefined) // si no tiene etiqueta no lo meto
			return null;
		return {label: getLiteral(el.label), uri: el.iri};
	}));
	// partof, puede haber varios
	tobj.partof = _.map( extractAllElements(Datos.obras[uri], [ "partOf" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});		
	// para inception sólo quiero uno, de haberlo
	tobj.inception = extractFirstElement(Datos.obras[uri], [ "inception" ], true);	
	// localizaciones, puede haber varias
	tobj.locations = _.map( extractAllElements(Datos.obras[uri], [ "location" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
	// puede haber varios genres...
	tobj.genres = _.map( extractAllElements(Datos.obras[uri], [ "genre" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// puede haber varios movimientos...	
	tobj.movements = _.map( extractAllElements(Datos.obras[uri], [ "movement" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
		
	// para width sólo quiero uno, de haberlo
	tobj.width = extractFirstElement(Datos.obras[uri], [ "width" ], true);
	if (tobj.width != undefined) {
		tobj.width.unit = getLiteral(tobj.width.unit);
		if (tobj.width.value != undefined && !isNaN(Number(tobj.width.value)))
			tobj.width.value = new Intl.NumberFormat().format(tobj.width.value);
	}
	// para height sólo quiero uno, de haberlo
	tobj.height = extractFirstElement(Datos.obras[uri], [ "height" ], true);
	if (tobj.height != undefined) {
		tobj.height.unit = getLiteral(tobj.height.unit);
		if (tobj.height.value != undefined && !isNaN(Number(tobj.height.value)))
			tobj.height.value = new Intl.NumberFormat().format(tobj.height.value);
	}
	// para mass sólo quiero uno, de haberlo
	tobj.mass = extractFirstElement(Datos.obras[uri], [ "mass" ], true);
	if (tobj.mass != undefined) {
		tobj.mass.unit = getLiteral(tobj.mass.unit);
		if (tobj.mass.value != undefined && !isNaN(Number(tobj.mass.value)))
			tobj.mass.value = new Intl.NumberFormat().format(tobj.mass.value);
	}
			
	// materiales
	tobj.materials = _.map( extractAllElements(Datos.obras[uri], [ "material" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// mainSubject
	tobj.mainSubject = _.map( extractAllElements(Datos.obras[uri], [ "mainSubject" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// depicts
	tobj.depicts = _.map( extractAllElements(Datos.obras[uri], [ "depicts" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	
	// pro
	tobj.pro = esRecursoPRO(Datos.obras[uri]);
	
	
	// llamo al render
	renderPagina(type, uri, artworkPageTemplate, tobj);
}

async function tratarArtista(type, uri) {
	// si no hay label asumo que la obra no existe...	
	if (Datos.artistas[uri].label == undefined) {		
		recursoNoExiste();
		return;
	}
	
	// preparo objeto plantilla para el renderizado
	let tobj = {};
	tobj.tipo = getLiteral(dict.typeArtist);
	tobj.iwidth = getImageWidth();
	tobj.uri = uri;
	tobj.label = getLiteral( Datos.artistas[uri].label );
	// me quedo con una única descripción (con primera letra en mayúsculas)
	tobj.desc = firstUppercase( getLiteral( extractAllElements(Datos.artistas[uri], [ "desc" ]) ) );
	// me quedo con un único comment
	tobj.comment = getLiteral( extractAllElements(Datos.artistas[uri], [ "comment-dben" ]) );
	// puede haber varios types...
	tobj.types = _.map( extractAllElements(Datos.artistas[uri], [ "types" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// puede haber varias categorías dbpedia
	tobj.cats = _.map( extractAllElements(Datos.artistas[uri], [ "cats-dben" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	
	// puede haber varias URIs de dbpedia para una misma entidad Wikidata (ver caso del Prado)
	tobj.dbpedia = extractAllElements(Datos.artistas[uri], [ "dben" ]);
	// preparo sources (al menos Wikidata)
	tobj.sources = [];
	tobj.sources.push( { label: "Wikidata: " + tobj.label, uri: uri });
	for (let i=0; i<tobj.dbpedia.length; i++)
		tobj.sources.push( { label: "DBpedia: " + getLiteral(tobj.dbpedia[i].label), uri: tobj.dbpedia[i].iri });

	// imágenes, sólo una
	tobj.image = extractFirstElement(Datos.artistas[uri], [ "image" ], true);	
	// incluyo este renombramiento para evitar warning: "Cargando contenido visual mixto (no seguro) en una página segura"
	if (tobj.image != undefined)
		tobj.image = tobj.image.replace('http://', 'https://');

	// país, puede haber varios
	tobj.country = _.map( extractAllElements(Datos.artistas[uri], [ "country" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// lugar nacimiento, puede haber varios
	tobj.placeOfBirth = _.map( extractAllElements(Datos.artistas[uri], [ "placeOfBirth" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// lugar muerte, puede haber varios
	tobj.placeOfDeath = _.map( extractAllElements(Datos.artistas[uri], [ "placeOfDeath" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// fecha nacimiento, sólo uno
	const dops = { year: 'numeric', month: 'long', day: 'numeric' };
	tobj.dateOfBirth =  extractFirstElement(Datos.artistas[uri], [ "dateOfBirth" ], true );
	if (tobj.dateOfBirth != undefined && !isNaN(Date.parse(tobj.dateOfBirth)))
		tobj.dateOfBirth = new Date(Date.parse(tobj.dateOfBirth)).toLocaleDateString(undefined, dops);
	// fecha muerte, sólo uno	
	tobj.dateOfDeath =  extractFirstElement(Datos.artistas[uri], [ "dateOfDeath" ], true );
	if (tobj.dateOfDeath != undefined && !isNaN(Date.parse(tobj.dateOfDeath)))
		tobj.dateOfDeath = new Date(Date.parse(tobj.dateOfDeath)).toLocaleDateString(undefined, dops);

	// ocupaciones, puede haber varias
	tobj.occupations = _.map( extractAllElements(Datos.artistas[uri], [ "occupation" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});	
	// puede haber varios genres...
	tobj.genres = _.map( extractAllElements(Datos.artistas[uri], [ "genre" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// puede haber varios movimientos...	
	tobj.movements = _.map( extractAllElements(Datos.artistas[uri], [ "movement" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	// puede haber varios premios...	
	tobj.awards = _.map( extractAllElements(Datos.artistas[uri], [ "award" ]), function(el) {
		return {label: getLiteral(el.label), uri: el.iri};
	});
	
	// works
	if (Datos.artistas[uri].works) {
		tobj.works = [];
		for (let i=0; i<Datos.artistas[uri].works.length; i++) {
			let wobj = {
				uri: Datos.artistas[uri].works[i].iri,
				label: getLiteral(Datos.artistas[uri].works[i].label)//,
				//score: getResourceScore(Datos.lugares[uri].works[i]),
				//pro: esRecursoPRO(Datos.lugares[uri].works[i])
			};
			// si no hay label, no lo meto...
			if (wobj.label != undefined)
				tobj.works.push(wobj);
		}		
		// hago el sorting por el score
		//tobj.works = _.sortBy(tobj.works, 'score').reverse();
		// pagino
		tobj.numWorkPages = 1 + Math.floor(tobj.works.length/10);
		for (let i=0; i<tobj.works.length; i++) {
			tobj.works[i].npage = 1 + Math.floor(i/10);
			tobj.works[i].esconder = tobj.works[i].npage > 1;
		}
		// activaré controles de paginación si hay más de una página
		tobj.workPaging = tobj.numWorkPages > 1;
	}
	
	// pro
	tobj.pro = esRecursoPRO(Datos.artistas[uri]);
	
	// llamo al render
	renderPagina(type, uri, artistPageTemplate, tobj);
}


function renderPagina(type, uri, temp, tobj) {	
	// trato recurso 0: usuario fue directamente a un recurso sin pasar por el mapa
	if (Sesion.estado.resourcePages == 0)
		Sesion.estado.resourcePages++;
		
	// ajusto botones
	tobj.hayBack = Sesion.estado.resourcePages > 1 || Sesion.estado.hayMapa;
	tobj.backLabel = Sesion.estado.resourcePages > 1 ? getLiteral(dict.back) : getLiteral(dict.back2map);
	tobj.hayGo2Map = Sesion.estado.resourcePages > 1 || !Sesion.estado.hayMapa;
	
	// indico si hay solr
	tobj.haySolr = Solr != null;
	
	// actualizo título de la página
	document.title = tobj.label + ' - ' + config.title
	
	/*
	// AJUSTE PROPIEDADES META
	$("meta[property='og:url']").attr('content', window.location);
	// title
	$("meta[property='og:title']").attr('content', document.title);
	// description
	const pagedesc = tobj.desc? tobj.desc : tobj.tipo + tobj.label;
	$("meta[property='og:description']").attr('content', pagedesc);
	// image
	let imgurl = "https://lod4culture.gsic.uva.es/app/images/snapshot3.png";
	if (tobj.images != undefined && tobj.images.length > 0)
		imgurl = tobj.images[0] + '?width=300';
	else if (tobj.image != undefined)
		imgurl = tobj.image + '?width=300';
	$("meta[property='og:image']").attr('content', imgurl);*/

		
	// AJUSTE BOTONES REDES
	// guasaps (sólo si móvil o tableta)	
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
		tobj.guasaps = "whatsapp://send?text=" + encodeURIComponent(document.title + " " + window.location);
	// facebook
	tobj.facebook = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(window.location);
	// twitter
	tobj.twitter = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(document.title) + "&via=lod4culture&url=" + encodeURIComponent(window.location);


	// genero la página
	const htmlpage = Mustache.render(temp, tobj);
	
	// cargo contenido en la página
	$("#mirecurso").html(htmlpage);	
	
	// GA4: mando evento del recurso
	sendResourceEvent(tobj.label);
	
	// cargo mapa
	if (tobj.haymapa) {
		// pongo mapa centrado
		let sitemap = L.map('site_map').setView([tobj.lat, tobj.lng], config.zPlace);
		L.tileLayer(config.geotemplate, config.geooptions).addTo(sitemap);
		// pongo marcador
		const iconhtml = Mustache.render(iconSiteTemplate, 
			{image: tobj.images[0], pro: tobj.pro} );
		const isize = tobj.pro? 56 : 48;		
		const micon = new L.divIcon({
			html: iconhtml,
			className: '',	
			iconSize: [isize, isize],
			iconAnchor: [isize/2, isize/2],
			tooltipAnchor:[12, 0]
		});
		L.marker([tobj.lat, tobj.lng], { icon: micon } )
			.bindTooltip(tobj.label)
			.addTo( sitemap );		
	}
	
	// handlers de los recursos (obras, etc)
	$('.resource').click(function() {
		// recojo datos
		const tipo = $(this).attr("tipo");
		const uri = $(this).attr("uri");
		let label = $(this).html();
		label = label.replace("<strong>", "");
		label = label.replace("</strong>", "");
		// hago petición
		go2resource(tipo, uri, label);
	});
	
	// handlers social media para mandar eventos
	$('#guasaps').click(function() {
		// GA4: mando evento
		sendEvent('share', {
			method: "Whatsapp",
			content_type: type,
			item_id: uri
		});
	});
	$('#facebook').click(function() {
		// GA4: mando evento
		sendEvent('share', {
			method: "Facebook",
			content_type: type,
			item_id: uri
		});
	});
	$('#twitter').click(function() {
		// GA4: mando evento
		sendEvent('share', {
			method: "Twitter",
			content_type: type,
			item_id: uri
		});
	});
	
	// handler modal fuente externa (Wikidata o DBpedia)
	$('.modbut').click(function() {
		// extraigo url
		const url = $(this).attr("url");
		// pongo título al modal
		$("#mimodaltitle").text( $(this).text() );
		// preparo iframe y lo incluyo con reemplazos para evitar contenido mixto (si no, no se ve la DBpedia)
		const snippet =	'<iframe class="embed-responsive-item" src="' + url.replace('http://', 'https://')
			.replace('https://dbpedia.org/resource/', 'https://dbpedia.org/page/')
			+ '" sandbox></iframe>';		
		$("#miiframediv").html(snippet);		
		// TODO: el iframe enreda la historia de la sesión si se pincha en enlaces, pero no veo manera buena de evitarlo				
		// muestro modal
		$('#mimodal').modal();
		// GA4: mando evento
		sendEvent('select_content', {
			content_type: "resource_info_url",
			item_id: url,
			label: $(this).text()
		});
	});	
	
	// handler del buscador de recursos
	// "search" es para detectar si el usuario hizo click en la X del formulario (clear button)
	$("#in_recursos").on("keyup search", async function(e) {				
		// trato las teclas de arriba, abajo y enter			
		if (e.which == 13) { // tecla ENTER
			// sólo actúo si hay al menos una sugerencia (y habilitada)
			if ($("#sugerecursos").children(":enabled").length > 0) {
				// si no había ninguna sugerencia seleccionada activo la primera
				if (Sesion.lugarfocus == -1) {
					Sesion.lugarfocus = 0;
					ajustarRecursofocus();
				}
				// y ahora vamos al lugar seleccionado
				$("#sugerecursos").children(":enabled").eq(Sesion.lugarfocus).click();
			}
		}
		else if (e.which == 40) { // tecla ABAJO			
			// incremento focus
			Sesion.lugarfocus++;
			ajustarRecursofocus();				
		}
		else if (e.which == 38) { // tecla ARRIBA
			// decremento focus
			Sesion.lugarfocus--;
			ajustarRecursofocus();
		}
		else if (e.which != undefined) { // caso normal
			// actúo según la entrada
			let entrada = $(this).val();
			if (entrada.length == 0) {// no hay entrada
				$("#sugerecursos").html("");
				$("#sugerecursos").addClass("d-none");
			}
			else {// obtengo sugerencias y hago su render
				$("#sugerecursos").removeClass("d-none");	
				const sugs = await obtenerSugerencias(entrada, ["Site", "Artwork", "Artist"]);
				renderSugerenciasRecursos(sugs);			
				// mando evento GA4 si la entrada > 2
				if (entrada.length > 2) {
					sendEvent('search', {
						search_term: entrada,
						content: "resources"
					});
				}
			}
		}
		else  {
			// caso de la X del formulario... (quito las sugerencias)
			let entrada = $(this).val();
			if (entrada.length == 0)
				$("#sugerecursos").html("");
		}
	}).focusin(function() {			
		// vuelve el focus, muestro las sugerencias si hay algo
		let entrada = $(this).val();
		if (entrada.length > 0)
			$("#sugerecursos").removeClass("d-none");			
	}).focusout(function() {
		// si pierde el focus escondemos las sugerencias tras un delay
		// el delay es importante para que se pueda clickar un botón antes de eliminar las sugerencias
		setTimeout(function(){
			if (!$("#in_recursos").is(":focus")) // si vuelve el focus no escondo
				$("#sugerecursos").addClass("d-none");
		}, 300);			
	});
	
	
	// variables para controlar la paginación (con soporte a búsquedas)
	let wpagina = 1;
	let buscando = false; // los controles de paginación cambian si está buscando
	let buspag = 1;
	let buspagtotal = 1;
	
	// handlers de paginación de las obras
	$('#prev_page_artworks').click(function() {
		// actualizo página
		if (buscando) {
			buspag--;
			actualizarPaginaObras(buspag, buspagtotal, "buspag");	
		} else {
			wpagina--;
			actualizarPaginaObras(wpagina, tobj.numWorkPages, "npage");
		}
	});
	$('#next_page_artworks').click(function() {
		// actualizo página
		if (buscando) {
			buspag++;
			actualizarPaginaObras(buspag, buspagtotal, "buspag");	
		} else {
			wpagina++;
			actualizarPaginaObras(wpagina, tobj.numWorkPages, "npage");
		}
	});
	$('#go_page_artworks').click(function() {
		// leo input
		let wp = $('#page_input_artworks').val();
		// sólo actúo si el rango es válido
		if (buscando) {
			if (wp >= 1 && wp <= buspagtotal) {
				// actualizo página
				buspag = wp;
				actualizarPaginaObras(buspag, buspagtotal, "buspag");	
			}		
		} else {
			if (wp >= 1 && wp <= tobj.numWorkPages) {
				// actualizo página
				wpagina = wp;
				actualizarPaginaObras(wpagina, tobj.numWorkPages, "npage");
			}
		}		
	});
	
	// handler de la búsqueda de obras	
	$("#search_artworks").on("keyup search", function(e) {		
		const entrada = $(this).val();		
		// analizo la cadena de entrada
		if (entrada.length == 0 || entrada.length == 1) { // está vacía o 1 solo carácter: vuelvo al estado normal
			// desactivo modo buscar
			buscando = false;

			// por rendimiento sólo trato negritas si el número de páginas es menor que 100
			if (tobj.numWorkPages < 100) {
				// quito negritas
				for (let i=0; i<tobj.works.length; i++)
					$("button[uri='" + tobj.works[i].uri + "']").html(tobj.works[i].label);
			}
				
			// elimino search del estado sesión
			delete Sesion.estado.search;
			
			// y actualizamos las páginas
			actualizarPaginaObras(wpagina, tobj.numWorkPages, "npage");
		}
		else if (entrada.length > 1) {	// hay dos o más: obtengo obras que cumplen y repagino
			// incluyo search del estado sesión
			Sesion.estado.search = entrada;
		
			// activo modo buscar
			buscando = true;
			// escondo todas las obras
			$("button[npage]").addClass("d-none");
			// borro página de búsqueda de todas			
			$("button[npage]").removeAttr("buspag");
			// inicializo páginas de búsqueda y num de obras encontradas
			buspag = 1;
			buspagtotal = 1;
			let nobraenc = 0;	
			// obtengo lista de obras que cumplen
			for (let i=0; i<tobj.works.length; i++) {
				// si coincide, la paginamos
				const ind = indexOfNormalized(tobj.works[i].label, entrada);
				if (ind > -1) {
					// pagino
					buspagtotal = 1 + Math.floor(nobraenc/10);
					$("button[uri='" + tobj.works[i].uri + "']").attr("buspag", buspagtotal);
					
					// por rendimiento sólo trato negritas si el número de páginas es menor que 100
					if (tobj.numWorkPages < 100) {				
						// formateo el nombre a mostrar con negritas
						let newlab = ind > 0? tobj.works[i].label.substr(0, ind) : "";
						newlab += "<strong>" + tobj.works[i].label.substr(ind, entrada.length) + "</strong>"
						newlab += tobj.works[i].label.substr(ind + entrada.length);						
						$("button[uri='" + tobj.works[i].uri + "']").html(newlab);
					}
					
					// actualizo contador
					nobraenc++;
				}
			}
			// y ahora llamo a actualizar páginas
			actualizarPaginaObras(buspag, buspagtotal, "buspag");
			
			// mando evento GA4 si la entrada > 2
			if (entrada.length > 2) {
				sendEvent('search', {
					search_term: entrada,
					content: "artworks"
				});
			}
		}
	});
		
	// handler de volver
	$('.back').click(function() {
		history.back();
	});
	
	// handler de ir al mapa
	$('.go2map').click(function() {
		go2map();
	});
	
	// si no hay páginas quito esos datos del estado de la sesión
	if (!tobj.workPaging) {
		delete Sesion.estado.npage;
		delete Sesion.estado.search;
	}
	
	// reajusto url y actualizo página en la historia
	actualizarURLrecurso();
	
	// logging
	console.timeEnd("Recurso " + uri);
	console.groupEnd();
	
	
	// AJUSTE PROPIEDADES META
	$("meta[property='og:url']").attr('content', window.location);
	// title
	$("meta[property='og:title']").attr('content', document.title);
	// description
	const pagedesc = tobj.desc? tobj.desc : tobj.tipo + tobj.label;
	$("meta[property='og:description']").attr('content', pagedesc);
	// image
	let imgurl = "https://lod4culture.gsic.uva.es/app/images/snapshot3.png";
	if (tobj.images != undefined && tobj.images.length > 0)
		imgurl = tobj.images[0] + '?width=300';
	else if (tobj.image != undefined)
		imgurl = tobj.image + '?width=300';
	$("meta[property='og:image']").attr('content', imgurl);
	
		
	// AJUSTE BÚSQUEDA Y PÁGINA DE LA URL
	
	// me guardo npage (porque cambiaría si voy a la búsqueda)
	const minpage = Sesion.estado.npage;
	let totpages = tobj.numWorkPages; // total de páginas sin hacer búsqueda
		
	// si había algo en la búsqueda...
	if (Sesion.estado.search) {
		// actualizo entrada y hago búsqueda 
		$("#search_artworks").val(Sesion.estado.search).trigger("keyup");
		// actualizo totpages para paginar con buspagtotal
		totpages = buspagtotal;
	}
	
	// voy a la página si procede
	if (minpage != undefined && !isNaN( Number(minpage) ) && minpage > 0) {
		if (minpage <= totpages) {
			// actualizo página
			$('#page_input_artworks').val(minpage);
			// muestro página
			$('#go_page_artworks').click()
		}	
	}
}

function actualizarURLrecurso() {
	let url = window.location.pathname + '?type=' + Sesion.estado.type + '&uri=' + Sesion.estado.uri;
	if (Sesion.estado.search != undefined)
		url += '&search=' + Sesion.estado.search; 
	if (Sesion.estado.npage != undefined)
		url += '&npage=' + Sesion.estado.npage; 	
	history.replaceState(Sesion.estado, "", url);
}


function actualizarPaginaObras(mipag, npags, etiqueta) {
	$('#page_artworks').html( getLiteral(dict.page) + ' ' +  mipag + ' ' + getLiteral(dict.of) + ' ' + npags);	
	// escondo todas las obras
	$("button[" + etiqueta + "]").addClass("d-none");
	// muestro las obras de la página actual
	$("button[" + etiqueta + "='" + mipag + "']").removeClass("d-none");
	// actualizo controles de paginación
	let dprev = mipag == 1? true : false;
	$('#prev_page_artworks').prop("disabled", dprev);
	let dnext = mipag == npags? true : false;
	$('#next_page_artworks').prop("disabled", dnext);
	
	// actualizo página y llamo a actualizar la URL
	Sesion.estado.npage = mipag;
	actualizarURLrecurso();
}

function go2map() {
	// preparo URL con la localización existente
	const url = window.location.pathname + '?loc=' + loc2string(Sesion.estado.loc);
	history.pushState(Sesion.estado, "", url);
	// y a cargar
	cargarURL();	
}

function recursoNoExiste() {
	// pongo un modal para avisar de que el recurso no existe	
	$("#mirecurso").html(errorResourceTemplate);	
	$("#errorResourceModal").modal('show');
	
	// handler al botón de cerrar
	$('.resourcerror').click(function() {	
		// en 200ms vamos atrás (o al mapa, si no hay a dónde volver)
		setTimeout( function() {
			if (Sesion.estado.resourcePages<=0)
				go2map();
			else
				history.back();
		}, 100); // 100 ms
	});	
}


//////////////////////////
// NUEVA PÁGINA DE RECURSO
// se usa en el buscador y en los listados de obras o artistas
function go2resource(type, uri, label) {
	// actualizo estado con los datos del recurso
	Sesion.estado.type = type; // esto se usará para recuperar el tipo de recurso en CRAFTS
	Sesion.estado.uri = uri;
	// quito datos de paginación y búsqueda
	delete Sesion.estado.npage;
	delete Sesion.estado.search;	
	// nueva página de recursos
	Sesion.estado.resourcePages++;
		
	// mando evento GA4
	sendEvent('select_content', {
		content_type: "resource_" + Sesion.estado.type.toLowerCase(),
		item_id: Sesion.estado.uri,
		label: label
	});
		
	// reajusto url y creo nueva página en la historia
	const url = window.location.pathname + '?type=' + Sesion.estado.type + '&uri=' + Sesion.estado.uri;
	history.pushState(Sesion.estado, "", url);
				
	// cargo URL
	cargarURL();
}


/////////////////////
// RENDER SUGERENCIAS
function renderSugerenciasRecursos(resultados) {
	// objeto sugerencias
	let sinfo = {};
	sinfo.sugerencias = resultados;
	if (resultados.length == 0)
		sinfo.nosugerencias = true;
	
	// muestro sugerencias
	const cont = Mustache.render(sugeResourcesTemplate, sinfo);
	$("#sugerecursos").html(cont);
	//$("#sugelugares").removeClass("d-none");
		
	// handler de los botones de sugerencias de recursos
	$(".bot_suge_resource").click(async function() {
		// obtengo uri de la sugerencia
		const uri= $(this).attr("uri");
		// pedimos la información del lugar
		const datos = await Solr.getDocument(uri);
		// si hay algo, vamos al primero
		if (datos.response.numFound > 0) 
			seleccionarRecurso(datos.response.docs[0]);
	});
	
	// inicializo focus
	Sesion.lugarfocus = -1;
}

///////////////
// AJUSTE FOCUS
function ajustarRecursofocus() {
	// Sesion.lugarfocus = 0; => cajetín entrada
	// Sesion.lugarfocus = i; => num de sugerencia
	// obtengo número de sugerencias
	var ns = $("#sugerecursos").children(":enabled").length;
	// reajusto índice del focus si hace falta
	if (ns == 0) Sesion.lugarfocus = -1;
	else if (Sesion.lugarfocus >= ns) Sesion.lugarfocus = 0;
	else if (Sesion.lugarfocus < 0) Sesion.lugarfocus = ns -1;
	// y ahora las cosas visuales
	$("#sugerecursos").children().removeClass("active");
	if (Sesion.lugarfocus >= 0)
		$("#sugerecursos").children().eq(Sesion.lugarfocus).addClass("active");
}

////////////////////
// SELECCIONAR RECURSO
function seleccionarRecurso(lugar) {
	// cargo recurso
	const label = prefersSpanish()? lugar.labes : lugar.laben;
	go2resource(lugar.type, lugar.id, label);
}