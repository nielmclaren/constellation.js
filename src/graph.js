
/**
 * @param {Object} nodeId
 * @param {Object} data
 * @constructor
 */
Node = function(nodeId, data) {
	this['id'] = nodeId;
	this['data'] = data ? data : {};
	
	this['edges'] = [];
};
window["Node"] = Node;

Node.prototype.getNeighborNodes = function() {
	var result = [];
	for (var i = 0; i < this['edges'].length; i++) {
		if (this['edges'][i]['tailNode']['id'] == this['id']) {
			result.push(this['edges'][i]['headNode']);
		}
		else {
			result.push(this['edges'][i]['tailNode']);
		}
	}
	return result;
};
Node.prototype['getNeighborNodes'] = Node.prototype.getNeighborNodes;

/**
 * Fetches an array of tuples containing an edge and a neighbor node.
 * @returns {Array} An array of tuples: (edge, node).
 */
Node.prototype.getNeighborEdgeNodePairs = function() {
	var result = [];
	for (var i = 0; i < this['edges'].length; i++) {
		if (this['edges'][i]['tailNode']['id'] == this['id']) {
			result.push([this['edges'][i], this['edges'][i]['headNode']]);
		}
		else {
			result.push([this['edges'][i], this['edges'][i]['tailNode']]);
		}
	}
	return result;
};
Node.prototype['getNeighborEdgeNodePairs'] = Node.prototype.getNeighborEdgeNodePairs;

/**
 * Notifies listeners that the node data changed.
 */
Node.prototype.dataChanged = function() {
	jQuery(this).trigger('dataChange');
};
Node.prototype['dataChanged'] = Node.prototype.dataChanged;

/**
 * @param {Object} edgeId
 * @param {Object} tailNode
 * @param {Object} headNode
 * @param {Object} data
 * @constructor
 */
Edge = function(edgeId, tailNode, headNode, data) {
	this['id'] = edgeId;
	this['tailNode'] = tailNode;
	this['headNode'] = headNode;
	this['data'] = data ? data : {};
};
window["Edge"] = Edge;

/**
 * Fetches the node that <em>doesn't</em> have the given ID.
 * @param nodeId The ID of the node that you already have.
 * @return The other node in the relationship.
 */
Edge.prototype.getOtherNode = function(nodeId) {
	return nodeId == this['tailNode']['id']
		? this['headNode']
		: nodeId == this['headNode']['id']
			? this['tailNode']
			: null;
};
Edge.prototype["getOtherNode"] = Edge.prototype.getOtherNode;

/**
 * Notifies listeners that the edge data changed.
 */
Edge.prototype.dataChanged = function() {
	jQuery(this).trigger('dataChange');
};
Edge.prototype['dataChanged'] = Edge.prototype.dataChanged;



/**
 * Stores a list of Node and Edge objects. Each node stores
 * references to its edges. Each edge stores references to
 * its tail and head nodes.
 * @constructor
 */
Graph = function() {
	this.nodes = [];
	this.edges = [];
};
window["Graph"] = Graph;

Graph.prototype.addNode = function(nodeId, data) {
	if (this.getNode(nodeId)) {
		throw "Failed to add node. Node already exists. id=" + nodeId;
	}
	
	var node = new Node(nodeId, data);
	this.nodes.push(node);
	return node;
};
Graph.prototype['addNode'] = Graph.prototype.addNode;

Graph.prototype.getNode = function(nodeId) {
	// FIXME: Optimize for retrieval.
	for (var i = 0 ; i < this.nodes.length; i++) {
		if (this.nodes[i]['id'] == nodeId) {
			return this.nodes[i];
		}
	}
	return null;
};
Graph.prototype['getNode'] = Graph.prototype.getNode;

Graph.prototype.getNodes = function() {
	return this.nodes.concat();
};
Graph.prototype['getNodes'] = Graph.prototype.getNodes;

Graph.prototype.getNodeIds = function() {
	return this.nodes.map(function(item, index, array) {
		return item['id'];
	});
};
Graph.prototype['getNodeIds'] = Graph.prototype.getNodeIds;

Graph.prototype.getNodeLength = function() {
	return this.nodes.length;
};
Graph.prototype['getNodeLength'] = Graph.prototype.getNodeLength;

Graph.prototype.removeNode = function(nodeId) {
	for (var i = 0; i < this.nodes.length; i++) {
		if (this.nodes[i]['id'] == nodeId) {
			while (this.nodes[i]['edges'].length > 0) {
				this.removeEdge(this.nodes[i]['edges'][0].id);
			}

			this.nodes.splice(i, 1);
			return;
		}
	}
	throw "Failed to remove node. Node does not exist. id=" + nodeId;
};
Graph.prototype['removeNode'] = Graph.prototype.removeNode;

Graph.prototype.updateNode = function(nodeId, data) {
	var node = this.getNode(nodeId);
	if (node) {
		node['data'] = data;
	}
	else {
		throw "Failed to update node. Node does not exist. id=" + nodeId;
	}
	return node;
};
Graph.prototype['updateNode'] = Graph.prototype.updateNode;

Graph.prototype.upsertNode = function(nodeId, data, doExtend, deepExtend) {
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
Graph.prototype['upsertNode'] = Graph.prototype.upsertNode;

Graph.prototype.addEdge = function(edgeId, tailNodeId, headNodeId, data) {
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
	
	var edge = new Edge(edgeId, tailNode, headNode, data);
	this.edges.push(edge);

	tailNode['edges'].push(edge);
	headNode['edges'].push(edge);
		
	return edge;
};
Graph.prototype['addEdge'] = Graph.prototype.addEdge;

Graph.prototype.getEdge = function(edgeId) {
	// FIXME: Optimize for retrieval.
	for (var i = 0; i < this.edges.length; i++) {
		if (this.edges[i]['id'] == edgeId) {
			return this.edges[i];
		}
	}
	return null;
};
Graph.prototype['getEdge'] = Graph.prototype.getEdge;

Graph.prototype.getEdgeIds = function() {
	return this.edges.map(function(item, index, array) {
		return item['id'];
	});
};
Graph.prototype['getEdgeIds'] = Graph.prototype.getEdgeIds;

Graph.prototype.getEdges = function() {
	return this.edges.concat();
};
Graph.prototype['getEdges'] = Graph.prototype.getEdges;

Graph.prototype.getEdgeLength = function() {
	return this.edges.length;
};
Graph.prototype['getEdgeLength'] = Graph.prototype.getEdgeLength;

Graph.prototype.removeEdge = function(edgeId) {
	var i, edge = null;
	
	// Remove the edge from the graph's list of edges.
	for (i = 0; i < this.edges.length; i++) {
		if (this.edges[i]['id'] == edgeId) {
			edge = this.edges[i];
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
	}
	else {
		throw "Failed to remove edge. Edge does not exist. id=" + edgeId;
	}
};
Graph.prototype['removeEdge'] = Graph.prototype.removeEdge;

Graph.prototype.updateEdge = function(edgeId, data) {
	var edge = this.getEdge(edgeId);
	if (edge) {
		edge['data'] = data;
	}
	else {
		throw "Failed to update edge. Edge does not exist. id=" + edgeId;
	}
	return edge;
};
Graph.prototype['updateEdge'] = Graph.prototype.updateEdge;

Graph.prototype.upsertEdge = function(edgeId, tailNodeId, headNodeId, data, doExtend, deepExtend) {
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
Graph.prototype['upsertEdge'] = Graph.prototype.upsertEdge;

Graph.prototype.clear = function() {
	this.nodes = [];
	this.edges = [];
};
Graph.prototype['clear'] = Graph.prototype.clear;

