

/**
 * Instantiates a Constellation data visualization with the given configuration.
 * @param {Object} config
 * @constructor
 */
Constellation = function(config, styles){
	// Extend the default configuration.
	this['config'] = jQuery.extend(true, this.defaultConfig, config);
	
	// Extend the default styles.
	this.styles = styles ? this.defaultStyles.concat(styles) : this.defaultStyles;
	
	this.nodes = [];
	this.edges = [];
	
	// The jQuery SVG wrapper.
	this['svg'] = null;
	
	/** @type {GraphLoader} */
	this.graphLoader;
	
	/** @type {GraphParser} */
	this.graphParser;
	
	/** @type {GraphView} */
	this.graphView;
	
	/** @type {Layout} */
	this.layout;
	
	// The dimensions of the viewport.
	this.viewportWidth = 0;
	this.viewportHeight = 0;
	
	// The offset between the world origin and the container's center.
	this.scrollOffsetX = 0;
	this.scrollOffsetY = 0;
	
	// The mouse position in viewport coordinates.
	this.mouseX = null;
	this.mouseY = null;
	
	// The zoom scale factor.
	this.zoomScale = 1;
	
	// The rotation angle in radians.
	this.rotation = 0;
	
	// Metadata objects about all touch events. Keys are touch identifiers as strings, e.g., "_12345678"
	this.touchMetadata = {};
	
	// Metadata objects about the last two touch events that hit the container.
	this.containerTouchMetadata0 = null;
	this.containerTouchMetadata1 = null;
	
	this.selectedNodeId = null;
	this.selectedEdgeId = null;
};
window['Constellation'] = Constellation;

Constellation.lookup = {};

Constellation.prototype.init = function(){
	this.debug('Initializing Constellation.');
	if (!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
		throw "Failed to initialize Constellation. SVG not supported.";
	}
	
	var containerId = '#' + this['config']['id'];
	var placeholder = jQuery(containerId);
	if (placeholder.length <= 0) {
		throw "Failed to initialize Constellation. Container does not exist. id=" + containerId;
	}
	
	placeholder.html('<div style="position:relative;width:100%;height:100%">' +
	'<div class="container" style="overflow:hidden;position:absolute;width:100%;height:100%;z-index:2"></div>' +
	'<div class="background" style="position:absolute;width:100%;height:100%;z-index:1"></div>' +
	'</div>');
	this.container = placeholder.find('div.container');
	
	this.container.svg({
		'onLoad': function(constellation){
			return function(svg){
				constellation['svg'] = svg;
				constellation.svgLoadHandler();
			};
		}(this)
	});
	
	this.initZoomControls();
	
	this.setModel(new Graph());
	
	var graphLoaderClass = this['config']['graphLoaderClass'];
	this.setGraphLoader(graphLoaderClass ? new graphLoaderClass(this['config']['graphLoader']) : null);

	var graphParserClass = this['config']['graphParserClass'];
	this.setGraphParser(graphParserClass ? new graphParserClass(this['config']['graphParser']) : null);

	var graphViewClass = this['config']['graphViewClass'];
	this.setGraphView(graphViewClass ? new graphViewClass(this['config']['graphView']) : null);

	var layoutClass = this['config']['layoutClass'];
	this.setLayout(layoutClass ? new layoutClass(this['config']['layout']) : null);
	
	// Add listeners and make sure the call context
	// is the Constellation Canvas instance.
	if ('createTouch' in document) {
		// Touch events are supported.
		this.container.bind('touchstart', {'context': this}, function(event){
			event.data.context.touchstartHandler(event);
		}).bind('touchmove', {'context': this}, function(event){
			event.data.context.touchmoveHandler(event);
		}).bind('touchend', {'context': this}, function(event){
			event.data.context.touchendHandler(event);
		}).bind('touchcancel', {'context': this}, function(event){
			event.data.context.touchcancelHandler(event);
		});
	}
	else {
		// Use mouse events.
		jQuery(document).mousemove({'context': this}, function(event){
			event.data.context.mousemoveHandler(event);
		}).mouseup({'context': this}, function(event){
			event.data.context.mouseupHandler(event);
		});
		
		this.container.find('svg')
			.mousedown({'context': this}, function(event){
				event.data.context.mousedownHandler(event);
			})
			.click({'context': this}, function(event){
				event.data.context.clickHandler(event);
			});
		
		// Uses the jQuery Mousewheel Plugin
		// @see https://github.com/danielgm/jquery-mousewheel
		jQuery(this.canvas).mousewheel({'context': this}, function(event, delta){
			event.data.context.mousewheelHandler(event, delta);
		});
	}
	
	this.refreshViewportSize();
	
	jQuery(this).trigger('initialized');
};
Constellation.prototype['init'] = Constellation.prototype.init;

Constellation.prototype.initZoomControls = function(){
	var p = this['config']['zoomSlider'];

	if (!this.container.button || !this.container.slider) {
		this.warn('Missing jQuery UI so skipping zoom controls initialization.');
		this.setZoomScale(p.value);
		return;
	}

	this.container.append('<div class="zoomControls">' +
	//'<button class="zoomToFitButton">Zoom to fit</button>' +
	'<button class="zoomInButton">Zoom in</button>' +
	'<div class="zoomSlider"></div>' +
	'<button class="zoomOutButton">Zoom out</button>' +
	'</div>');
	
	var id = this['config']['id'];
	
	// FIXME: Put this in an external stylesheet.
	jQuery('head').append('<style type="text/css">' +
	'#' + id + ' .zoomControls { position: absolute; right: 20px; top: 20px; width: 20px; z-index: 1 } ' +
	'#' + id + ' .zoomControls .ui-button { height: 20px; margin: 1px 0; width: 20px } ' +
	'#' + id + ' .zoomSlider { left: 3px; height: 225px; margin: 11px 0 } ' +
	'</style>');
	
	/*
	jQuery('#' + id + ' .zoomToFitButton').button({
		'icons': {
			'primary': 'ui-icon-arrow-4-diag'
		},
		'text': false
	}).bind('click', {
		'context': this
	}, function(event, ui){
		event.data.context.zoomToFit();
	});
	*/
	jQuery('#' + id + ' .zoomInButton').button({
		'icons': {
			'primary': 'ui-icon-plus'
		},
		'text': false
	}).bind('click', {
		'context': this
	}, function(event, ui){
		var constellation = event.data.context;
		constellation.setZoomScale(Math.min(p.max, constellation.getZoomScale() + p.step));
	});
	jQuery('#' + id + ' .zoomOutButton').button({
		'icons': {
			'primary': 'ui-icon-minus'
		},
		'text': false
	}).bind('click', {
		'context': this
	}, function(event, ui){
		var constellation = event.data.context;
		constellation.setZoomScale(Math.max(p.min, constellation.getZoomScale() - p.step));
	});
	jQuery('#' + id + ' .zoomSlider').slider(p).bind('slide', {
		'context': this
	}, function(event, ui){
		event.data.context.setZoomScale(ui.value);
	});

	switch (p['display']) {
		case 'on':
		case 'yes':
		case 'true':
		case true:
		case 1:
			break;

		case 'auto':
			if ('createTouch' in document) {
				jQuery('#' + id + ' .zoomControls').hide();
			}
			break;

		default:
			jQuery('#' + id + ' .zoomControls').hide();
	}
	
	// Set initial zoom scale.
	this.setZoomScale(p.value);
};
Constellation.prototype['initZoomControls'] = Constellation.prototype.initZoomControls;

Constellation.prototype.svgLoadHandler = function(){
	this.debug('SVG initialized');
	this.refreshViewportSize();
	
	this.zuiContainer = this['svg'].group();
	this.edgeContainer = this['svg'].group(this.zuiContainer);
	this.nodeContainer = this['svg'].group(this.zuiContainer);
	
	this.refreshZui();
};

/**
 * Default configuration values.
 */
Constellation.prototype.defaultConfig = {
	'id': 'constellation',
	'graphLoaderClass': SimpleGraphLoader,
	'graphLoader': {
	},
	'graphParserClass': JsonGraphParser,
	'graphParser': {
	},
	'graphViewClass': DirectGraphView,
	'graphView': {
	},
	'layoutClass': RoamerLayout,
	'layout': {
	},
	'zoomSlider': {
		'display': 'auto',
		'orientation': 'vertical',
		'min': 0.2,
		'max': 2,
		'value': 1,
		'step': 0.05
	}
};

Constellation.prototype.defaultStyles = [
	['node', {
		'rendererClass': DefaultNodeRenderer
	}],
	['edge', {
		'rendererClass': DefaultEdgeRenderer
	}]
];

/// Accessors

Constellation.prototype.getModel = function() {
	return this.model;
};
Constellation.prototype['getModel'] = Constellation.prototype.getModel;

Constellation.prototype.setModel = function(model) {
	this.debug('Set model:', model);
	
	this.model = model;
	if (this.graphParser) {
		this.graphParser['setGraph'](this.model);
	}
	if (this.graphView) {
		this.graphView['setSource'](this.model);
	}
	this.modelChanged();
};
Constellation.prototype['setModel'] = Constellation.prototype.setModel;

Constellation.prototype.getGraphView = function() {
	return this.graphView;
};
Constellation.prototype['getGraphView'] = Constellation.prototype.getGraphView;

/**
 * 
 * @param {GraphView} graphView
 */
Constellation.prototype.setGraphView = function(graphView) {
	this.debug('Set graph view:', graphView);
	
	if (this.graphView) {
		this.graphView['setConstellation'](null);
		this.graphView['setSource'](null);
		this.graphView['setResult'](null);
		jQuery(this.graphView).unbind('change');
	}
	
	this.graphView = graphView;
	
	if (this.graphView) {
		this.graphView['setConstellation'](this);
		this.graphView['setSource'](this.model);
		this.graphView['setResult'](this);
		
		jQuery(this.graphView).bind('change', {'context': this}, function(event){
			event.data.context.viewChanged();
		});
	}
};
Constellation.prototype['setGraphView'] = Constellation.prototype.setGraphView;

Constellation.prototype.getGraphLoader = function() {
	return this.graphLoader;
};
Constellation.prototype['getGraphLoader'] = Constellation.prototype.getGraphLoader;

/**
 * 
 * @param {GraphLoader} graphLoader
 */
Constellation.prototype.setGraphLoader = function(graphLoader) {
	this.debug('Set graph loader:', graphLoader);
	
	if (this.graphLoader) {
		this.graphLoader['setConstellation'](null);
		this.graphLoader['setParser'](null);
	}
	
	this.graphLoader = graphLoader;
	
	if (this.graphLoader) {
		this.graphLoader['setConstellation'](this);
		this.graphLoader['setParser'](this.graphParser);
	}
};
Constellation.prototype['setGraphLoader'] = Constellation.prototype.setGraphLoader;

Constellation.prototype.getGraphParser = function() {
	return this.graphParser;
};
Constellation.prototype['getGraphParser'] = Constellation.prototype.getGraphParser;

Constellation.prototype.setGraphParser = function(graphParser) {
	this.debug('Set graph parser:', graphParser);
	
	if (this.graphParser) {
		if (this.graphLoader) {
			this.graphLoader['setParser'](null);
		}
		this.graphParser['setGraph'](null);
		
		jQuery(this.graphParser).unbind('complete');
	}
	
	this.graphParser = graphParser;
	
	if (this.graphParser) {
		if (this.graphLoader) {
			this.graphLoader['setParser'](this.graphParser);
		}
		this.graphParser['setGraph'](this.model);
		
		jQuery(this.graphParser).bind('complete', {'context': this}, function(event) {
			event.data.context.modelChanged();
		});
	}
};
Constellation.prototype['setGraphParser'] = Constellation.prototype.setGraphParser;

Constellation.prototype.getLayout = function() {
	return this.layout;
};
Constellation.prototype['getLayout'] = Constellation.prototype.getLayout;

Constellation.prototype.setLayout = function(layout) {
	this.debug('Set layout:', layout);
	
	if (this.layout) {
		this.layout['setConstellation'](null);

		jQuery(this.layout).unbind('change');
	}
	
	this.layout = layout;
	
	if (this.layout) {
		this.layout['setConstellation'](this);
		
		jQuery(this.layout).bind('change', {'context': this}, function(event){
			event.data.context.layoutChanged();
		});
	}
};
Constellation.prototype['setLayout'] = Constellation.prototype.setLayout;

Constellation.prototype.getNodeContainer = function() {
	return this.nodeContainer;
};
Constellation.prototype['getNodeContainer'] = Constellation.prototype.getNodeContainer;

Constellation.prototype.getEdgeContainer = function() {
	return this.edgeContainer;
};
Constellation.prototype['getEdgeContainer'] = Constellation.prototype.getEdgeContainer;

Constellation.prototype.getSelectedNodeId = function(){
	return this.selectedNodeId;
};
Constellation.prototype['getSelectedNodeId'] = Constellation.prototype.getSelectedNodeId;

Constellation.prototype.setSelectedNodeId = function(v){
	this.debug('Set selected node ID:', v);
	
	if (this.selectedEdgeId) {
		this.selectedEdgeId = null;
		jQuery(this).trigger('edgeselect');
	}
	
	if (this.selectedNodeId == v) 
		return;
	this.selectedNodeId = v;
	jQuery(this).trigger('nodeselect', this.selectedNodeId);
};
Constellation.prototype['setSelectedNodeId'] = Constellation.prototype.setSelectedNodeId;

Constellation.prototype.getSelectedEdgeId = function(){
	return this.selectedEdgeId;
};
Constellation.prototype['getSelectedEdgeId'] = Constellation.prototype.getSelectedEdgeId;

Constellation.prototype.setSelectedEdgeId = function(v){
	if (this.selectedNodeId) {
		this.selectedNodeId = null;
		jQuery(this).trigger('nodeselect');
	}
	
	if (this.selectedEdgeId == v) 
		return;
	this.selectedEdgeId = v;
	jQuery(this).trigger('edgeselect', this.selectedEdgeId);
};
Constellation.prototype['setSelectedEdgeId'] = Constellation.prototype.setSelectedEdgeId;

Constellation.prototype.getRendererBounds = function(){
	return this.nodeContainer.getBBox();
};
Constellation.prototype["getRendererBounds"] = Constellation.prototype.getRendererBounds;

// Data Manipulation

Constellation.prototype.addNode = function(nodeId, data){
	this.debug('Add node:', nodeId);
	
	if (this.getNode(nodeId)) {
		throw "Failed to add node. Node already exists. id=" + nodeId;
	}

	var rendererClass = this.getStyle('node', data && data['class'] ? data['class'].split(/\s/) : [],
			'rendererClass', data, {'rendererClass': DefaultNodeRenderer});
	
	var node = new rendererClass(this, nodeId, data);
	node['create']();
	node['draw']();
	this.nodes.push(node);
	
	jQuery(this).trigger('nodeAdded', node);
	
	return node;
};
Constellation.prototype['addNode'] = Constellation.prototype.addNode;

Constellation.prototype.getNode = function(nodeId){
	// FIXME: Optimize for retrieval.
	for (var i = 0; i < this.nodes.length; i++) {
		if (this.nodes[i]['id'] == nodeId) {
			return this.nodes[i];
		}
	}
	return null;
};
Constellation.prototype['getNode'] = Constellation.prototype.getNode;

Constellation.prototype.getNodes = function(){
	return this.nodes.concat();
};
Constellation.prototype['getNodes'] = Constellation.prototype.getNodes;

Constellation.prototype.getNodeIds = function(){
	return this.nodes.map(function(item, index, array){
		return item['id'];
	});
};
Constellation.prototype['getNodeIds'] = Constellation.prototype.getNodeIds;

Constellation.prototype.getNodeLength = function(){
	return this.nodes.length;
};
Constellation.prototype['getNodeLength'] = Constellation.prototype.getNodeLength;

Constellation.prototype.removeNode = function(nodeId){
	this.debug('Remove node:', nodeId);
	
	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		if (node['id'] == nodeId) {
			node['destroy'](node);
			this.nodes.splice(i, 1);
			
			jQuery(this).trigger('nodeRemoved', node);
			
			return;
		}
	}
	throw "Failed to remove node. Node does not exist. id=" + nodeId;
};
Constellation.prototype['removeNode'] = Constellation.prototype.removeNode;

Constellation.prototype.updateNode = function(nodeId, data) {
	var node = this.getNode(nodeId);
	if (node) {
		node['data'] = data;
	}
	else {
		throw "Failed to update node. Node does not exist. id=" + nodeId;
	}
	return node;
};
Constellation.prototype['updateNode'] = Constellation.prototype.updateNode;

Constellation.prototype.upsertNode = function(nodeId, data, doExtend, deepExtend) {
	doExtend = arguments.length > 2 ? doExtend : false;
	deepExtend = arguments.length > 3 ? deepExtend : false;
	
	var node = this.getNode(nodeId);
	if (node) {
		if (doExtend) {
			node['data'] = jQuery.extend(deepExtend, node['data'], data);
		}
		else {
			node['data'] = data;
		}
	}
	else {
		node = this.addNode(nodeId, data);
	}
	return node;
};
Constellation.prototype['upsertNode'] = Constellation.prototype.upsertNode;

Constellation.prototype.addEdge = function(edgeId, tailNodeId, headNodeId, data){
	this.debug('Add edge:', edgeId);
	
	if (this.getEdge(edgeId)) {
		throw "Failed to add edge. Edge already exists. id=" + edgeId;
	}
	
	var tailNode = this.getNode(tailNodeId);
	if (!tailNode) {
		throw "Failed to add edge. Tail node does not exist. id=" + tailNodeId;
	}
	
	var headNode = this.getNode(headNodeId);
	if (!headNode) {
		throw "Failed to add edge. Head node does not exist. id=" + headNodeId;
	}

	var rendererClass = this.getStyle('edge', data && data['class'] ? data['class'].split(/\s/) : [],
			'rendererClass', data, {'rendererClass': DefaultNodeRenderer});
	
	var edge = new rendererClass(this, edgeId, tailNode, headNode, data);
	edge['create']();
	edge['draw']();
	this.edges.push(edge);
	
	tailNode['edges'].push(edge);
	headNode['edges'].push(edge);
	
	jQuery(this).trigger('edgeAdded', edge);
	
	return edge;
};
Constellation.prototype['addEdge'] = Constellation.prototype.addEdge;

Constellation.prototype.getEdge = function(edgeId){
	// FIXME: Optimize for retrieval.
	for (var i = 0; i < this.edges.length; i++) {
		if (this.edges[i]['id'] == edgeId) {
			return this.edges[i];
		}
	}
	return null;
};
Constellation.prototype['getEdge'] = Constellation.prototype.getEdge;

Constellation.prototype.getEdgeIds = function(){
	return this.edges.map(function(item, index, array){
		return item['id'];
	});
};
Constellation.prototype['getEdgeIds'] = Constellation.prototype.getEdgeIds;

Constellation.prototype.getEdges = function(){
	return this.edges.concat();
};
Constellation.prototype['getEdges'] = Constellation.prototype.getEdges;

Constellation.prototype.getEdgeLength = function(){
	return this.edges.length;
};
Constellation.prototype['getEdgeLength'] = Constellation.prototype.getEdgeLength;

Constellation.prototype.removeEdge = function(edgeId){
	this.debug('Remove edge:', edgeId);
	
	var i, edge = null;
	
	// Remove the edge from the graph's list of edges.
	for (i = 0; i < this.edges.length; i++) {
		if (this.edges[i]['id'] == edgeId) {
			edge = this.edges[i];
			edge['destroy']();
			this.edges.splice(i, 1);
			break;
		}
	}
	
	if (edge) {
		// Remove the edge from the tail node's edge references.
		for (i = 0; i < edge['tailNode']['edges'].length; i++) {
			if (edge['tailNode']['edges'][i]['id'] == edgeId) {
				edge['tailNode']['edges'].splice(i, 1);
				break;
			}
		}
		
		// Remove the edge from the head node's edge references.
		for (i = 0; i < edge['headNode']['edges'].length; i++) {
			if (edge['headNode']['edges'][i]['id'] == edgeId) {
				edge['headNode']['edges'].splice(i, 1);
				break;
			}
		}
		
		jQuery(this).trigger('edgeRemoved', edge);
	}
	else {
		throw "Failed to remove edge. Edge does not exist. id=" + edgeId;
	}
};
Constellation.prototype['removeEdge'] = Constellation.prototype.removeEdge;

Constellation.prototype.updateEdge = function(edgeId, data) {
	var edge = this.getEdge(edgeId);
	if (edge) {
		edge['data'] = data;
	}
	else {
		throw "Failed to update edge. Edge does not exist. id=" + edgeId;
	}
	return edge;
};
Constellation.prototype['updateEdge'] = Constellation.prototype.updateEdge;

Constellation.prototype.upsertEdge = function(edgeId, tailNodeId, headNodeId, data, doExtend, deepExtend) {
	doExtend = arguments.length > 4 ? doExtend : false;
	deepExtend = arguments.length > 5 ? deepExtend : false;
	
	var edge = this.getEdge(edgeId);
	if (edge) {
		if (doExtend) {
			edge['data'] = jQuery.extend(deepExtend, edge['data'], data);
		}
		else {
			edge['data'] = data;
		}
	}
	else {
		edge = this.addEdge(edgeId, tailNodeId, headNodeId, data);
	}
	return edge;
};
Constellation.prototype['upsertEdge'] = Constellation.prototype.upsertEdge;

/// Data Chain

/**
 * Called by the GraphLoader instance when the model changes.
 */
Constellation.prototype.modelChanged = function(){
	this.debug('Model changed');
	
	if (this.graphView) {
		this.graphView.sourceChanged();
	}

		jQuery(this).trigger('modelchanged');
};
Constellation.prototype['modelChanged'] = Constellation.prototype.modelChanged;

/**
 * Called by the GraphView instance when the view changes.
 */
Constellation.prototype.viewChanged = function(){
	this.debug('View changed');
	
	if (this.layout) {
		this.layout.viewChanged();
	}

		jQuery(this).trigger('viewchanged');
};
Constellation.prototype['viewChanged'] = Constellation.prototype.viewChanged;

/**
 * Called by the Layout instance when the layout changes.
 */
Constellation.prototype.layoutChanged = function() {
	this.draw();
};
Constellation.prototype['layoutChanged'] = Constellation.prototype.layoutChanged;

Constellation.prototype.draw = function(){
	var i;
	
	this.refreshViewportSize();
	
	var nodes = this.nodes;
	for (i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		node['position']();
	}
	
	var edges = this.edges;
	for (i = 0; i < edges.length; i++) {
		var edge = edges[i];
		edge['draw']();
	}
};

// Transformations

Constellation.prototype.refreshViewportSize = function(){
	this.viewportWidth = this.container.width();
	this.viewportHeight = this.container.height();
	this.refreshZui();
};

Constellation.prototype.refreshZui = function(){
	if (this.container.button && this.container.slider) {
		var id = this['config']['id'];
		jQuery('#' + id + ' .zoomSlider').slider('option', 'value', this.zoomScale);
	}

	jQuery(this.zuiContainer).attr('transform',
			'translate(' + (this.viewportWidth / 2 - this.scrollOffsetX) + ',' +
				(this.viewportHeight / 2 - this.scrollOffsetY) + ')' +
			'scale(' + this.zoomScale + ',' + this.zoomScale + ')' +
			'rotate(' + (this.rotation * 180.0/Math.PI) + ')');
};

Constellation.prototype.getZoomScale = function(){
	return this.zoomScale;
};
Constellation.prototype['getZoomScale'] = Constellation.prototype.getZoomScale;

Constellation.prototype.setZoomScale = function(zoomScale){
	this.zoomScale = zoomScale;
	this.refreshZui();
};
Constellation.prototype['setZoomScale'] = Constellation.prototype.setZoomScale;

Constellation.prototype.viewportToWorldX = function(x, y){
	var x0 = (x - this.viewportWidth/2 + this.scrollOffsetX) / this.zoomScale;
	var y0 = (y - this.viewportHeight/2 + this.scrollOffsetY) / this.zoomScale;
	return x0 * Math.cos(-this.rotation) - y0 * Math.sin(-this.rotation);
};
Constellation.prototype['viewportToWorldX'] = Constellation.prototype.viewportToWorldX;

Constellation.prototype.viewportToWorldY = function(x, y){
	var x0 = (x - this.viewportWidth/2 + this.scrollOffsetX) / this.zoomScale;
	var y0 = (y - this.viewportHeight/2 + this.scrollOffsetY) / this.zoomScale;
	return x0 * Math.sin(-this.rotation) + y0 * Math.cos(-this.rotation);
};
Constellation.prototype['viewportToWorldY'] = Constellation.prototype.viewportToWorldY;

Constellation.prototype.worldToViewportX = function(x, y){
	return (x * Math.cos(this.rotation) - y * Math.sin(this.rotation)) * this.zoomScale
		+ this.viewportWidth/2 - this.scrollOffsetX;
};
Constellation.prototype['worldToViewportX'] = Constellation.prototype.worldToViewportX;

Constellation.prototype.worldToViewportY = function(x, y){
	return (x * Math.sin(this.rotation) + y * Math.cos(this.rotation)) * this.zoomScale
		+ this.viewportHeight/2 - this.scrollOffsetY;
};
Constellation.prototype['worldToViewportY'] = Constellation.prototype.worldToViewportY;

Constellation.prototype.pageToViewportX = function(x, y){
	return x - this.container.offset().left;
};
Constellation.prototype['pageToViewportX'] = Constellation.prototype.pageToViewportX;

Constellation.prototype.pageToViewportY = function(x, y){
	return y - this.container.offset().top;
};
Constellation.prototype['pageToViewportY'] = Constellation.prototype.pageToViewportY;

// Renderer event callbacks

Constellation.prototype.nodemouseoverHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	this.arrangeNodeFront(node);

	jQuery(this).trigger('nodemouseover', node['id']);
};
Constellation.prototype['nodemouseoverHandler'] = Constellation.prototype.nodemouseoverHandler;
Constellation.prototype.nodemouseoutHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	jQuery(this).trigger('nodemouseout', node['id']);
};
Constellation.prototype['nodemouseoutHandler'] = Constellation.prototype.nodemouseoutHandler;
Constellation.prototype.nodemousedownHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	this.arrangeNodeFront(node);

	var touchMetadata = this.touchMetadata['_mouse'] = {
		isTouch: false,
		node: node,
		touch: event,
		pageX: event.pageX,
		pageY: event.pageY,
		timestamp: (new Date()).getTime()
	};
	
	var viewportX = this.pageToViewportX(event.pageX, event.pageY);
	var viewportY = this.pageToViewportY(event.pageX, event.pageY);
	
	// The distance from the touch to the center of the node which was touched.
	touchMetadata.nodeOffsetX = this.viewportToWorldX(viewportX, viewportY) - node['x'];
	touchMetadata.nodeOffsetY = this.viewportToWorldY(viewportX, viewportY) - node['y'];
	
	jQuery(this).trigger('nodemousedown', node['id']);
};
Constellation.prototype['nodemousedownHandler'] = Constellation.prototype.nodemousedownHandler;
Constellation.prototype.nodemouseupHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	jQuery(this).trigger('nodemouseup', node['id']);
};
Constellation.prototype['nodemouseupHandler'] = Constellation.prototype.nodemouseupHandler;
Constellation.prototype.nodeclickHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	var touchMetadata = this.touchMetadata['_mouse'];
	if (touchMetadata && this.isClick(event, touchMetadata)) {
		jQuery(this).trigger('nodeclick', node['id']);
	}

	delete this.touchMetadata['_mouse'];
};
Constellation.prototype['nodeclickHandler'] = Constellation.prototype.nodeclickHandler;
Constellation.prototype.nodetouchstartHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	this.arrangeNodeFront(node);

	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		var touchX = this.pageToViewportX(touch.pageX, touch.pageY);
		var touchY = this.pageToViewportY(touch.pageX, touch.pageY);
		
		// Make sure each touch has a metadata object associated with it.
		var touchMetadata = this.touchMetadata['_' + touch['identifier']] = {
			isTouch: true,
			node: node,
			nodeOffsetX: touchX - this.worldToViewportX(node['x'], node['y']),
			nodeOffsetY: touchY - this.worldToViewportY(node['x'], node['y']),
			touch: touch,
			pageX: touch.pageX,
			pageY: touch.pageY,
			timestamp: (new Date()).getTime()
		};
	}		

	jQuery(this).trigger('nodetouchstart', node['id']);
};
Constellation.prototype['nodetouchstartHandler'] = Constellation.prototype.nodetouchstartHandler;
Constellation.prototype.nodetouchendHandler = function(event, node){
	event.stopPropagation();
	event.preventDefault();

	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		var touchMetadata = this.touchMetadata['_' + touch['identifier']];

		if (touchMetadata && this.isClick(event, touchMetadata)) {
			jQuery(this).trigger('nodeclick', node['id']);
		}

		delete this.touchMetadata['_' + touch['identifier']];
	}

	jQuery(this).trigger('nodetouchend', node['id']);
};
Constellation.prototype['nodetouchendHandler'] = Constellation.prototype.nodetouchendHandler;

Constellation.prototype.edgemouseoverHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	jQuery(this).trigger('edgemouseover', edge['id']);
};
Constellation.prototype['edgemouseoverHandler'] = Constellation.prototype.edgemouseoverHandler;
Constellation.prototype.edgemouseoutHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	jQuery(this).trigger('edgemouseout', edge['id']);
};
Constellation.prototype['edgemouseoutHandler'] = Constellation.prototype.edgemouseoutHandler;
Constellation.prototype.edgemousedownHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	this.touchMetadata['_mouse'] = {
		edge: edge,
		isTouch: false,
		touch: event,
		pageX: event.pageX,
		pageY: event.pageY
	};
	
	// We don't care about edge offset because edges can't be dragged.
	//touchMetadata.edgeOffsetX = ;
	//touchMetadata.edgeOffsetY = ;
	
	jQuery(this).trigger('edgemousedown', edge['id']);
};
Constellation.prototype['edgemousedownHandler'] = Constellation.prototype.edgemousedownHandler;
Constellation.prototype.edgemouseupHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	jQuery(this).trigger('edgemouseup', edge['id']);
};
Constellation.prototype['edgemouseupHandler'] = Constellation.prototype.edgemouseupHandler;
Constellation.prototype.edgeclickHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	var touchMetadata = this.touchMetadata['_mouse'];
	if (touchMetadata && this.isClick(event, touchMetadata)) {
		jQuery(this).trigger('edgeclick', edge['id']);
	}
};
Constellation.prototype['edgeclickHandler'] = Constellation.prototype.edgeclickHandler;
Constellation.prototype.edgetouchstartHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		var touchX = this.pageToViewportX(touch.pageX, touch.pageY);
		var touchY = this.pageToViewportY(touch.pageX, touch.pageY);
		
		// Make sure each touch has a metadata object associated with it.
		var touchMetadata = this.touchMetadata['_' + touch['identifier']] = {
			edge: edge,
			// We don't care about edge offset because edges can't be dragged.
			//edgeOffsetX: ,
			//edgeOffsetY: ,
			isTouch: true,
			touch: touch,
			pageX: touch.pageX,
			pageY: touch.pageY,
			timestamp: (new Date()).getTime()
		};
	}

	jQuery(this).trigger('edgetouchstart', edge['id']);
};
Constellation.prototype['edgetouchstartHandler'] = Constellation.prototype.edgetouchstartHandler;
Constellation.prototype.edgetouchendHandler = function(event, edge){
	event.stopPropagation();
	event.preventDefault();

	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		delete this.touchMetadata['_' + touch['identifier']];
	}

	jQuery(this).trigger('edgetouchend', edge['id']);
};
Constellation.prototype['edgetouchendHandler'] = Constellation.prototype.edgetouchendHandler;

// UI Events

Constellation.prototype.mousedownHandler = function(event){
	var touchMetadata = this.touchMetadata['_mouse'] = {
		isTouch: false,
		touch: event,
		pageX: event.pageX,
		pageY: event.pageY
	};
	
	// Calculate world coordinates of the touch.
	var viewportX = this.pageToViewportX(event.pageX, event.pageY);
	var viewportY = this.pageToViewportY(event.pageX, event.pageY);
	touchMetadata.x = this.viewportToWorldX(viewportX, viewportY);
	touchMetadata.y = this.viewportToWorldY(viewportX, viewportY);
	
	// Track the first two touch events that hit the container.
	if (!this.containerTouchMetadata0) 
		this.containerTouchMetadata0 = touchMetadata;
	else if (!this.containerTouchMetadata1) 
		this.containerTouchMetadata1 = touchMetadata;
	
	jQuery(this).trigger('mousedown');
};

Constellation.prototype.mousemoveHandler = function(event){
	var touchMetadata = this.touchMetadata['_mouse'];
	
	// We need to update the touch property with the new event to capture
	// the new page coordinates. If the mouse is not down there will be no metadata.
	if (touchMetadata)
		touchMetadata.touch = event;
	
	this.mouseX = this.pageToViewportX(event.pageX, event.pageY);
	this.mouseY = this.pageToViewportY(event.pageX, event.pageY);

	this.containerDrag();
};

Constellation.prototype.mouseupHandler = function(event){
	var touchMetadata = this.touchMetadata['_mouse'];
	
	// We need to update the touch property with the new event to capture
	// the new page coordinates. If the mouse is not down there will be no metadata.
	if (touchMetadata) 
		touchMetadata.touch = event;

	if (touchMetadata && this.isClick(event, touchMetadata)) {
		jQuery(this).trigger('click');
	}
	
	this.containerDrag();
	
	delete this.touchMetadata['_mouse'];
	
	if (this.containerTouchMetadata0 == touchMetadata){
		this.containerTouchMetadata0 = this.containerTouchMetadata1;
		this.containerTouchMetadata1 = null;
	}
	if (this.containerTouchMetadata1 == touchMetadata){
		this.containerTouchMetadata1 = null;
	}

	jQuery(this).trigger('mouseup');
};

Constellation.prototype.clickHandler = function(event){
	event.stopPropagation();
	event.preventDefault();
};

Constellation.prototype.mousewheelHandler = function(event, delta){
	event.preventDefault();
	this.setZoomScale(this.getZoomScale() + delta * 0.1);
	
	// FIXME: The zoom should center around the mouse!

	jQuery(this).trigger('mousewheel');
};

Constellation.prototype.touchstartHandler = function(event){
	event.stopPropagation();
	event.preventDefault();
	
	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		var touchX = this.pageToViewportX(touch.pageX, touch.pageY);
		var touchY = this.pageToViewportY(touch.pageX, touch.pageY);
		
		// Make sure each touch has a metadata object associated with it.
		var touchMetadata = this.touchMetadata['_' + touch['identifier']] = {
			isTouch: true,
			touch: touch,
			pageX: touch.pageX,
			pageY: touch.pageY,
			timestamp: (new Date()).getTime()
		};
		
		// World coordinates of the touch.
		var viewportX = this.pageToViewportX(touch.pageX, touch.pageY);
		var viewportY = this.pageToViewportY(touch.pageX, touch.pageY);
		touchMetadata.x = this.viewportToWorldX(viewportX, viewportY);
		touchMetadata.y = this.viewportToWorldY(viewportX, viewportY);
			
		// Track the first two touch events that hit the container.
		if (!this.containerTouchMetadata0) 
			this.containerTouchMetadata0 = touchMetadata;
		else if (!this.containerTouchMetadata1) 
			this.containerTouchMetadata1 = touchMetadata;
	}

	jQuery(this).trigger('touchstart');
};

Constellation.prototype.touchmoveHandler = function(event){
	event.stopPropagation();
	event.preventDefault();

	this.containerDrag();
	
	jQuery(this).trigger('touchmove');
};

Constellation.prototype.touchendHandler = function(event){
	event.preventDefault();
	
	this.containerDrag();
	
	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		var touchMetadata = this.touchMetadata['_' + touch['identifier']];
		
		if (touchMetadata && this.isClick(event, touchMetadata)) {
			// FIXME: React to taps.
		}
	}
	
	// Delete touch metadata objects.
	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		var touchMetadata = this.touchMetadata['_' + touch['identifier']];
		delete this.touchMetadata['_' + touch['identifier']];
		
		if (this.containerTouchMetadata0 == touchMetadata) {
			this.containerTouchMetadata0 = this.containerTouchMetadata1;
			this.containerTouchMetadata1 = null;
			
			if (this.containerTouchMetadata0) {
				// Reset page coordinates at the time of the touch release.
				this.containerTouchMetadata0.pageX = this.containerTouchMetadata0.touch.pageX;
				this.containerTouchMetadata0.pageY = this.containerTouchMetadata0.touch.pageY;
				
				// Reset scroll offset at the time of the touch release.
				this.containerTouchMetadata0.scrollOffsetX = this.scrollOffsetX;
				this.containerTouchMetadata0.scrollOffsetY = this.scrollOffsetY;
				
				// Reset zoom scale at the time of the touch release.
				this.containerTouchMetadata0.zoomScale = this.zoomScale;
			}
		}
		if (this.containerTouchMetadata1 == touchMetadata) {
			this.containerTouchMetadata1 = null;
			
			if (this.containerTouchMetadata0) {
				// Reset page coordinates at the time of the touch release.
				this.containerTouchMetadata0.pageX = this.containerTouchMetadata0.touch.pageX;
				this.containerTouchMetadata0.pageY = this.containerTouchMetadata0.touch.pageY;
				
				// Reset scroll offset at the time of the touch release.
				this.containerTouchMetadata0.scrollOffsetX = this.scrollOffsetX;
				this.containerTouchMetadata0.scrollOffsetY = this.scrollOffsetY;
				
				// Reset zoom scale at the time of the touch release.
				this.containerTouchMetadata0.zoomScale = this.zoomScale;
			}
		}
	}
	
	jQuery(this).trigger('touchend');
};

Constellation.prototype.touchcancelHandler = function(event){
	event.preventDefault();
	
	// Delete touch metadata objects.
	for (var i = 0; i < event['originalEvent']['changedTouches'].length; i++) {
		var touch = event['originalEvent']['changedTouches'][i];
		delete this.touchMetadata['_' + touch['identifier']];
	}
	
	jQuery(this).trigger('touchcancel');
};

Constellation.prototype.containerDrag = function(){
	var m0 = this.containerTouchMetadata0;
	var m1 = this.containerTouchMetadata1;
	if (m0) {
		if (m1) {
			// Container is being zoomed / rotated.
			
			// The original touch vector in viewport coordinates.
			var dx0 = this.worldToViewportX(m1.x, m1.y) - this.worldToViewportX(m0.x, m0.y);
			var dy0 = this.worldToViewportY(m1.x, m1.y) - this.worldToViewportY(m0.x, m0.y);
			var d0 = Math.sqrt(dx0 * dx0 + dy0 * dy0);
			var r0 = Math.atan2(dy0, dx0);
			
			// The new touch vector in viewport coordinates.
			var t0x = this.pageToViewportX(m0.touch.pageX, m0.touch.pageY);
			var t0y = this.pageToViewportY(m0.touch.pageX, m0.touch.pageY);
			var t1x = this.pageToViewportX(m1.touch.pageX, m1.touch.pageY);
			var t1y = this.pageToViewportY(m1.touch.pageX, m1.touch.pageY);
			var dx1 = t1x - t0x;
			var dy1 = t1y - t0y;
			var d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
			var r1 = Math.atan2(dy1, dx1);
			
			var dr = r1 - r0;
			if (dr > Math.PI) 
				dr = dr - 2 * Math.PI;
			if (dr < -Math.PI) 
				dr = 2 * Math.PI + dr;

			this.zoomScale = this.zoomScale * d1 / d0;
			this.rotation = this.rotation + dr;
			this.scrollOffsetX = this.scrollOffsetX +
			this.worldToViewportX(m0.x, m0.y) -
			this.pageToViewportX(m0.touch.pageX, m0.touch.pageY);
			this.scrollOffsetY = this.scrollOffsetY +
			this.worldToViewportY(m0.x, m0.y) -
			this.pageToViewportY(m0.touch.pageX, m0.touch.pageY);

			if (dr != 0) {
				// Have to redraw the nodes to update their rotation.
				this.draw();
			}
		}
		else {
			// Container is being drag-panned.
			this.scrollOffsetX = this.scrollOffsetX +
			this.worldToViewportX(m0.x, m0.y) -
			this.pageToViewportX(m0.touch.pageX, m0.touch.pageY);
			this.scrollOffsetY = this.scrollOffsetY +
			this.worldToViewportY(m0.x, m0.y) -
			this.pageToViewportY(m0.touch.pageX, m0.touch.pageY);
		}
		
		this.refreshZui();
	}
};

/// Styles

Constellation.prototype.getStyle = function(itemType, itemClasses, propertyName, itemData, defaults){
	// FIXME: Optimize style retrieval.
	
	var i, j;
	var styleTuple;
	
	// If the item has the property defined, return that.
	if (itemData && itemData[propertyName] !== undefined)
	{
		return itemData[propertyName];
	}
	
	// If the item has a style class we need to do a full search.
	if (itemClasses && itemClasses.length > 0)
	{
		for (i = this.styles.length; i > 0; i--)
		{
			styleTuple = this.styles[i-1];
			
			var selector = styleTuple[0];
			var dotIndex = jQuery.inArray('.', selector);
			
			var selectorType = dotIndex < 0 ? selector : selector.substr(0, dotIndex);
			if (selectorType != '' && selectorType != itemType) continue;
			
			var selectorClasses = dotIndex < 0 ? [] : selector.substr(dotIndex + 1).split('.');
			
			var matchesAllSelectorClasses = true;
			for (j = 0; j < selectorClasses.length; j++)
			{
				if (jQuery.inArray(selectorClasses[j], itemClasses) < 0)
				{
					matchesAllSelectorClasses = false;
					break;
				}
			}
			
			if (!matchesAllSelectorClasses) continue;

			// We have a matching style selector.
			if (styleTuple[1][propertyName] !== undefined)
			{
				// We have a matching style entry.
				return styleTuple[1][propertyName];
			}
		}
	}
	
	// Item had no style classes or no matching style tuple.
	for (i = this.styles.length; i > 0; i--)
	{
		styleTuple = this.styles[i-1];
		if (styleTuple && styleTuple.length > 1
			&& styleTuple[0] == itemType)
		{
			// We have a matching style selector.
			if (styleTuple[1][propertyName] !== undefined)
			{
				// We have a matching style entry.
				return styleTuple[1][propertyName];
			}
		}
	}
	
	return defaults ? defaults[propertyName] : undefined;
};
Constellation.prototype['getStyle'] = Constellation.prototype.getStyle;

/// Misc

Constellation.prototype.arrangeNodeFront = function(node) {
	var topNodeSvg = jQuery(this.nodeContainer).children().last()[0];
	if (topNodeSvg != node.renderer.group) {
		jQuery(node.renderer.group).insertAfter(jQuery(this.nodeContainer).children().last());
	}
};

/**
 * Tests whether the given event should be considered a click based on
 * information from the originating touchMetadata object.
 */
Constellation.prototype.isClick = function(event, touchMetadata) {
	var dx = event.pageX - touchMetadata.pageX;
	var dy = event.pageY - touchMetadata.pageY;
	return Math.sqrt(dx * dx + dy * dy) < 5;
	//return (new Date()).getTime() - touchMetadata.timestamp <= 300;
};

Constellation.prototype.debug = function(message) {
	jQuery(this).trigger('log', ['debug'].concat(Array.prototype.slice.call(arguments)));
};
Constellation.prototype['debug'] = Constellation.prototype.debug;

Constellation.prototype.warn = function(message) {
	jQuery(this).trigger('log', ['warn'].concat(Array.prototype.slice.call(arguments)));
};
Constellation.prototype['warn'] = Constellation.prototype.warn;

Constellation.prototype.error = function(message) {
	jQuery(this).trigger('log', ['error'].concat(Array.prototype.slice.call(arguments)));
};
Constellation.prototype['error'] = Constellation.prototype.error;
