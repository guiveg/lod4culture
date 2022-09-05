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

// EN ESTE FICHERO METO TODAS LAS FUNCIONES RELACIONADAS CON LA OBTENCIÓN DE DATOS VÍA CRAFTS


////////////
// RESOURCES
////////////

async function getDatosRecurso(type, uri, repe) {
	// analizo el type para obtener el objeto base
	let objbase;
	if (type === 'Site') 
		objbase = Datos.sites;
	else if (type === 'Artwork')
		objbase = Datos.obras;
	else if (type === 'Artist')
		objbase = Datos.artistas;
	else
		return; // en otro caso no hago nada

	// no hago nada si ya están los datos
	if (objbase[uri] !== undefined)
		return;
	
	// preparo objeto para la llamada
	const objr = {
		id: type,
		iri: uri
	};
	// hago la llamada a CRAFTS	y espero resultados
	let datos = await Crafts.getData(config.craftsConfig.resourceTemplate, objr);
	
	// GA4: incremento en 1 el número de crafts_reqs en EventData
	addEventData('crafts_reqs', 1);
	
	// guardo y a volar
	objbase[uri] = datos;
}


/////////////
// SITE TYPES
/////////////

async function initTiposLugares() {
	let penduris = config.topTypes;
	// 4 iteraciones (config.maxTypeDepth)
	for (let level=0; level<config.maxTypeDepth; level++) {
		// preparo iteración siguiente
		let newpenduris = [];
		// ahora pido a CRAFTS la info de cada tipo
		let promesas = []; // inicializo promesas
		// pido descomponer en objetos para la llamada resources de CRAFTS	
		const objrs = descomponerCraftsResources('SiteType', penduris);
		// ya tengo los objetos a pedir, lanzo las peticiones en paralelo a CRAFTS
		for (let i=0; i<objrs.length; i++) {
			// creo una promesa para cada petición
			promesas.push( new Promise(async function(resolve, reject) {
				try {
					// hago la llamada a CRAFTS	y espero resultados
					let datos = await Crafts.getData(config.craftsConfig.resourcesTemplate, objrs[i]);
					// convierto en array si es necesario
					if (!Array.isArray(datos))
						datos = [ datos ];			
					// actualizo uno a uno
					for (let j=0; j<datos.length; j++) {
						const dato = datos[j];
						// sólo guardo si hay label
						if (dato.label != undefined) {
							// guardo
							Datos.tiposLugares[dato.iri] = {
								lab: firstUppercase( getLiteral(dato.label) ),
								count: dato.nindivs == undefined? 0 : dato.nindivs,
								subclasses: dato.subclasses == undefined  || level == config.maxTypeDepth -1? [] : dato.subclasses,
								level: level
							}
							// meto las subclases en newpenduris
							if (dato.subclasses != undefined)
								newpenduris = newpenduris.concat(dato.subclasses);
						}
					}
					// resuelvo la promesa
					resolve(true);
				} catch(err) {
					reject(err);
				}
			}) );
		}
		// aquí espero a que terminen las promesas de la iteración
		await Promise.all(promesas);
		// preparamos array para la próxima iteración
		penduris = _.uniq(newpenduris);
		penduris = _.filter(penduris, function (uri) {return Datos.tiposLugares[uri] == undefined;} );
	}

	// filtrado adicional de subclases (tarda poco en este filtrado, 7ms en mi portátil)	
	const alltypes = Object.keys(Datos.tiposLugares);
	for (let i=0; i<alltypes.length; i++) {
		let turi = alltypes[i];
		Datos.tiposLugares[turi].subclasses = _.filter(Datos.tiposLugares[turi].subclasses, function(scuri) { return Datos.tiposLugares[scuri] != undefined ; } );
	}
}


//////
// MAP
//////

async function processSitesCell(objcell) {
	// ajusto threshold
	const threshold = objcell.zoom > config.zPlace? config.cellSiteThresholdNarrow : config.cellSiteThresholdWide;
	// preparo qobj si tengo que hacer una petición a CRAFTS
	let qobj = null;
	const hayCrafts = Datos.numLugaresCeldas[objcell.et] == undefined ||
		( Datos.numLugaresCeldas[objcell.et] > 0
			&& Datos.numLugaresCeldas[objcell.et] <= threshold
			&& Datos.lugaresCeldas[objcell.et] == undefined) ||
		(Datos.numLugaresCeldas[objcell.et] > 0 
			&& Datos.numLugaresCeldas[objcell.et] > threshold
			&& Datos.popLocCeldas[objcell.et] == undefined);
	// preparo el Mustache para la petición a CRAFTS
	if (hayCrafts) {
		// OJO CON EL ANTIMERIDIANO: en Leaflet los bounds pueden estar fuera del rango de longitud [-180, 180]
		// https://stackoverflow.com/questions/40532496/wrapping-lines-polygons-across-the-antimeridian-in-leaflet-js
		// ajuste con el número de decimales
		qobj = {
			/*"latsouth" : objcell.cellY * objcell.cellSide,
			"latnorth" : (objcell.cellY + 1) * objcell.cellSide,
			"lngwest" : objcell.cellX * objcell.cellSide,
			"lngeast" : (objcell.cellX + 1) * objcell.cellSide,*/		
			"latsouth" : Math.floor(objcell.cellY * objcell.cellSide * Sesion.cellFactor) / Sesion.cellFactor,
			"latnorth" : Math.ceil((objcell.cellY + 1) * objcell.cellSide * Sesion.cellFactor) / Sesion.cellFactor,
			"lngwest" : Math.floor(objcell.cellX * objcell.cellSide * Sesion.cellFactor) / Sesion.cellFactor,
			"lngeast" : Math.ceil((objcell.cellX + 1) * objcell.cellSide * Sesion.cellFactor) / Sesion.cellFactor,
			"type" : objcell.type
		};		
		
		// solución para el antimeridiano
		while (qobj.lngwest < -180)
			qobj.lngwest += 360;
		while (qobj.lngwest > 180)
			qobj.lngwest -= 360;
		while (qobj.lngeast < -180)
			qobj.lngeast += 360;
		while (qobj.lngeast > 180)
			qobj.lngeast -= 360;	
	}

	// si no tengo el número de lugares de la celda, lo pido a CRAFTS
	if (Datos.numLugaresCeldas[objcell.et] == undefined) {		
		// pido número de lugares de la celda
		// hago la llamada a CRAFTS	y espero resultados
		const datos = await Crafts.getData(config.craftsConfig.queryCountSitesBox, qobj);
		
		// GA4: incremento en 1 el número de crafts_reqs en EventData
		addEventData('crafts_reqs', 1);
							
		// inicializo (por si acaso, pero no debería hacer falta)
		Datos.numLugaresCeldas[objcell.et] = 0;						
		// guardo el dato de la cuenta
		_.each(datos.results.bindings, function(row) {
			Datos.numLugaresCeldas[objcell.et] = row.count.value;
		});
	}
		
	// aquí ya tengo el número de lugares de la celda		
	// pido los datos de los lugares de la celda si no los tiene y si pasa el umbral
	if (Datos.numLugaresCeldas[objcell.et] > 0 
			&& Datos.numLugaresCeldas[objcell.et] <= threshold
			&& Datos.lugaresCeldas[objcell.et] == undefined) {
		// incluyo un límite de 1000, más que suficiente para la petición
		qobj.limit = 1000;
		// hago la llamada a CRAFTS	y espero resultados
		const datos = await Crafts.getData(config.craftsConfig.querySitesBox, qobj);
		
		// GA4: incremento en 1 el número de crafts_reqs en EventData
		addEventData('crafts_reqs', 1);
							
		// inicializo array resultados
		Datos.lugaresCeldas[objcell.et] = [];
		// analizo fila a fila
		_.each(datos.results.bindings, function(row) {
			// uri del lugar
			const luri = row.site.value;
			// incluyo en la celda si no estaba
			if (!_.contains(Datos.lugaresCeldas[objcell.et], luri))
				Datos.lugaresCeldas[objcell.et].push(luri);
			// guardo objeto con datos del lugar si no estaba
			if (Datos.lugares[luri] == undefined)
				Datos.lugares[luri] = {};
			let lobj = Datos.lugares[luri];
			// guardo posición (SÓLO SI NO LA HABÍA)
			if (lobj.lat == undefined)
				lobj.lat = Number(row.lat.value);
			if (lobj.lng == undefined)
				lobj.lng = Number(row.lng.value);
			// guardo sitelinks y statements (sobre-escribiendo lo que hubiera)
			lobj.sitelinks = Number(row.sitelinks.value);
			lobj.statements = Number(row.statements.value);
			// guardo imagen (sobre-escribiendo lo que hubiera)
			if (row.image != undefined)
				lobj.image = row.image.value;
			// guardo etiquetas (sobre-escribiendo lo que hubiera por tag)
			if (lobj.label == undefined)
				lobj.label = {};
			const tag = row.label["xml:lang"];
			lobj.label[tag] = row.label.value;
			// guardo descripciones (sobre-escribiendo lo que hubiera por tag)
			if (row.desc != undefined) {
				if (lobj.desc == undefined)
					lobj.desc = {};
				const dtag = row.desc["xml:lang"];
				lobj.desc[dtag] = row.desc.value;
			}
			/* TODO previo
			// guardo comments (sobre-escribiendo lo que hubiera por tag)
			if (row.comment != undefined) {
				if (lobj.comment == undefined)
					lobj.comment = {};
				const ctag = row.comment["xml:lang"];
				lobj.comment[ctag] = row.comment.value;
			}*/
		});
	} // si hay que colocar un cluster entonces obtengo la localización del lugar con más sitios de arte
	else if (Datos.numLugaresCeldas[objcell.et] > 0 
			&& Datos.numLugaresCeldas[objcell.et] > threshold
			&& Datos.popLocCeldas[objcell.et] == undefined) {

		// hago la llamada a CRAFTS	y espero resultados
		const datos = await Crafts.getData(config.craftsConfig.queryMostPopularLoc, qobj);
		
		// GA4: incremento en 1 el número de crafts_reqs en EventData
		addEventData('crafts_reqs', 1);
		
		// inicializo poploc
		Datos.popLocCeldas[objcell.et] = null;
		// analizo primera fila, si la hay
		if (datos.results.bindings.length > 0) {
			Datos.popLocCeldas[objcell.et] = {
				loc: datos.results.bindings[0].loc.value,
				lat: Number(datos.results.bindings[0].lat.value),
				lng: Number(datos.results.bindings[0].lng.value),
				score: Number(datos.results.bindings[0].score.value)
			};		
		}		
	}
	
	// hacemos el render
	objcell.render();

	// fue todo bien, resuelvo la promesa
	return Promise.resolve();	
}