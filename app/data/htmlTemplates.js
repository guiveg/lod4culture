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

//////////////////////
// HTML TEMPLATES FILE
//////////////////////

var cardTemplate = 
'<div id="tarjeta" class="card-body mitarjeta p-1" > \
	<div class="d-flex flex-row"> \
		<button id ="bot_home" class="btn btn-outline-secondary {{#esmovil}}px-2"{{/esmovil}} type="button"> \
			<i class="fa fa-home"></i> \
		</button> \
		<button id ="bot_spinner" class="btn btn-secondary {{#esmovil}}px-2{{/esmovil}} d-none" type="button" disabled> \
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> \
			<span class="sr-only">Loading...</span> \
		</button> \
		<button id="bot_types" class="text-nowrap btn btn-outline-secondary ml-1 {{#esmovil}}px-1{{/esmovil}}" type="button" disabled \
			>'+getLiteral(dict.typefilter)+'</button> \
		<div id="lugares_heading" class="flex-fill ml-1"> \
			<input id="in_lugares" autocomplete="off" type="search" class="form-control " \
				placeholder="'+getLiteral(dict.searchresource)+'" aria-label="'+getLiteral(dict.searchresource)+'"> \
		</div> \
	</div> \
	<div id="sugelugares" class="list-group mt-2 d-none"></div> \
	<div id="types_subheading"></div> \
	<div id="types_block" class="list-group overflow-auto mt-1 d-none" style="max-height:50vh;"></div> \
	<div id="filtro_type" class="d-none"> \
		<div class="d-flex align-items-center border mt-1"> \
			<div id="div_label_filtro_type" class="ml-1"></div> \
			<div class="ml-auto mr-2"> \
				<button id="bot_info_filtro_type" class="btn btn-sm text-secondary" url="" > \
					<i class="fa fa-info-circle"></i> \
				</button> \
			</div> \
			<div id="bot_quitar_tipo" class="mr-2 pb-1"> \
				<button type="button" class="close" aria-label="Close"> \
					<span aria-hidden="true">&times;</span> \
				</button> \
			</div> \
		</div> \
	</div> \
	<div id="mibarradiv" class="progress mt-1 d-none"> \
         <div id="mibarra" class="progress-bar progress-bar-striped progress-bar-animated bg-secondary" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div> \
    </div> \
</div>';


var sugeLugaresTemplate = 
	'{{#sugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2 bot_suge_lugar" uri="{{uri}}">{{{label}}}</button> \
	{{/sugerencias}} \
	{{#nosugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2" disabled>'+getLiteral(dict.noresourcesfound)+'</button> \
	{{/nosugerencias}}';


var sugeResourcesTemplate = 
	'{{#sugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2 bot_suge_resource" uri="{{uri}}">{{{label}}}</button> \
	{{/sugerencias}} \
	{{#nosugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2" disabled>'+getLiteral(dict.noresourcesfound)+'</button> \
	{{/nosugerencias}}';
	

var typesSubheadingTemplate = 
	'{{#activar}} \
		<input id="in_types" autocomplete="off" type="search" class="form-control mt-1 mb-1" \
			 placeholder="'+getLiteral(dict.searchtype)+'" aria-label="'+getLiteral(dict.searchtype)+'"> \
	{{/activar}} \
	<div id="sugetypes" class="list-group"></div>';


var sugeTypesTemplate = 
	'{{#sugerencias}} \
		<button class="list-group-item list-group-item-action bot_suge_type" type="button" turi="{{uri}}"> \
			{{{labelshown}}}<span class="badge badge-secondary float-right" \
				data-placement="top">{{score}}</span> \
		</button> \
	{{/sugerencias}} \
	{{#nosugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2 bot_suge_type" disabled>'+getLiteral(dict.notypesfound)+'</button> \
	{{/nosugerencias}}';


var typesBlockTemplate = 
	'{{#.}} \
		<div class="{{^esconder}}d-flex {{/esconder}}border-bottom border-left border-right sitetype {{#esconder}}d-none{{/esconder}}" indice="{{indice}}"> \
			{{#botonesconder}} \
				<div><span>{{{indentspace}}}</span><span><button type="button" class="btn btn-outline-secondary btn-sm showmore">'+getLiteral(dict.showmore)+'</button></span></div> \
			{{/botonesconder}} \
			{{^botonesconder}} \
				<div class="flex-grow-1"> \
					<button class="list-group-item list-group-item-action border-0 bot_sel_tipo" type="button" turi="{{uri}}"> \
						{{{indentspace}}}{{label}}<span class="badge badge-secondary float-right" \
							data-placement="top">{{score}}</span> \
					</button> \
				</div> \
				<div class="p-1"> \
					<button class="btn btn-outline-secondary btn-sm bot_expandir_tipo {{#nosubclasses}}invisible{{/nosubclasses}}" \
						type="button" data-placement="top"><i class="fa fa-chevron-right"></i> \
					</button> \
				</div> \
			{{/botonesconder}} \
		</div> \
	{{/.}}';
	

var errorEndpointTemplate =
	'<div class="modal" id="errorEndpointModal" tabindex="-1" role="dialog" \
			 aria-labelledby="exampleModalLabel" aria-hidden="true"> \
		<div class="modal-dialog" role="document"> \
			<div class="modal-content"> \
				<div class="modal-header"> \
					<h5 class="modal-title" id="exampleModalLabel">'+getLiteral(dict.errorEndpointTitle)+'</h5> \
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"> \
				  		<span aria-hidden="true">&times;</span> \
					</button> \
				</div> \
				<div class="modal-body"> \
					<p>'+getLiteral(dict.errorEndpointText)+'</p> \
				</div> \
				<div class="modal-footer"> \
			        <button type="button" class="btn btn-secondary" data-dismiss="modal">'+getLiteral(dict.close)+'</button> \
				</div> \
			</div> \
		</div> \
	</div>';

var errorResourceTemplate =
	'<div class="modal" id="errorResourceModal" tabindex="-1" role="dialog" \
			 aria-labelledby="exampleModalLabel" aria-hidden="true"> \
		<div class="modal-dialog" role="document"> \
			<div class="modal-content"> \
				<div class="modal-header"> \
					<h5 class="modal-title" id="exampleModalLabel">'+getLiteral(dict.errorResourceTitle)+'</h5> \
					<button type="button" class="resourcerror close" data-dismiss="modal" aria-label="Close"> \
				  		<span aria-hidden="true">&times;</span> \
					</button> \
				</div> \
				<div class="modal-body"> \
					<p>'+getLiteral(dict.errorResourceText)+'</p> \
				</div> \
				<div class="modal-footer"> \
			        <button type="button" class="resourcerror btn btn-secondary" data-dismiss="modal">'+getLiteral(dict.close)+'</button> \
				</div> \
			</div> \
		</div> \
	</div>';

var error429Template  =
	'<div class="modal" id="error429Modal" tabindex="-1" role="dialog" \
			 aria-labelledby="exampleModalLabel" aria-hidden="true"> \
		<div class="modal-dialog" role="document"> \
			<div class="modal-content"> \
				<div class="modal-header"> \
					<h5 class="modal-title" id="exampleModalLabel">'+getLiteral(dict.error429Title)+'</h5> \
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"> \
				  		<span aria-hidden="true">&times;</span> \
					</button> \
				</div> \
				<div class="modal-body"> \
					<p>'+getLiteral(dict.error429Text)+'</p> \
				</div> \
				<div class="modal-footer"> \
			        <button type="button" class="btn btn-secondary" data-dismiss="modal">'+getLiteral(dict.close)+'</button> \
				</div> \
			</div> \
		</div> \
	</div>';


var iconSiteTemplate =
	'<img src="{{^image}}images/chsite.png{{/image}}{{#image}}{{{image}}}?width=48{{/image}}" \
		class="marcadorImagen{{#pro}}PRO{{/pro}}" {{#acronym}}alt="{{acronym}}{{/acronym}}">';


var popupSiteTemplate =	
	'<div style="max-width: 190px;"> \
		{{#image}}<img src="{{{image}}}?width=190" class="card-img-top" >{{/image}} \
		<h5 class="card-title my-1 my-sm-2">{{label}}</h5> \
		{{#desc}}<p class="card-text mt-0 mb-1 mb-sm-2">{{{.}}}</p>{{/desc}} \
		<div id="popuploading" class="d-flex align-items-center mt-0 mb-1 mb-sm-2"> \
			<div class="spinner-border spinner-border-sm mr-2"></div> \
			<span>'+getLiteral(dict.loadingartworks)+'</span> \
		</div> \
		<div style="display: flex; justify-content: center;"> \
			<button uri="{{{uri}}}" class="moreinfo site btn btn-primary" type="button">'+getLiteral(dict.moreinfo)+'</button> \
		</div> \
	</div>';
var popupSiteTemplatePRO =	
	'<div style="max-width: 190px;"> \
		{{#noartworks}} \
			{{#image}}<img src="{{{image}}}?width=190" class="card-img-top" >{{/image}} \
		{{/noartworks}}	\
		{{^noartworks}} \
			<div id="carouselPopupSite" class="carousel slide" data-ride="carousel"> \
				<div class="carousel-inner"> \
					{{#image}} \
						<div class="carousel-item"> \
							<img src="{{{image}}}?width=190" class="d-block w-100"> \
						</div> \
					{{/image}} \
					{{#artworks}} \
						<div class="carousel-item {{#active}}active{{/active}}"> \
							<img src="{{{image}}}?width=190" class="d-block w-100"> \
							<div class="carousel-caption"> \
								<p class="mb-1">{{{caption}}}</p> \
								<button uri="{{{iri}}}" class="moreinfo btn btn-primary btn-sm" type="button">'+getLiteral(dict.view)+'</button> \
							</div> \
						</div> \
					{{/artworks}} \
				</div> \
				<button class="carousel-control-prev" type="button" data-target="#carouselPopupSite" data-slide="prev"> \
					<span class="carousel-control-prev-icon" aria-hidden="true"></span> \
					<span class="sr-only">Previous</span> \
				</button> \
				<button class="carousel-control-next" type="button" data-target="#carouselPopupSite" data-slide="next"> \
					<span class="carousel-control-next-icon" aria-hidden="true"></span> \
					<span class="sr-only">Next</span> \
				</button>   \
			</div> \
		{{/noartworks}}	\
		<h5 class="card-title my-1 my-sm-2">{{label}}</h5> \
		{{#desc}}<p class="card-text mt-0 mb-1 mb-sm-2">{{{.}}}</p>{{/desc}} \
		<div style="display: flex; justify-content: center;"> \
			<button uri="{{{uri}}}" class="moreinfo site btn btn-primary" type="button">'+getLiteral(dict.moreinfo)+'</button> \
		</div> \
	</div>';	
		
	
var spinnerTemplate =
	'<div class="d-flex flex-row bd-highlight m-5"> \
		<div class="p-3 bd-highlight"><div class="spinner-border" role="status" aria-hidden="true"></div></div> \
		<div class="ml-5 bd-highlight"><div><h3 id="titleSpinner">'+getLiteral(dict.spinnerLoading)+'</h3><p id="infoSpinner" class="font-weight-light">'+getLiteral(dict.spinnerInfo)+'</p></div></div> \
	</div>';


var sitePageTemplate =
	'<div class="jumbotron"> \
		{{#haySolr}} \
			<div id="buscador_heading" class="d-flex flex-column col-md-5 mt-3 mt-sm-4"> \
				<div class=""> \
					<input id="in_recursos" autocomplete="off" type="search" class="form-control" \
						placeholder="'+getLiteral(dict.searchresource)+'" aria-label="'+getLiteral(dict.searchresource)+'"> \
				</div> \
				<div id="sugerecursos" class="list-group mt-2"></div> \
			</div> \
		{{/haySolr}} \
		<h1 class="display-4 {{#haySolr}}mt-4 mt-sm-3{{/haySolr}}">{{#pro}}⭐ {{/pro}}{{label}}</h1> \
		{{#desc}} \
			<p class="lead">{{.}}</p> \
		{{/desc}} \
		{{#comment}} \
			<p>{{.}}</p> \
		{{/comment}} \
		{{#types.length}} \
			<p><h5>'+getLiteral(dict.types)+'</h5> {{#types}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/types}} \
		{{/types.length}} \
		{{#cats.length}} \
			<p><h5>'+getLiteral(dict.categories)+'</h5> {{#cats}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/cats}}</p> \
		{{/cats.length}} \
		<p><h5>'+getLiteral(dict.sources)+'</h5> {{#sources}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/sources}}</p> \
		{{#hayBack}}<button type="button" class="back btn btn-primary">{{backLabel}}</button>{{/hayBack}} \
		{{#hayGo2Map}}<button type="button" class="go2map btn btn-primary ml-1">'+getLiteral(dict.go2map)+'</button>{{/hayGo2Map}} \
		{{#guasaps}}<a id="guasaps" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{guasaps}}}" data-action="share/whatsapp/share"><i class="fa fa-whatsapp"></i></a> \
		{{/guasaps}} \
		<a id="facebook" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{facebook}}}"><i class="fa fa-facebook"></i></a> \
		<a id="twitter" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{twitter}}}"><i class="fa fa-twitter"></i></a> \
		<hr class="my-4"> \
		{{#images}}<div style="max-width: {{iwidth}}px;" class="mb-3"><img src="{{{.}}}?width={{iwidth}}"></div>{{/images}} \
		{{#haymapa}}<div id="site_map" class="mb-3" style="max-width: {{iwidth}}px; height: 300px;"></div>{{/haymapa}} \
		<ul class="list-group"> \
			<li class="list-group-item list-group-item-primary"><strong>'+getLiteral(dict.basicInfo)+'</strong></li> \
			{{#partof.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.partof)+'</i></div> \
					<div class="col-sm-8">{{#partof}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/partof}}</div> \
				</div> \
			</li>{{/partof.length}} \
			{{#locations.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.location)+'</i></div> \
					<div class="col-sm-8">{{#locations}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/locations}}</div> \
				</div> \
			</li>{{/locations.length}} \
			{{#country}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.country)+'</i></div> \
					<div class="col-sm-8"><button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button></div> \
				</div> \
			</li>{{/country}} \
			{{#archStyles.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.archStyle)+'</i></div> \
					<div class="col-sm-8">{{#archStyles}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/archStyles}}</div> \
				</div> \
			</li>{{/archStyles.length}} \
			{{#architect.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.architect)+'</i></div> \
					<div class="col-sm-8">{{#architect}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/architect}}</div> \
				</div> \
			</li>{{/architect.length}} \
			{{#founder.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.founder)+'</i></div> \
					<div class="col-sm-8">{{#founder}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/founder}}</div> \
				</div> \
			</li>{{/founder.length}} \
			{{#inception}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.siteInception)+'</i></div> \
					<div class="col-sm-8">{{inception}}</div> \
				</div> \
			</li>{{/inception}} \
			{{#length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.length)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/length}} \
			{{#width}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.width)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/width}} \
			{{#height}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.height)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/height}} \
			{{#area}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.area)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/area}} \
			{{#materials.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.materials)+'</i></div> \
					<div class="col-sm-8">{{#materials}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/materials}}</div> \
				</div> \
			</li>{{/materials.length}} \
			{{#heritageDesignations.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.heritageDesignations)+'</i></div> \
					<div class="col-sm-8">{{#heritageDesignations}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/heritageDesignations}}</div> \
				</div> \
			</li>{{/heritageDesignations.length}} \
			{{#visitorsPerYear.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.visitorsPerYear)+'</i></div> \
					<div class="col-sm-8">{{#visitorsPerYear}}{{#label}}<button url="{{{iri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{value}} ({{year}})</button>{{/label}}{{/visitorsPerYear}}</div> \
				</div> \
			</li>{{/visitorsPerYear.length}} \
		</ul> \
		{{#works.length}} \
			<ul class="list-group mt-3"> \
				<li class="list-group-item list-group-item-primary"><strong>'+getLiteral(dict.artworks)+'</strong></li> \
				{{#workPaging}} \
				<li class="list-group-item"><!-- RESOURCE PAGINATION AND SEARCH --> \
					<div class="row"> \
						<div class="col-sm"> \
							<button id="prev_page_artworks" type="button" class="btn btn-outline-secondary" disabled> \
							  <i class="fa fa-chevron-left"></i> \
							</button> \
							<button id="next_page_artworks" type="button" class="btn btn-outline-secondary"> \
							  <i class="fa fa-chevron-right"></i> \
							</button> \
							<span id="page_artworks" class="text-nowrap ml-2">'+getLiteral(dict.page)+' 1 '+getLiteral(dict.of)+' {{numWorkPages}}</span> \
						</div> \
						<div class="input-group col-sm"> \
							<input id="page_input_artworks" class="form-control" type="number" min="1" max="{{numWorkPages}}" placeholder="'+getLiteral(dict.page)+'..." > \
							<div class="input-group-append"> \
								<button id="go_page_artworks" class="btn btn-outline-secondary" type="button" >'+getLiteral(dict.go)+'</button> \
							</div> \
						</div> \
						<div class="input-group col-sm"> \
							<input id="search_artworks" autocomplete="off" type="search" class="form-control" placeholder="'+getLiteral(dict.searchArtwork)+'..." aria-label="'+getLiteral(dict.searchArtwork)+'..."> \
						</div> \
					</div><!-- /row --> \
				</li><!-- /RESOURCE PAGINATION AND SEARCH --> \
				{{/workPaging}} \
				{{#works}}{{#label}} \
					<button uri="{{{uri}}}" tipo="Artwork" npage="{{npage}}" type="button" class="resource list-group-item list-group-item-action {{#esconder}}d-none{{/esconder}}">{{label}}</button> \
				{{/label}}{{/works}} \
			</ul> \
		{{/works.length}} \
	</div>';


var artworkPageTemplate =
	'<div class="jumbotron"> \
		{{#haySolr}} \
			<div id="buscador_heading" class="d-flex flex-column col-md-5 mt-3 mt-sm-4"> \
				<div class=""> \
					<input id="in_recursos" autocomplete="off" type="search" class="form-control" \
						placeholder="'+getLiteral(dict.searchresource)+'" aria-label="'+getLiteral(dict.searchresource)+'"> \
				</div> \
			<div id="sugerecursos" class="list-group mt-2"></div> \
		</div> \
		{{/haySolr}} \
		<h1 class="display-4 {{#haySolr}}mt-4 mt-sm-3{{/haySolr}}">{{#pro}}⭐ {{/pro}}{{label}}</h1> \
		{{#desc}} \
			<p class="lead">{{.}}</p> \
		{{/desc}} \
		{{#comment}} \
			<p>{{.}}</p> \
		{{/comment}} \
		{{#types.length}} \
			<p><h5>'+getLiteral(dict.types)+'</h5> {{#types}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/types}} \
		{{/types.length}} \
		{{#cats.length}} \
			<p><h5>'+getLiteral(dict.categories)+'</h5> {{#cats}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/cats}}</p> \
		{{/cats.length}} \
		<p><h5>'+getLiteral(dict.sources)+'</h5> {{#sources}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/sources}}</p> \
		{{#hayBack}}<button type="button" class="back btn btn-primary">{{backLabel}}</button>{{/hayBack}} \
		{{#hayGo2Map}}<button type="button" class="go2map btn btn-primary ml-1">'+getLiteral(dict.go2map)+'</button>{{/hayGo2Map}} \
		{{#guasaps}}<a id="guasaps" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{guasaps}}}" data-action="share/whatsapp/share"><i class="fa fa-whatsapp"></i></a> \
		{{/guasaps}} \
		<a id="facebook" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{facebook}}}"><i class="fa fa-facebook"></i></a> \
		<a id="twitter" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{twitter}}}"><i class="fa fa-twitter"></i></a> \
		<hr class="my-4"> \
		{{#image}}<div style="max-width: {{iwidth}}px;" class="mb-3"><img src="{{{image}}}?width={{iwidth}}"></div>{{/image}} \
		<ul class="list-group"> \
			<li class="list-group-item list-group-item-primary"><strong>'+getLiteral(dict.artworkInfo)+'</strong></li> \
			{{#creator.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.creator)+'</i></div> \
					<div class="col-sm-8"> \
						{{#creator}}{{#label}} \
							<button uri="{{{uri}}}" tipo="Artist" type="button" class="resource btn btn-primary">{{label}}</button>	\
						{{/label}}{{/creator}} \
					</div> \
				</div> \
			</li>{{/creator.length}} \
			{{#locations.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.location)+'</i></div> \
					<div class="col-sm-8"> \
						{{#locations}} \
							<button uri="{{{uri}}}" tipo="Site" type="button" class="resource btn btn-primary">{{label}}</button>	\
						{{/locations}} \
					</div> \
				</div> \
			</li>{{/locations.length}} \
			{{#partof.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.partof)+'</i></div> \
					<div class="col-sm-8">{{#partof}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/partof}}</div> \
				</div> \
			</li>{{/partof.length}} \
			{{#genres.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.genre)+'</i></div> \
					<div class="col-sm-8">{{#genres}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/genres}}</div> \
				</div> \
			</li>{{/genres.length}} \
			{{#movements.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.movement)+'</i></div> \
					<div class="col-sm-8">{{#movements}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/movements}}</div> \
				</div> \
			</li>{{/movements.length}} \
			{{#inception}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.artworkInception)+'</i></div> \
					<div class="col-sm-8">{{inception}}</div> \
				</div> \
			</li>{{/inception}} \
			{{#width}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.width)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/width}} \
			{{#height}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.height)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/height}} \
			{{#mass}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.mass)+'</i></div> \
					<div class="col-sm-8">{{value}}{{unit}}</div> \
				</div> \
			</li>{{/mass}} \
			{{#materials.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.materials)+'</i></div> \
					<div class="col-sm-8">{{#materials}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/materials}}</div> \
				</div> \
			</li>{{/materials.length}} \
			{{#mainSubject.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.mainSubject)+'</i></div> \
					<div class="col-sm-8">{{#mainSubject}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/mainSubject}}</div> \
				</div> \
			</li>{{/mainSubject.length}} \
			{{#depicts.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.depicts)+'</i></div> \
					<div class="col-sm-8">{{#depicts}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/depicts}}</div> \
				</div> \
			</li>{{/depicts.length}} \
		</ul> \
	</div>';

	
var artistPageTemplate =
	'<div class="jumbotron"> \
		{{#haySolr}} \
			<div id="buscador_heading" class="d-flex flex-column col-md-5 mt-3 mt-sm-4"> \
				<div class=""> \
					<input id="in_recursos" autocomplete="off" type="search" class="form-control" \
						placeholder="'+getLiteral(dict.searchresource)+'" aria-label="'+getLiteral(dict.searchresource)+'"> \
				</div> \
				<div id="sugerecursos" class="list-group mt-2"></div> \
			</div> \
		{{/haySolr}} \
		<h1 class="display-4 {{#haySolr}}mt-4 mt-sm-3{{/haySolr}}">{{#pro}}⭐ {{/pro}}{{label}}</h1> \
		{{#desc}} \
			<p class="lead">{{.}}</p> \
		{{/desc}} \
		{{#comment}} \
			<p>{{.}}</p> \
		{{/comment}} \
		{{#types.length}} \
			<p><h5>'+getLiteral(dict.types)+'</h5> {{#types}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/types}} \
		{{/types.length}} \
		{{#cats.length}} \
			<p><h5>'+getLiteral(dict.categories)+'</h5> {{#cats}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/cats}}</p> \
		{{/cats.length}} \
		<p><h5>'+getLiteral(dict.sources)+'</h5> {{#sources}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/sources}}</p> \
		{{#hayBack}}<button type="button" class="back btn btn-primary">{{backLabel}}</button>{{/hayBack}} \
		{{#hayGo2Map}}<button type="button" class="go2map btn btn-primary ml-1">'+getLiteral(dict.go2map)+'</button>{{/hayGo2Map}} \
		{{#guasaps}}<a id="guasaps" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{guasaps}}}" data-action="share/whatsapp/share"><i class="fa fa-whatsapp"></i></a> \
		{{/guasaps}} \
		<a id="facebook" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{facebook}}}"><i class="fa fa-facebook"></i></a> \
		<a id="twitter" class="btn btn-primary ml-1" target="_blank" role="button" \
			href="{{{twitter}}}"><i class="fa fa-twitter"></i></a> \
		<hr class="my-4"> \
		{{#image}}<div style="max-width: {{iwidth}}px;" class="mb-3"><img src="{{{image}}}?width={{iwidth}}"></div>{{/image}} \
		<ul class="list-group"> \
			<li class="list-group-item list-group-item-primary"><strong>'+getLiteral(dict.basicInfo)+'</strong></li> \
			{{#country.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.country)+'</i></div> \
					<div class="col-sm-8">{{#country}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/country}}</div> \
				</div> \
			</li>{{/country.length}} \
			{{#placeOfBirth.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.placeOfBirth)+'</i></div> \
					<div class="col-sm-8">{{#placeOfBirth}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/placeOfBirth}}</div> \
				</div> \
			</li>{{/placeOfBirth.length}} \
			{{#dateOfBirth}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.dateOfBirth)+'</i></div> \
					<div class="col-sm-8">{{dateOfBirth}}</div> \
				</div> \
			</li>{{/dateOfBirth}} \
			{{#placeOfDeath.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.placeOfDeath)+'</i></div> \
					<div class="col-sm-8">{{#placeOfDeath}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/placeOfDeath}}</div> \
				</div> \
			</li>{{/placeOfDeath.length}} \
			{{#dateOfDeath}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.dateOfDeath)+'</i></div> \
					<div class="col-sm-8">{{dateOfDeath}}</div> \
				</div> \
			</li>{{/dateOfDeath}} \
			{{#occupations.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.occupations)+'</i></div> \
					<div class="col-sm-8">{{#occupations}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/occupations}}</div> \
				</div> \
			</li>{{/occupations.length}} \
			{{#genres.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.genre)+'</i></div> \
					<div class="col-sm-8">{{#genres}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/genres}}</div> \
				</div> \
			</li>{{/genres.length}} \
			{{#movements.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.movement)+'</i></div> \
					<div class="col-sm-8">{{#movements}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/movements}}</div> \
				</div> \
			</li>{{/movements.length}} \
			{{#awards.length}}<li class="list-group-item"> \
				<div class="row"> \
					<div class="col-sm-4"><i>'+getLiteral(dict.awards)+'</i></div> \
					<div class="col-sm-8">{{#awards}}{{#label}}<button url="{{{uri}}}" class="btn btn-outline-secondary btn-sm m-1 modbut">{{label}}</button>{{/label}}{{/awards}}</div> \
				</div> \
			</li>{{/awards.length}} \
		</ul> \
		{{#works.length}} \
			<ul class="list-group mt-3"> \
				<li class="list-group-item list-group-item-primary"><strong>'+getLiteral(dict.authArtworks)+'</strong></li> \
				{{#workPaging}} \
				<li class="list-group-item"><!-- RESOURCE PAGINATION AND SEARCH --> \
					<div class="row"> \
						<div class="col-sm"> \
							<button id="prev_page_artworks" type="button" class="btn btn-outline-secondary" disabled> \
							  <i class="fa fa-chevron-left"></i> \
							</button> \
							<button id="next_page_artworks" type="button" class="btn btn-outline-secondary"> \
							  <i class="fa fa-chevron-right"></i> \
							</button> \
							<span id="page_artworks" class="text-nowrap ml-2">'+getLiteral(dict.page)+' 1 '+getLiteral(dict.of)+' {{numWorkPages}}</span> \
						</div> \
						<div class="input-group col-sm"> \
							<input id="page_input_artworks" class="form-control" type="number" min="1" max="{{numWorkPages}}" placeholder="'+getLiteral(dict.page)+'..." > \
							<div class="input-group-append"> \
								<button id="go_page_artworks" class="btn btn-outline-secondary" type="button" >'+getLiteral(dict.go)+'</button> \
							</div> \
						</div> \
						<div class="input-group col-sm"> \
							<input id="search_artworks" autocomplete="off" type="search" class="form-control" placeholder="'+getLiteral(dict.searchArtwork)+'..." aria-label="'+getLiteral(dict.searchArtwork)+'..."> \
						</div> \
					</div><!-- /row --> \
				</li><!-- /RESOURCE PAGINATION AND SEARCH --> \
				{{/workPaging}} \
				{{#works}}{{#label}} \
					<button uri="{{{uri}}}" tipo="Artwork" npage="{{npage}}" type="button" class="resource list-group-item list-group-item-action {{#esconder}}d-none{{/esconder}}">{{label}}</button> \
				{{/label}}{{/works}} \
			</ul> \
		{{/works.length}} \
	</div>';
	

var alertQuestionnaireTemplate = 
	'<div id="questalert" class="alert alert-light ml-3 mb-4 p-2 questalert alert-dismissible fade show" role="alert"> \
		<p class="mb-1">'+getLiteral(dict.questtext)+'</p> \
		<button id="questbotno" type="button" class="btn btn-outline-secondary btn-sm">'+getLiteral(dict.no)+'</button>\
		<button id="questbotlater" type="button" class="btn btn-outline-secondary btn-sm">'+getLiteral(dict.later)+'</button>\
		<button id="questbotyes" type="button" questurl="'+getLiteral(dict.questurl)+'" class="btn btn-outline-secondary btn-sm">'+getLiteral(dict.yes)+'</button>\
	</div>';
