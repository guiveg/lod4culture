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

const config = {
	title: 'LOD4Culture',
	version: '1.1',

	// geo widget - Leaflet: http://leafletjs.com/
	geotemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	geooptions: {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://www.gsic.uva.es/members/guiveg">Guillermo Vega Gorgojo</a>',
		minZoom: 4,
		maxZoom: 20,
		tileSize: 512,
		zoomOffset: -1,
	},
	geolocstart: [40.24, -4.24], // localización de la península Ibérica según DBpedia-es
	
	// niveles y umbrales zoom
	zStart: 7,
	zMyloc: 10,
	zPlace: 15,
	zDegreesStep4: 9,// 8,//7.5, // determina el tamaño de celda
		
	// config timeout
	timeout: 10000, // timeout por defecto (10s)
	timeoutStep: 2000, // escalón timeout (2s)
	timeoutSpinner: 20000,
	
	// umbral para pedir los datos de los sitios
	cellSiteThresholdWide: 10, // área amplia
	cellSiteThresholdNarrow: 25, // área pequeña (para poder ver más cosas posicionadas en el mismo sitio => problema de los datos)

	// CRAFTS
	craftsConfig: {
		api: 'YOUR_CRAFTS_API',
		auth: 'Bearer YOUR_CRAFTS_API_READ_TOKEN',
		queryCountSitesBox: '/query?id=countSitesInbox&lngwest={{lngwest}}&lngeast={{lngeast}}&latnorth={{latnorth}}&latsouth={{latsouth}}{{#type}}&type={{{type}}}{{/type}}',
		querySitesBox: '/query?id=sitesInbox&lngwest={{lngwest}}&lngeast={{lngeast}}&latnorth={{latnorth}}&latsouth={{latsouth}}{{#limit}}&limit={{limit}}{{/limit}}{{#offset}}&offset={{offset}}{{/offset}}{{#type}}&type={{{type}}}{{/type}}',
		queryMostPopularLoc: '/query?id=mostPopularLocationInbox&lngwest={{lngwest}}&lngeast={{lngeast}}&latnorth={{latnorth}}&latsouth={{latsouth}}',
		queryMostPopularArtsSite: '/query?id=mostPopularArtworksAtSite&site={{{site}}}&limit=10',
		resourceTemplate: '/resource?id={{{id}}}&iri={{{iri}}}',
		resourcesTemplate: '/resources?id={{{id}}}{{#iris}}&iris={{{.}}}{{/iris}}{{#ns}}&ns={{{ns}}}{{/ns}}{{#nspref}}&nspref={{{nspref}}}{{/nspref}}'		
	},
	
	
	// SOLR	
	solrConfig: {
		path: 'YOUR_SOLR_SERVER',
		suggestHandler: '/suggest',
		suggester: {
			es: "mySuggesterES",
			en: "mySuggesterEN",
		},
		suggestTemplate: '?q={{{input}}}&suggest.cfq={{{types}}}',
		selectHandler: '/select',
		selectTemplate: '?q=id:"{{{uri}}}"'
	},
	maxSolrSuggestions: 10,
		
	
	// TIPOS SITIOS
	topTypes: [
		'http://www.wikidata.org/entity/Q1370598', // lugar de culto
		'http://www.wikidata.org/entity/Q839954', // yacimiento arqueológico
		'http://www.wikidata.org/entity/Q4989906', // monumento
		'http://www.wikidata.org/entity/Q33506', // museo
		'http://www.wikidata.org/entity/Q42948', // muralla
		'http://www.wikidata.org/entity/Q23413', // castillo
		'http://www.wikidata.org/entity/Q12518', // torre
		'http://www.wikidata.org/entity/Q294422', // edificio público
		'http://www.wikidata.org/entity/Q1021645', // edificio oficinas
		'http://www.wikidata.org/entity/Q79146420', // edificio de varios pisos
		'http://www.wikidata.org/entity/Q83405', // fábrica
		'http://www.wikidata.org/entity/Q16560', // palacio
		'http://www.wikidata.org/entity/Q174782', // plaza
		'http://www.wikidata.org/entity/Q123705', // barrio
		'http://www.wikidata.org/entity/Q483453', // fuente
		'http://www.wikidata.org/entity/Q22652', // espacio verde
		'http://www.wikidata.org/entity/Q45580643' // sitio de patrimonio nacional	
	],
	maxTypeDepth: 4,
	
	// SUGERENCIAS
	// número de sugerencias a mostrar
	numsugs: 8,	
	// hide elements list
	hidemax: 8,
	hidebegin: 5,

	// lang
	nolang: "nolang",
		
	// questionnaire
	mediumQuestGap: 1000*3600*24*4, // tiempo mínimo desde primera sesión para mostrar cuestionario (4 días en ms)
	longQuestGap: 1000*3600*24*40, // tiempo mínimo desde que fue al cuestionario o dijo que no (40 días en ms)
	sessionQuestGap: 1000*60*4, // tiempo mínimo desde primera sesión para mostrar cuestionario (4 minutos en ms)
};
