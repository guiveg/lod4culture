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

// EventData is global and unique (only one EventData at a time)
EventData = undefined;
	
function initMapEvent() {
	EventData = {};
	// inicializo location, crafts_reqs, num_cells y site_type
	EventData.location = loc2string(Sesion.estado.loc);
	EventData.crafts_reqs = 0;
	EventData.num_cells = 0;
	if (Sesion.estado.siteType != undefined)
		EventData.site_type = Sesion.estado.siteType;
	// timestamp in milliseconds
	EventData.init = Date.now();
}

function initResourceEvent() {
	EventData = {};
	// inicializo resource, type y crafts_reqs
	EventData.resource = Sesion.estado.uri;
	EventData.type = Sesion.estado.type;
	EventData.crafts_reqs = 0;
	// timestamp in milliseconds
	EventData.init = Date.now();
}

// común al mapa y al recurso para incrementar crafts_reqs o lo que haga falta
function addEventData(key, amount) {
	if (EventData != undefined) {
		if (EventData[key] != undefined)
			EventData[key] += amount;
	}
}

function sendMapEvent() {
	if (EventData != undefined) {
		// timestamp de fin en milisegundos
		EventData.end = Date.now(); // timestamp in milliseconds 		
		// calculo latencia y elimino init y end
		EventData.latency_ms = EventData.end - EventData.init;
		delete EventData.end;
		delete EventData.init;
		// envío el evento
		sendEvent('map_update', EventData);	
	}
}

function sendResourceEvent(label) {
	if (EventData != undefined) {
		// incluyo label
		EventData.label = label;
		// timestamp de fin en milisegundos
		EventData.end = Date.now(); // timestamp in milliseconds 		
		// calculo latencia y elimino init y end
		EventData.latency_ms = EventData.end - EventData.init;
		delete EventData.end;
		delete EventData.init;
		// envío el evento
		sendEvent('resource_page', EventData);	
	}
}

function sendMapTimeoutEvent() {
	if (EventData != undefined) {
		// pongo por latencia el timeout y elimino init y end
		EventData.latency_ms = Sesion.timeout;
		delete EventData.end;
		delete EventData.init;
		// envío el evento
		sendEvent('map_update_timeout', EventData);
	}
}

function sendError429Event() {
	if (EventData != undefined) {
		// pongo por latencia el timeout y elimino init y end
		EventData.latency_ms = Sesion.timeout;
		delete EventData.end;
		delete EventData.init;
		// envío el evento
		sendEvent('error_429', EventData);
	}
}

// mando evento GA4
function sendEvent(eventName, eventData) {
	gtag("event", eventName, eventData);
}