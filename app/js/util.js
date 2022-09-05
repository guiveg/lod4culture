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

// DESCOMPOSICIÓN LLAMADA RESOURCES
function descomponerCraftsResources(id, uris) {
	// array a devolver con la descomposición
	let devolver = [];
	// array de huérfanos (para combinar)
	let huerfanos = [];

	// organizo las uris por sus namespaces
	let nsuris = {};
	// analizo cada uri y la meto por su namespace
	for (let i=0; i<uris.length; i++) {
		const uri = uris[i];
		// obtengo namespace
		const indfin = Math.max( uri.lastIndexOf('/'), uri.lastIndexOf('#') );
		const ns = uri.substring(0, indfin + 1);
		// guardo
		if (nsuris[ns] == undefined)
			nsuris[ns] = [];
		nsuris[ns].push(uri);
	}
	
	// analizo cada namespace encontrado
	const nss = Object.keys(nsuris);
	for (let i=0; i<nss.length; i++) {
		// obtengo el namespace y sus uris
		const mins = nss[i];
		const misuris = nsuris[mins];
		// preparo lotes de 200
		const lote = 200;
		for (let ind=0; misuris.length > ind*lote; ind++) {
			const begin = ind*lote;
			const end = misuris.length > (ind + 1)*lote? (ind + 1)*lote : misuris.length;
			// si este lote es inferior a 10, los meto en huérfanos
			if (end - begin < 10) 
				huerfanos = huerfanos.concat( misuris.slice( begin, end ) );
			else {
				// creo un objeto para este lote
				let obj = {};
				obj.id = id;
				obj.ns = mins;
				obj.nspref = 'p'; // arbitrario
				obj.iris = [];
				// meto cada iri con prefijo en el lote
				for (let j=begin; j<end; j++) {
					const uri = misuris[j];
					const prefuri = 'p:' + uri.substring(mins.length);
					obj.iris.push(prefuri);				
				}
				// y guardo el objeto en devolver
				devolver.push(obj);
			}
		}
	}
	
	// proceso los huérfanos en lotes de 20
	const lote = 20;
	for (let ind=0; huerfanos.length > ind*lote; ind++) {
		const begin = ind*lote;
		const end = huerfanos.length > (ind + 1)*lote? (ind + 1)*lote : huerfanos.length;
		// creo un objeto para este lote
		let obj = {};
		obj.id = id;
		obj.iris = huerfanos.slice( begin, end );
		// y guardo el objeto en devolver
		devolver.push(obj);
	}
		
	// devuelvo la descomposición
	return devolver;
}


// PARSING LOCATIONS
function string2loc(cad) {
	const cachos = cad.split(",");
	if (cachos.length == 3) {
		const latpars = cachos[0];
		const lngpars = cachos[1];
		const zpars = cachos[2].split("z")[0];
		// compruebo que los valores estén bien antes de reajustar
		if ( !isNaN( Number(latpars) ) ) {
			if ( !isNaN( Number(lngpars) ) ) {
				if ( Number.isInteger( Number(zpars) ) ) {
					if ( Number(latpars) >= -90 &&  Number(latpars) <= 90 ) {
						// LOCALIZACIÓN CORRECTA
						let obj = {
							lat: Number(latpars),
							lng: Number(lngpars),
							z: Number(zpars)
						}
						return obj;					
					}				
				}
			}		
		}
	}
	// si no consigo hacer el parsing con éxito
	return null;
}
function loc2string(loc) {
	// aquí no hago comprobaciones del objeto loc
	return loc.lat.toFixed(6) + ',' + loc.lng.toFixed(6) + ',' + loc.z + 'z';
}


// así compruebo si el recurso es PRO
function esRecursoPRO(mobj) {
	return getResourceScore(mobj) > 100;
}
// así obtengo la puntuación de un recurso
function getResourceScore(mobj) {
	return 3 * mobj.sitelinks + mobj.statements;
}

// acrónimo
function getAcronym(text, max) {
	let acro = '';
	let words = text.split(' ');
	for (let i=0; i<words.length && i<max; i++) {
		acro += words[i].charAt(0);
	}
	if (words.length > max)
		acro += "...";
	return acro;
}

// la uso para comprobar si cadgrande incluye cadpeq utilizando cadenas normalizadas
function indexOfNormalized(cadgrande, cadpeq) {
	// normalizo cadenas según: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
	// adicionalmente las pongo en minúsculas para comparar
	var cgnorm = cadgrande.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
	var cpnorm = cadpeq.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
	return cgnorm.indexOf(cpnorm);
}


// obtengo ancho sugerido para la imagen
function getImageWidth() {
	return window.innerWidth > 600? 600 : window.innerWidth - 30;
}


// FUNCIÓN CLAVE DE EXTRACCIÓN DE DATOS
// extracción primer elemento válido siguiendo las claves en keys
// la dificultad está en que el objeto puede tener elementos que sean objetos o arrays
function extractFirstElement(obj, keys, decomposelastarray) {
	// cojo primer elemento
	const subobj = obj[ keys[0] ];
	if (keys.length == 1) {
		// hemos llegado al final (hoja)
		if (decomposelastarray && Array.isArray(subobj)) {
			// si el elemento final es un array y nos piden descomponerlo, nos quedamos con el primer elemento y a volar
			return subobj[0];
		}
		else		
			return subobj;
	}
	else { // toca recursión
		const newkeys = _.rest(keys);
		if (Array.isArray(subobj)) {
			// caso delicado, toca iterar por cada elemento del array a ver si hay suerte y alguno lo consigue
			for (let j=0; j<subobj.length; j++) {
				let res = extractFirstElement(subobj[j], newkeys);
				if (res != null)
					return res; // lo conseguimos			
			}
			// no hubo suerte...
			return null;
		}
		else if (typeof subobj === 'object') {
			// aplicamos recursión, sin más
			return extractFirstElement(subobj, newkeys);
		}
		else // es null o un literal...
			return null;
	}
}
// aquí no queremos uno, sino que cogemos todos (DEVUELVE SIEMPRE UN ARRAY)
function extractAllElements(obj, keys) {
	// cojo primer elemento
	const subobj = obj[ keys[0] ];
	if (keys.length == 1) {
		// hemos llegado al final (hoja)
		if (subobj == undefined)
			return [];
		else if (Array.isArray(subobj))
			return subobj;
		else		
			return [ subobj ];
	}
	else { // toca recursión
		const newkeys = _.rest(keys);
		if (Array.isArray(subobj)) {
			// caso delicado, toca iterar por cada elemento del array
			let subels = []; // aquí metemos los subelementos que nos van valiendo
			for (let j=0; j<subobj.length; j++) {
				let parcels = extractAllElements(subobj[j], newkeys);
				if (parcels.length > 0) // juntamos				
					subels.concat(subels, parcels);
			}
			return subels;
		}
		else if (typeof subobj === 'object') {
			// aplicamos recursión, sin más
			return extractAllElements(subobj, newkeys);
		}
		else // es null o un literal...
			return [];
	}
}


/*
function convertArray(el) {
	if (Array.isArray(el))
		return el;
	else
		return [ el ];
}*/

// prefiere idioma español?
function prefersSpanish() {
	if (navigator.userAgent === 'puppeteer') // caso particular bots (español no)
		return false;
	// obtengo lenguajes preferidos
	const preflangs = window.navigator.languages || [window.navigator.language || window.navigator.userLanguage];
	// analizo uno a uno
	for (let ind = 0 ; ind < preflangs.length; ind++) {
		const ltag = preflangs[ind];
		const lang = ltag.substring(0, 2);
		// si es español lo tenemos
		if (lang === 'es')
			return true;
		else if (lang === 'en') // si prefiere inglés, pues no
			return false;
		// en otro caso sigo analizando...		
	}
	return false;
}

// extracción literal
function getLiteral(litobj, def) {
	// si no está definido el objeto, valor por defecto
	if (litobj == undefined)
		return def;
		
	// 5/3/21 si es un array, convierto a un objeto
	if (Array.isArray(litobj)) {
		let aux = {};
		for (let i=0; i<litobj.length; i++) {
			const el = litobj[i];
			if (typeof el === 'object') {
				// incluyo en aux los pares clave-valor
				const claves = Object.keys(el);
				for (let j=0; j<claves.length; j++) {
					const clave = claves[j];
					aux[clave] = el[clave];				
				}
			}
			else // si no es un objeto, meto directamente el valor con "nolang"
				aux[config.nolang] = el;
		}
		// cambio el objeto a analizar
		litobj = aux;
	} else if (typeof litobj !== 'object') { // y si es un literal lo convierto
		let aux = {}
		aux[config.nolang] = litobj;
		litobj = aux;
	}	
	
	// obtain list of language tags of the literal
	const ltags = Object.keys(litobj);
	// obtain list of user's preferred languages
	const preflangs = window.navigator.languages || [window.navigator.language || window.navigator.userLanguage];
	// return string with the preferred language, if exists
	for (let ind = 0 ; ind < preflangs.length; ind++) {
		const ltag = preflangs[ind];
		if (litobj[ltag] != undefined) 
			return litobj[ltag];
		// no luck, but maybe there is a language variant that serves (check with substrings)
		const lang = ltag.substring(0, 2);
		const tag = _.find(ltags, function(el) { return el !== config.nolang && el.substring(0, 2) ===  lang;});
		if (tag != undefined)
			return litobj[tag];			
	}
	// no preferred language, try with English
	const entag = _.find(ltags, function(el) { return el !== config.nolang && el.substring(0, 2) ===  'en';}); 
	if (entag != undefined) 
		return litobj[entag];
	// en otro caso devuelvo la cadena sin etiqueta de idioma
	if (litobj[config.nolang] != undefined) 
		return litobj[config.nolang];
	// pruebo en latín...
	const latag = _.find(ltags, function(el) { return el !== config.nolang && el.substring(0, 2) ===  'la';}); 
	if (latag != undefined) 
		return litobj[latag];
	// por última opción devuelvo la cadena por defecto
	return def;
}

// para visualizar paths o fragmentos de uris
function uriToLiteral(uri) {
	// extraigo la última parte de la uri
	var lit = "";
	if (uri.split("#").length > 1)
		lit = uri.split("#")[uri.split("#").length -1];
	else {
		lit = uri.split("/")[uri.split("/").length -1];
		if (lit === "")
			lit = uri.split("/")[uri.split("/").length -2];
	}
	// sustituyo - y _ por espacio
	lit = lit.replace(/-/g, " "); 
	lit = lit.replace(/_/g, " ");
	return lit;
}

function firstUppercase(lit) {
	if (lit != undefined && lit.length > 0)
		return lit.charAt(0).toUpperCase() + lit.slice(1);
		//return lit.charAt(0).toUpperCase() + lit.slice(1).toLowerCase();
	else
		return lit;
}
