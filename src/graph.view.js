

/**
 * Calculates a new result graph from the given source graph.
 * @param {Object} config Configuration parameters.
 * @constructor
 */
GraphView = function(config){
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0) return;
	
	this['config'] = config;
	this['constellation'] = null;
	
	this['source'] = null;
	this['result'] = null;

	this.valid = true;
};
window["GraphView"] = GraphView;

GraphView.prototype.getConstellation = function(){
	return this['constellation'];
};
GraphView.prototype["getConstellation"] = GraphView.prototype.getConstellation;

GraphView.prototype.setConstellation = function(constellation){
	this['constellation'] = constellation;
	this.invalidate();
};
GraphView.prototype["setConstellation"] = GraphView.prototype.setConstellation;

GraphView.prototype.getSource = function(){
	return this['source'];
};
GraphView.prototype["getSource"] = GraphView.prototype.getSource;

GraphView.prototype.setSource = function(source){
	this['source'] = source;
	this.invalidate();
};
GraphView.prototype["setSource"] = GraphView.prototype.setSource;

/**
 * Call this method when the contents of the source graph change.
 * This method invalidates the view so it can be recalculated.
 */
GraphView.prototype.sourceChanged = function(){
	this.invalidate();
};
GraphView.prototype["sourceChanged"] = GraphView.prototype.sourceChanged;

/**
 * Fetches the output of this graph view.
 */
GraphView.prototype.getResult = function(){
	return this['result'];
};
GraphView.prototype["getResult"] = GraphView.prototype.getResult;

/**
 * Sets the output of this graph view.
 */
GraphView.prototype.setResult = function(result){
	this['result'] = result;
	this.invalidate();
};
GraphView.prototype["setResult"] = GraphView.prototype.setResult;

/**
 * Invalidates the graph view, scheduling it for a refresh.
 */
GraphView.prototype.invalidate = function(){
	if (!this.valid) return;
	this.valid = false;
	
	var self = this;
	window.setTimeout(function(){
		self.validateDispatcher();
	}, 50);
};
GraphView.prototype["invalidate"] = GraphView.prototype.invalidate;

/**
 * Called after the validation delay.
 * @private
 */
GraphView.prototype.validateDispatcher = function(){
	var changed = this['validate']();
	this.valid = true;
	if (changed) {
		jQuery(this).trigger('change');
	}
};

/**
 * Calculates the result graph based on the input source graph. The
 * return value is true iff the view changed.
 * This method should be overridden to do some actual calculation.
 */
GraphView.prototype.validate = function(){
	return false;
};
GraphView.prototype["validate"] = GraphView.prototype.validate;

/**
 * Graph view where the result is the same graph data structure as the source.
 * @param {Object} config Configuration parameters.
 * @constructor
 */
DirectGraphView = function(config){
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0) return;
	
	GraphView.call(this, config);
};
window["DirectGraphView"] = DirectGraphView;

DirectGraphView.prototype = new GraphView();
DirectGraphView.prototype.constructor = DirectGraphView;

DirectGraphView.prototype.validate = function(){
	var i;
	
	var doomedNodeIds = this['result'].getNodeIds();
	var doomedEdgeIds = this['result'].getEdgeIds();
	
	var resultNodes = this['source'].getNodes();
	var resultEdges = this['source'].getEdges();
	
	// Undoomify nodes and edges that are in the result tree
	// make sure their data properties are up-to-date.
	for (i = 0; i < resultEdges.length; i++) {
		index = doomedEdgeIds.indexOf(resultEdges[i]['id']);
		if (index >= 0) {
			edge = this['result'].getEdge(resultEdges[i]['id']);
			edge['data'] = resultEdges[i]['data'];
			
			doomedEdgeIds.splice(index, 1);
			resultEdges.splice(i, 1);
			i--;
		}
	}
	for (i = 0; i < resultNodes.length; i++) {
		index = doomedNodeIds.indexOf(resultNodes[i]['id']);
		if (index >= 0) {
			node = this['result'].getNode(resultNodes[i]['id']);
			node['data'] = resultNodes[i]['data'];
			
			doomedNodeIds.splice(index, 1);
			resultNodes.splice(i, 1);
			i--;
		}
	}
	
	// Remove remaining doomed nodes and edges.
	for (i = 0; i < doomedEdgeIds.length; i++) {
		this['result'].removeEdge(doomedEdgeIds[i]);
	}
	for (i = 0; i < doomedNodeIds.length; i++) {
		this['result'].removeNode(doomedNodeIds[i]);
	}
	
	// Add remaining result nodes and edges.
	for (i = 0; i < resultNodes.length; i++) {
		var resultNode = resultNodes[i];
		this['result'].addNode(
			resultNode['id'],
			resultNode['data']);
	}
	for (i = 0; i < resultEdges.length; i++) {
		var resultEdge = resultEdges[i];
		this['result'].addEdge(
			resultEdge['id'],
			resultEdge['tailNode']['id'],
			resultEdge['headNode']['id'],
			resultEdge['data']);
	}
	
	return true;
};
DirectGraphView.prototype["validate"] = DirectGraphView.prototype.validate;

/**
 * Calculates a tree rooted at the currently selected node. The
 * tree is revealed incrementally with a delay.
 * @param {Object} config Configuration parameters.
 * @constructor
 */
TreeGraphView = function(config){
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0) return;
	
	GraphView.call(this, config);
	
	this.prevSelectedNodeId = null;
	this.selectedNodeId = null;
	
	this.selectedNodeChanged = false;
	this.currDepth = 1;
};
window["TreeGraphView"] = TreeGraphView;

TreeGraphView.prototype = new GraphView();
TreeGraphView.prototype.constructor = TreeGraphView;

TreeGraphView.prototype.setConstellation = function(constellation){
	if (this['constellation']) {
		jQuery(this['constellation']).unbind('nodeselect');
	}
	
	GraphView.prototype.setConstellation.call(this, constellation);
	
	if (this['constellation']) {
		jQuery(this['constellation']).bind('nodeselect', {context: this}, function(event){
			event.data.context.selectedNodeHandler();
		});
	}
};
TreeGraphView.prototype["setConstellation"] = TreeGraphView.prototype.setConstellation;

/**
 * Called when Constellation's selected node changes.
 * @private
 */
TreeGraphView.prototype.selectedNodeHandler = function() {
	this.selectedNodeChanged = true;
	this.prevSelectedNodeId = this.selectedNodeId;
	this.selectedNodeId = this['constellation'].getSelectedNodeId();
	this.invalidate();
};
TreeGraphView.prototype["selectedNodeHandler"] = TreeGraphView.prototype.selectedNodeHandler;

/**
 * Override the default validate method to extract a tree.
 * The tree is rooted at the selected node and the nodes in
 * the result are given appropriate style classes.
 */
TreeGraphView.prototype.validate = function() {
	var i, index;

	var startDepth = this['config']['startDepth'] ? this['config']['startDepth'] : 2;
	var depth = this['config']['depth'] ? this['config']['depth'] : 3;
	var delay = this['config']['delay'] ? this['config']['delay'] : 1000;
	
	if (this.selectedNodeChanged) {
		this.currDepth = startDepth;
	}
	
	var selectedNode = this['source'].getNode(this.selectedNodeId);
	if (!selectedNode) {
		// Selected node hasn't been loaded yet. Wait until more source data
		// comes in and then we'll try validating again.
		return;
	}
	
	selectedNode['data']['depth'] = 0;
	
	var doomedNodeIds = this['result'].getNodeIds();
	var doomedEdgeIds = this['result'].getEdgeIds();
	
	var resultNodes = [selectedNode];
	var resultEdges = [];
	
	var nodeMetadata = {};
	var nodeQueue = [selectedNode];
	nodeMetadata[this.selectedNodeId] = {
		treeDepth: this.currDepth,
		nodeDepth: 0
	};
	
	while (nodeQueue.length > 0) {
		var currNode = nodeQueue.shift();
		var currNodeMetadata = nodeMetadata[currNode['id']];
		
		if (currNodeMetadata.treeDepth > 0) {
			var edges = currNode['edges'];
			for (i = 0; i < edges.length; i++) {
				var edge = edges[i];
				
				var neighborNode;
				if (edge['tailNode']['id'] == currNode['id']) {
					neighborNode = edge['headNode'];
				}
				else {
					neighborNode = edge['tailNode'];
				}
				
				var neighborNodeMetadata = nodeMetadata[neighborNode['id']];
				
				if ((!neighborNodeMetadata
						|| neighborNodeMetadata.treeDepth < currNodeMetadata.treeDepth - 1)
					&& currNodeMetadata.treeDepth > 1) {
						
					// The neighbor node has not been added yet
					var neighborTreeDepth = currNodeMetadata.treeDepth - 1;
					
					neighborNode['data']['depth'] = currNodeMetadata.nodeDepth + 1;
					
					resultNodes.push(neighborNode);
					nodeQueue.push(neighborNode);
					
					neighborNodeMetadata = {
						treeDepth: neighborTreeDepth,
						nodeDepth: currNodeMetadata.nodeDepth + 1
					};
					nodeMetadata[neighborNode['id']] = neighborNodeMetadata;
				}
				
				// Add edge if the neighbor exists.
				if (jQuery.inArray(edge, resultEdges) < 0 && neighborNodeMetadata) {
					edge['data']['depth'] = currNodeMetadata.nodeDepth;
					resultEdges.push(edge);
				}
			}
		}
	}
	
	// Undoomify nodes and edges that are in the result tree
	// make sure their data properties are up-to-date.
	for (i = 0; i < resultEdges.length; i++) {
		index = doomedEdgeIds.indexOf(resultEdges[i]['id']);
		if (index >= 0) {
			edge = this['result'].getEdge(resultEdges[i]['id']);
			edge['data'] = resultEdges[i]['data'];
			edge.dataChanged();
			
			doomedEdgeIds.splice(index, 1);
			resultEdges.splice(i, 1);
			i--;
		}
	}
	for (i = 0; i < resultNodes.length; i++) {
		index = doomedNodeIds.indexOf(resultNodes[i]['id']);
		if (index >= 0) {
			node = this['result'].getNode(resultNodes[i]['id']);
			node['data'] = resultNodes[i]['data'];
			node.dataChanged();
			
			doomedNodeIds.splice(index, 1);
			resultNodes.splice(i, 1);
			i--;
		}
	}
	
	// Remove remaining doomed nodes and edges.
	for (i = 0; i < doomedEdgeIds.length; i++) {
		var doomedEdgeId = doomedEdgeIds[i];
		jQuery(this['source'].getNode(doomedEdgeId)).unbind('dataChange', this.edgeDataChangeHandler);
		this['result'].removeEdge(doomedEdgeId);
	}
	for (i = 0; i < doomedNodeIds.length; i++) {
		var doomedNodeId = doomedNodeIds[i];
		jQuery(this['source'].getNode(doomedNodeId)).unbind('dataChange', this.nodeDataChangeHandler);
		this['result'].removeNode(doomedNodeId);
	}
	
	// Add remaining result nodes and edges.
	for (i = 0; i < resultNodes.length; i++) {
		var resultNode = resultNodes[i];
		var n = this['result'].addNode(
			resultNode['id'],
			// FIXME: Should the data be cloned and if so, shallow or deep copy?
			jQuery.extend({}, resultNode['data']));
		jQuery(resultNode).bind('dataChange', {context: this, result: n}, this.dataChangeHandler);
	}
	for (i = 0; i < resultEdges.length; i++) {
		var resultEdge = resultEdges[i];
		var e = this['result'].addEdge(
			resultEdge['id'],
			resultEdge['tailNode']['id'],
			resultEdge['headNode']['id'],
			// FIXME: Should the data be cloned and if so, shallow or deep copy?
			jQuery.extend({}, resultEdge['data']));
		jQuery(resultEdge).bind('dataChange', {context: this, result: e}, this.dataChangeHandler);
	}
	
	this.selectedNodeChanged = false;
	
	if (this.currDepth < depth) {
		// Need to increment the depth after a delay.
		clearTimeout(this.incrementDepthTimeoutId);
		
		var self = this;
		this.incrementDepthTimeoutId = setTimeout(function() {
			self.incrementDepth();
		}, delay);
	}
	
	return true;
};
TreeGraphView.prototype["validate"] = TreeGraphView.prototype.validate;

TreeGraphView.prototype.dataChangeHandler = function(event) {
	// Copy the data from the source node/edge (event target) to the result node/edge.
	// FIXME: Should jQuery.extend be used here to protect existing properties?
	event.data.result.data = event.target.data;
	event.data.result.draw();
};

TreeGraphView.prototype.incrementDepth = function() {
	this.currDepth++;
	this.invalidate();
};





