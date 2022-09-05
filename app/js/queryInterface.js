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

/////////////// SOLR

function TextEngine(suggestPath, selectPath) {
	// inicialización de opciones
	const options = {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		};
			
	// test 
	this.test = async function() {
		// pruebo las sugerencias
		//console.debug(suggestPath);
		const sug = await fetch(suggestPath, options);
		if (sug.ok) { // if HTTP-status is 200-299
			// fue bien, pruebo la selección
			//console.debug(selectPath);
			const sel = await fetch(selectPath, options);
			if (sel.ok)
				return Promise.resolve(true);
			else {
				// logging del error
				const mens = 'SOLR error - url: ' + selectPath
					+ ' - code: ' + sel.status + ' - mens: ' + sel.statusText;
				// rechazo la promesa
				return Promise.reject(mens);				
			}		
		} 
		else {
			// logging del error
			const mens = 'SOLR error - url: ' + suggestPath
				+ ' - code: ' + sug.status + ' - mens: ' + sug.statusText;
			// rechazo la promesa
			return Promise.reject(mens);
		}
	}
	
	// petición sugerencias
	this.getSuggestions = async function(input, types) {
		// preparo la url de la petición
		const url = suggestPath + Mustache.render(config.solrConfig.suggestTemplate, {input: input, types: types} );
		// hago petición
		const datos = await this.getData(url);			
		return datos;
	}
	
	// petición documento
	this.getDocument = async function(uri) {
		// preparo la url de la petición
		const url = selectPath + Mustache.render(config.solrConfig.selectTemplate, {uri: uri} );
		// hago petición
		const datos = await this.getData(url);			
		return datos;
	}
	
	this.getData = async function(url) {
		// hago log de la url
		//console.debug(url);
		// hago la petición
		const response = await fetch(url, options);
		if (response.ok) { // if HTTP-status is 200-299
			// petición exitosa
			const datos = await response.json();
			// devuelvo los datos
			return Promise.resolve(datos);		
		} else  { // logging del error
			const eobj = {
				status: response.status,
				url: url,
				mens: 'SOLR error - url: ' + url
				+ ' - code: ' + response.status + ' - mens: ' + response.statusText
			};
			// rechazo la promesa
			return Promise.reject(eobj);
		}	
	}	
}


/////////////// CRAFTS

function CraftsAPI(craftsConfig) {
	// inicialización de opciones
	const options = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': craftsConfig.auth
			}
		};
			
	// test 
	this.test = async function() {
		// hago log de la url de prueba
		console.debug(craftsConfig.api);
		const response = await fetch(craftsConfig.api, options);
		if (response.ok) // if HTTP-status is 200-299
			return Promise.resolve(true);
		else  {
			// logging del error
			const mens = 'CRAFTS error - url: ' + craftsConfig.api
				+ ' - code: ' + response.status + ' - mens: ' + response.statusText;
			// rechazo la promesa
			return Promise.reject(mens);
		}
	}
	
	// petición cualquiera de CRAFTS
	this.getData = async function(template, objpars) {
		// preparo la url de la petición
		const url = craftsConfig.api + Mustache.render(template, objpars);
		// hago log de la url
		console.debug(url);
		// hago la petición
		const response = await fetch(url, options);
		if (response.ok) { // if HTTP-status is 200-299
			// petición exitosa
			const datos = await response.json();
			// devuelvo los datos
			return Promise.resolve(datos);		
		} else  { // logging del error
			const eobj = {
				status: response.status,
				url: url,
				mens: 'CRAFTS error - url: ' + url
				+ ' - code: ' + response.status + ' - mens: ' + response.statusText
			};
			// rechazo la promesa
			return Promise.reject(eobj);
		}
	}
}