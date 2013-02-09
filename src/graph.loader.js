
/**
 * @constructor
 */
GraphLoader = function(config) {
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0) return;
	
	this['config'] = config;
	this['constellation'] = null;
	this['parser'] = null;
};
window["GraphLoader"] = GraphLoader;

GraphLoader.prototype.getConstellation = function() {
	return this['constellation'];
};
GraphLoader.prototype["getConstellation"] = GraphLoader.prototype.getConstellation;

GraphLoader.prototype.setConstellation = function(constellation) {
	this['constellation'] = constellation;
};
GraphLoader.prototype["setConstellation"] = GraphLoader.prototype.setConstellation;

GraphLoader.prototype.getParser = function() {
	return this['parser'];
};
GraphLoader.prototype["getParser"] = GraphLoader.prototype.getParser;

GraphLoader.prototype.setParser = function(parser) {
	this['parser'] = parser;
};
GraphLoader.prototype["setParser"] = GraphLoader.prototype.setParser;

/**
 * Loads a static graph in a single request.
 * @param {Object} config
 * @constructor
 */
SimpleGraphLoader = function(config) {
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0) return;
	
	GraphLoader.call(this, config);
};
window["SimpleGraphLoader"] = SimpleGraphLoader;

SimpleGraphLoader.prototype = new GraphLoader();
SimpleGraphLoader.prototype.constructor = SimpleGraphLoader;

SimpleGraphLoader.prototype.setConstellation = function(constellation) {
	if (this['constellation']) {
		// FIXME: This is unbinding *all* nodeselect listeners. Need to just unbind our listener.
		jQuery(this['constellation']).unbind('initialized');
	}
	
	GraphLoader.prototype.setConstellation.call(this, constellation);

	if (this['constellation']) {
		jQuery(this['constellation']).bind('initialized', {context:this}, function(event) {
			var graphLoader = event.data.context;
			if (graphLoader['config']['url']) {
				graphLoader.load(graphLoader['config']['url']);
			}
		});
	}
};
SimpleGraphLoader.prototype["setConstellation"] = SimpleGraphLoader.prototype.setConstellation;

SimpleGraphLoader.prototype.load = function(url) {
	if (!this['parser']) {
		throw "Graph loading halted. No parser has been set.";
	}
	
	jQuery.ajax({
		'url': url,
		'context': this,
		'success': function(data){
			this['parser']['parse'](data);
		}
	});
};
SimpleGraphLoader.prototype['load'] = SimpleGraphLoader.prototype.load;

/**
 * Dynamic graph loader which retrieves graph data in trees.
 * When the selected node changes, a tree rooted at that node
 * is loaded from the server.
 * @param {Object} config
 * @constructor
 */
TreeGraphLoader = function(config) {
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0) return;
	
	GraphLoader.call(this, config);
};
window["TreeGraphLoader"] = TreeGraphLoader;

TreeGraphLoader.prototype = new GraphLoader();
TreeGraphLoader.prototype.constructor = TreeGraphLoader;

TreeGraphLoader.prototype.setConstellation = function(constellation) {
	GraphLoader.prototype.setConstellation.call(this, constellation);
	
	// When the selected node changes, load more of the graph.
	jQuery(this['constellation']).bind('nodeselected', function(event, node) {
		// FIXME: Implement TreeGraphLoader.
	});
};

// FIXME: Implement TreeGraphLoader.
