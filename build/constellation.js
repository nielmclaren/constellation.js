/** @preserve constellation.js | http://constellationjs.com/license */

/**
 * A singleton class for dispatching delayed function calls.
 */
var CallLaterDispatcher = (function() {
    var instance = null;

    function PrivateConstructor() {
        var callLaterFuncs = [];
        var callLaterTimeoutId = null;
        
        /**
         * Queues the given function to be called later.
         * @param {Object} context The 'this' object for the call.
         * @param {Object} func The function to call.
         * @param {Object} args Array of arguments to pass to the function.
         */
        this.callLater = function(context, func, args) {
            callLaterFuncs.push({
                context: context ? context : {},
                func: func,
                args: args ? args : []
            });
            
            if (callLaterTimeoutId == null) {
                callLaterTimeoutId = setTimeout(
                    'CallLaterDispatcher.getInstance().callLaterDispatcher()', 50);
            }
        };
        
        /**
         * Calls the functions in the call later queue.
         * @private Internal use only.
         */
        this.callLaterDispatcher = function() {
            for (var i = 0; i < callLaterFuncs.length; i++) {
                var o = callLaterFuncs[i];
                o.func.apply(o.context, o.args);
            }
            
            callLaterFuncs = [];
            callLaterTimeoutId = null;
        };
    }

    /**
     * Fetches a singleton instance.
     */
    return new function() {
        this.getInstance = function() {
            if (instance == null) {
                instance = new PrivateConstructor();
                instance.constructor = null;
            }
            return instance;
        };
    };
})();



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

/**
 * 
 * @param config
 * @returns {GraphParser}
 * @constructor
 */
GraphParser = function(config) {
    // Constructor with no arguments is used for subclasses.
    if (arguments.length <= 0) return;
    
    this['config'] = config;
    this['graph'] = null;
};
window["GraphParser"] = GraphParser;

GraphParser.prototype.getGraph = function() {
    return this['graph'];
};
GraphParser.prototype["getGraph"] = GraphParser.prototype.getGraph;

GraphParser.prototype.setGraph = function(graph) {
    this['graph'] = graph;
};
GraphParser.prototype["setGraph"] = GraphParser.prototype.setGraph;

GraphParser.prototype.parse = function(data) {
    
};
GraphParser.prototype["parse"] = GraphParser.prototype.parse;

/**
 * 
 * @param config
 * @returns {RoamerGraphParser}
 * @constructor
 */
RoamerGraphParser = function(config) {
    // Constructor with no arguments is used for subclasses.
    if (arguments.length <= 0) return;
    
    GraphParser.call(this, config);
};
window["RoamerGraphParser"] = RoamerGraphParser;

RoamerGraphParser.prototype = new GraphParser();
RoamerGraphParser.prototype.constructor = RoamerGraphParser;

RoamerGraphParser.prototype.parse = function(data) {
    if (!(data instanceof jQuery)) {
        data = jQuery(data);
    }
    
    var graph = this['graph'];

    data.find('node').each(function (i, nodeElem) {
        nodeElem = jQuery(nodeElem);
        
        var nodeData = {};
        jQuery.each(this.attributes, function(i, attribute) {
            nodeData[attribute.name] = attribute.value;
        });
        
        graph.addNode(nodeElem.attr('id'), nodeData);
    });
    
    data.find('edge').each(function (i, edgeElem) {
        edgeElem = jQuery(edgeElem);
        
        var edgeData = {};
        jQuery.each(this.attributes, function(i, attribute) {
            edgeData[attribute.name] = attribute.value;
        });
        
        graph.addEdge(
            edgeElem.attr('id'),
            edgeElem.attr('tail_node_id'),
            edgeElem.attr('head_node_id'),
            edgeData);
    });
    
    jQuery(this).trigger('complete');
};
RoamerGraphParser.prototype["parse"] = RoamerGraphParser.prototype.parse;

/**
 * 
 * @param config
 * @returns {GraphMlParser}
 * @constructor
 */
GraphMlParser = function(config) {
    // Constructor with no arguments is used for subclasses.
    if (arguments.length <= 0) return;
    
    GraphParser.call(this, config);
};
window["GraphMlParser"] = GraphMlParser;

GraphMlParser.prototype = new GraphParser();
GraphMlParser.prototype.constructor = GraphMlParser;

GraphMlParser.prototype.parse = function(data) {
    if (!(data instanceof jQuery)) {
        data = jQuery(data);
    }
    
    var graph = this['graph'];

    var nodeKeys = {};
    data.find('key[for="node"]').each(function (i, keyElem) {
        keyElem = jQuery(keyElem);
        nodeKeys[keyElem.attr('id')] = keyElem;
    });
        
    var edgeKeys = {};
    data.find('key[for="edge"]').each(function (i, keyElem) {
        keyElem = jQuery(keyElem);
        edgeKeys[keyElem.attr('id')] = keyElem;
    });
    
    data.find('node').each(function (i, nodeElem) {
        nodeElem = jQuery(nodeElem);
        
        var nodeData = {};
        for (var key in nodeKeys) {
            var attributeName = nodeKeys[key].attr('attr.name').replace(/[^a-zA-Z0-9]/g, '_');
            var dataElems = nodeElem.find('data[key="' + key + '"]');
            if (dataElems.length > 0) {
                nodeData[attributeName] = dataElems.text();
            }
        }
        
        graph.addNode(nodeElem.attr('id'), nodeData);
    });
    
    data.find('edge').each(function (i, edgeElem) {
        edgeElem = jQuery(edgeElem);
        
        var edgeData = {};
        for (var key in edgeKeys) {
            var attributeName = edgeKeys[key].attr('attr.name').replace(/[^a-zA-Z0-9]/g, '_');
            var dataElems = edgeElem.find('data[key="' + key + '"]');
            if (dataElems.length > 0) {
                edgeData[attributeName] = dataElems.text();
            }
        }
        
        graph.addEdge(
            edgeElem.attr('source') + ':' + edgeElem.attr('target'),
            edgeElem.attr('source'),
            edgeElem.attr('target'),
            edgeData);
    });
    
    jQuery(this).trigger('complete');
};
GraphMlParser.prototype["parse"] = GraphMlParser.prototype.parse;



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
    
    selectedNode.data.depth = 0;
    
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
                    
                    neighborNode.data.depth = currNodeMetadata.nodeDepth + 1;
                    
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
                    edge.data.depth = currNodeMetadata.nodeDepth;
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






/**
 * @param {Object} config
 * @constructor
 */
Layout = function(config) {
    if (arguments.length <= 0) return;
    this['config'] = config;
};
window["Layout"] = Layout;

Layout.prototype.getConstellation = function() {
    return this['constellation'];
};
Layout.prototype["getConstellation"] = Layout.prototype.getConstellation;

Layout.prototype.setConstellation = function(constellation) {
    this['constellation'] = constellation;
};
Layout.prototype["setConstellation"] = Layout.prototype.setConstellation;

/**
 * Called by Constellation when the view changes.
 */
Layout.prototype.viewChanged = function() {
    var nodes = this['constellation'].getNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node['x'] == null || node['y'] == null) {
            node['x'] = Math.floor((Math.random() * 100 - 50) / 10) * 10;
            node['y'] = Math.floor((Math.random() * 100 - 50) / 10) * 10;
        }
    }
    
    jQuery(this).trigger('change');
};
Layout.prototype["viewChanged"] = Layout.prototype.viewChanged;


/**
 * @param {Object} config
 * @constructor
 */
StaticLayout = function(config) {
    if (arguments.length <= 0) return;
    Layout.call(this, config);
    
    this.timeoutId = null;
};
window["StaticLayout"] = StaticLayout;

StaticLayout.prototype = new Layout();
StaticLayout.prototype.constructor = StaticLayout;

StaticLayout.prototype.setConstellation = function(constellation) {
    if (this['constellation']) {
        jQuery(this['constellation'])
            .unbind('nodemousedown')
            .unbind('mouseup');
    }
    
    Layout.prototype.setConstellation.call(this, constellation);
    
    if (this['constellation']) {
        jQuery(this['constellation'])
            .bind('nodemousedown', {context: this}, function(event) {
                event.data.context.nodemousedownHandler(event); })
            .bind('mouseup', {context: this}, function(event) {
                event.data.context.mouseupHandler(event); });
    }
};
StaticLayout.prototype["setConstellation"] = StaticLayout.prototype.setConstellation;

/**
 * Called by Constellation when the view changes.
 */
StaticLayout.prototype.viewChanged = function(){
    var nodes = this['constellation'].getNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node['x'] == null || node['y'] == null) {
            if (node['data']['x']) {
                node['x'] = node['data']['x'];
            }
            else {
                node['x'] = (Math.random() - 0.5) * this['constellation'].viewportWidth;
            }
            
            if (node['data']['y']) {
                node['y'] = node['data']['y'];
            }
            else {
                node['y'] = (Math.random() - 0.5) * this['constellation'].viewportHeight;
            }
        }
    }
    
    jQuery(this).trigger('change');
};
StaticLayout.prototype["viewChanged"] = StaticLayout.prototype.viewChanged;

StaticLayout.prototype.nodemousedownHandler = function(event) {
    this.step();
};

StaticLayout.prototype.mouseupHandler = function(event) {
    if (this.timeoutId) clearInterval(this.timeoutId);
};

StaticLayout.prototype.step = function() {
    // Keep the touch-dragged nodes under the mouse.
    for (var key in this['constellation'].touchMetadata) {
        var touchMetadata = this['constellation'].touchMetadata[key];
        if (touchMetadata.node) {
            var touch = touchMetadata.touch;
            var dragNode = touchMetadata.node;
            
            var viewportX = this['constellation'].pageToViewportX(touch.pageX, touch.pageY)
                - touchMetadata.nodeOffsetX;
            var viewportY = this['constellation'].pageToViewportY(touch.pageX, touch.pageY)
                - touchMetadata.nodeOffsetY;
            dragNode['x'] = this['constellation'].viewportToWorldX(viewportX, viewportY);
            dragNode['y'] = this['constellation'].viewportToWorldY(viewportX, viewportY);
        }
    }
    
    jQuery(this).trigger('change');
    
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(function(constellation) {
        return function() {
            constellation.step();
        };
    }(this), 40);
};


/**
 * @param {Object} constellation
 * @constructor
 */
RoamerLayout = function(config) {
    if (arguments.length <= 0) return;
    Layout.call(this, config);
    
    this.timeoutId = null;
    
    this.toBePlacedNodes = [];
};
window["RoamerLayout"] = RoamerLayout;

RoamerLayout.prototype = new Layout();
RoamerLayout.prototype.constructor = RoamerLayout;

RoamerLayout.prototype.setConstellation = function(constellation) {
    if (this['constellation']) {
        jQuery(this['constellation']).unbind('nodeAdded');
        
        if (this.timeoutId) clearTimeout(this.timeoutId);
    }
    
    Layout.prototype.setConstellation.call(this, constellation);

    if (this['constellation']) {
        jQuery(this['constellation']).bind('nodeAdded', {context: this}, function(event, node) {
            event.data.context.nodeAddedHandler(event, node);
        });
        
        this.step();
    }
};
RoamerLayout.prototype["setConstellation"] = RoamerLayout.prototype.setConstellation;

/**
 * Called by Constellation when the view changes.
 */
RoamerLayout.prototype.viewChanged = function() {
    
};
RoamerLayout.prototype["viewChanged"] = RoamerLayout.prototype.viewChanged;

RoamerLayout.prototype.nodeAddedHandler = function(event, node) {
    // Don't place the node right away. Wait for its edges to load.
    this.toBePlacedNodes.push(node);
};

RoamerLayout.prototype.step = function() {
    var p = this['config'];
    
    var scrollRate = p['scrollRate'] ? p['scrollRate'] : 0.1;
    var baseEdgeLength = p['baseEdgeLength'] ? p['baseEdgeLength'] : 100;
    var attractionFactor = p['attractionFactor'] ? p['attractionFactor'] : 0.2;
    var repulsionFactor = p['repulsionFactor'] ? p['repulsionFactor'] : 0.2;
    var accelerationLimit = p['accelerationLimit'] ? p['accelerationLimit'] : 15;
    var dampingConstant = p['dampingConstant'] ? p['dampingConstant'] : 0.3;
    
    // Place new nodes.
    if (this.toBePlacedNodes.length > 0) {
        this['setNodeInitialPositions'](this.toBePlacedNodes);
        this.toBePlacedNodes = [];
    }
    
    // Figure out the bounds center.
    var bounds = this['constellation'].getRendererBounds();
    var centerX = bounds['x'] + bounds['width']/2;
    var centerY = bounds['y'] + bounds['height']/2;
    //var centerLength = Math.sqrt(centerX * centerX   +   centerY * centerY);
    var scrollX = -scrollRate * centerX;
    var scrollY = -scrollRate * centerY;
    
    // FIXME: Shouldn't be calling concat here.
    var nodes = this['constellation'].getNodes();
    // FIXME: Naive implementation. Optimize!
    for (var i = 0; i < nodes.length; i++) {
        var nodeA = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
            var nodeB = nodes[j];
            
            var distanceX = nodeB['x'] - nodeA['x'];
            var distanceY = nodeB['y'] - nodeA['y'];
            if (distanceX == 0 && distanceY == 0) {
                distanceX = Math.random() * 0.5;
                distanceY = Math.random() * 0.5;
            }
            var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // FIXME: Scale the preferred distance.
            var preferredDistance = baseEdgeLength;
            var deltaX = distanceX - (distanceX / distance * preferredDistance);
            var deltaY = distanceY - (distanceY / distance * preferredDistance);
            
            var fx = 0;
            var fy = 0;
            
            var hasEdge = false;
            for (var k = 0; k < nodeA['edges'].length; k++) {
                var edge = nodeA['edges'][k];
                if (edge['tailNode']['id'] == nodeB['id'] || edge['headNode']['id'] == nodeB['id']) {
                    hasEdge = true;
                }
            }
            
            if (hasEdge && distance > preferredDistance) {
                fx = deltaX * attractionFactor;
                fy = deltaY * attractionFactor;
            }
            else if (distance < preferredDistance) {
                fx = deltaX * repulsionFactor;
                fy = deltaY * repulsionFactor;
            }
            
            var modifier;
            var edgeLength;
            
            modifier = 1;
            edgeLength = nodeA['edges'].length;
            if (edgeLength > 0) {
                modifier = 1 / Math.pow(edgeLength, 1 / 3);
            }
            
            nodeA['ax'] += fx * modifier;
            nodeA['ay'] += fy * modifier;
            
            modifier = 1;
            edgeLength = nodeB['edges'].length;
            if (edgeLength > 0) {
                modifier = 1 / Math.pow(edgeLength, 1 / 3);
            }
            
            nodeB['ax'] -= fx * modifier;
            nodeB['ay'] -= fy * modifier;
        }
    }
    
    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        
        var magnitude = Math.sqrt(node['ax'] * node['ax'] + node['ay'] * node['ay']);
        if (magnitude > accelerationLimit) {
            node['ax'] = node['ax'] / magnitude * accelerationLimit;
            node['ay'] = node['ay'] / magnitude * accelerationLimit;
        }
        
        node['ax'] -= node['vx'] * dampingConstant;
        node['ay'] -= node['vy'] * dampingConstant;
        
        node['vx'] += node['ax'];
        node['vy'] += node['ay'];
        
        node['x'] += node['vx'] + scrollX;
        node['y'] += node['vy'] + scrollY;
        
        // Set acceleration back to zero so it can be recalculated during the next
        // step. This also allows subclasses to adjust the acceleration before the step.
        node['ax'] = 0;
        node['ay'] = 0;
    }
    
    // FIXME: Need an API to expose the touchMetadata objects somehow.
    // Keep the touch-dragged nodes under the mouse.
    for (var key in this['constellation'].touchMetadata) {
        var touchMetadata = this['constellation'].touchMetadata[key];
        if (touchMetadata.node) {
            var touch = touchMetadata.touch;
            var dragNode = touchMetadata.node;
            
            var viewportX = this['constellation'].pageToViewportX(touch.pageX, touch.pageY) - touchMetadata.nodeOffsetX;
            var viewportY = this['constellation'].pageToViewportY(touch.pageX, touch.pageY) - touchMetadata.nodeOffsetY;
            dragNode['x'] = this['constellation'].viewportToWorldX(viewportX, viewportY);
            dragNode['y'] = this['constellation'].viewportToWorldY(viewportX, viewportY);
        }
    }
    
    jQuery(this).trigger('change');
    
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(function(constellation) {
        return function() {
            constellation.step();
        };
    }(this), 40);
};

RoamerLayout.prototype.setNodeInitialPositions = function(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        this['setNodeInitialPosition'](nodes[i]);
    }
};
RoamerLayout.prototype["setNodeInitialPositions"] = RoamerLayout.prototype.setNodeInitialPositions;

RoamerLayout.prototype.setNodeInitialPosition = function(node) {
    var x = 0, y = 0;
    
    // Get the average position of all neighbour nodes that have already been placed.
    var placedNeighbors = node.getNeighborNodes().filter(this.filterPlacedNodes);
    var averagePos = this.getAveragePosition(placedNeighbors);
    
    if (placedNeighbors.length > 1) {
        // The node has neighbors so place it between them.
        x = averagePos['x'];
        y = averagePos['y'];
    }
    else if (placedNeighbors.length > 0) {
        // Only one neighbor so place it opposite that neighbor's neighbors (cousins).
        var neighborNode = placedNeighbors[0];
        var placedCousins = neighborNode.getNeighborNodes().filter(this.filterPlacedNodes);
        
        if (placedCousins.length > 0) {
            var cousinsAveragePos = this.getAveragePosition(placedCousins);
            var offset = {
                'x': neighborNode['x'] - cousinsAveragePos['x'],
                'y': neighborNode['y'] - cousinsAveragePos['y']
            };
            var offsetLength = Math.sqrt(offset['x'] * offset['x'] + offset['y'] * offset['y']);
            
            x = neighborNode['x'] + 50 * offset['x'] / offsetLength;
            y = neighborNode['y'] + 50 * offset['y'] / offsetLength;
        }
        else {
            // No placed cousins so place the node over the neighbor.
            x = neighborNode['x'];
            y = neighborNode['y'];
        }
    }
    
    // Add random jitter so nodes don't end up in the same spot.
    node['x'] = x + Math.random() - 0.5;
    node['y'] = y + Math.random() - 0.5;
};
RoamerLayout.prototype["setNodeInitialPosition"] = RoamerLayout.prototype.setNodeInitialPosition;

RoamerLayout.prototype.filterPlacedNodes = function(node, index, array) {
    return node['x'] != null || node['y'] != null;
};

RoamerLayout.prototype.getAveragePosition = function(nodes) {
    if (nodes.length <= 0) return null;
    
    var x = 0, y = 0;
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        x += node['x'];
        y += node['y'];
    }
    return {'x': x / nodes.length, 'y': y / nodes.length};
};




/**
 * 
 * @param constellation
 * @param nodeId
 * @param data
 * @returns {NodeRenderer}
 * @constructor
 */
NodeRenderer = function(constellation, nodeId, data) {
    this['constellation'] = constellation;
    this['classes'] = [];

    Node.call(this, nodeId, data);
    this.dataChanged();

    // Initial node placement is performed by the GraphView.
    this['x'] = null;
    this['y'] = null;
    
    this['vx'] = 0;
    this['vy'] = 0;
    this['ax'] = 0;
    this['ay'] = 0;
};
window["NodeRenderer"] = NodeRenderer;

NodeRenderer.prototype = new Node();
NodeRenderer.prototype.constructor = NodeRenderer;

NodeRenderer.prototype.defaultStyles = {};

NodeRenderer.prototype.getStyle = function(propertyName) {
    return this['constellation'].getStyle('node', this['classes'], propertyName, this['data'], this.defaultStyles);
};
NodeRenderer.prototype["getStyle"] = NodeRenderer.prototype.getStyle;

NodeRenderer.prototype.addClass = function(className) {
    if (jQuery.inArray(className, this['classes']) < 0) {
        this['classes'].push(className);
    }
};
NodeRenderer.prototype["addClass"] = NodeRenderer.prototype.addClass;

NodeRenderer.prototype.hasClass = function(className) {
    return jQuery.inArray(className, this['classes']) >= 0;
};
NodeRenderer.prototype["hasClass"] = NodeRenderer.prototype.hasClass;

NodeRenderer.prototype.removeClass = function(className) {
    var index;
    while ((index = jQuery.inArray(className, this['classes'])) >= 0) {
        this['classes'].splice(index, 1);
    }
};
NodeRenderer.prototype["removeClass"] = NodeRenderer.prototype.removeClass;

NodeRenderer.prototype.dataChanged = function() {
    Node.prototype.dataChanged.call(this);

    if (this['data']['class']) {
        this['classes'] = [];
        var classes = this['data']['class'].split(/\s/);
        for (var i = 0; i < classes.length; i++) {
            this.addClass(classes[i]);
        }
    }
};
NodeRenderer.prototype["dataChanged"] = NodeRenderer.prototype.dataChanged;

NodeRenderer.prototype.create = function() {};
NodeRenderer.prototype["create"] = NodeRenderer.prototype.create;

NodeRenderer.prototype.draw = function() {};
NodeRenderer.prototype["draw"] = NodeRenderer.prototype.draw;

NodeRenderer.prototype.position = function() {};
NodeRenderer.prototype["position"] = NodeRenderer.prototype.position;

NodeRenderer.prototype.destroy = function() {};
NodeRenderer.prototype["destroy"] = NodeRenderer.prototype.destroy;


/**
 * 
 * @param constellation
 * @param nodeId
 * @param data
 * @returns {DefaultNodeRenderer}
 * @constructor
 */
DefaultNodeRenderer = function(constellation, nodeId, data) {
    NodeRenderer.call(this, constellation, nodeId, data);

    // Keep track of state to optimize redraw.
    this.label = null;
    this.graphicShape = null;
    this.graphicSize = null;
    this.graphicImageUrl = null;
    this.prevLeftIconUrl = null;
    this.prevRightIconUrl = null;
};
window["DefaultNodeRenderer"] = DefaultNodeRenderer;

DefaultNodeRenderer.prototype = new NodeRenderer();
DefaultNodeRenderer.prototype.constructor = DefaultNodeRenderer;

DefaultNodeRenderer.prototype.defaultStyles = {
    'label': '',
    
    'graphicShape': 'circle',
    'graphicFillColor': '#ffffff',
    'graphicLineColor': '#000000',
    'graphicSize': 40,
    
    'leftIconUrl': '',
    'rightIconUrl': '',
    
    'leftIconSpacing': 0,
    'rightIconSpacing': 0,
    
    'labelBoxEnabled': true,
    'labelBoxFillColor': '#ffffff',
    'labelBoxLineColor': '#000000',
    'labelBoxCornerRadius': 5,
    
    'labelPosition': 'center',
    
    'labelFontColor': '#000000',
    'labelFontWeight': 'normal',
    'labelFontFamily': 'Arial',
    'labelFontStyle': 'normal',
    'labelFontSize': 12
};

// FIXME: Implement graphic image in node renderers.
// FIXME: Implement left and right icons.
DefaultNodeRenderer.prototype.create = function(){
    var svg = this['constellation']['svg'];
    var container = this['constellation'].getNodeContainer();
    
    var group = svg.group(container, {'display': 'none'});
    this.renderer = {
        group: group,
        graphicContainer: svg.group(group),
        graphic: null,
        labelBackground: svg.rect(group, 0, 0, 0, 0, 2, 2, {
            'fill': '#ffffcc',
            'stroke': '#333333',
            'strokeWidth': 1
        }),
        label: svg.text(group, 0, 0, '', {
            'style': '-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-o-user-select: none;user-select: none;',
            'fontFamily': 'Verdana',
            'fontSize': 15,
            'fontWeight': 'bold',
            'fill': '#441111',
            'textAnchor': 'middle',
            
            // HACK: Better cross-browser compatibility with 'dy'
            //dominantBaseline: 'central'
            'dy': '.35em'
        })
    };
    
    jQuery(this.renderer.group)
        .bind('mouseover', {'context':this}, function(event) {
            event.data.context['constellation']['nodemouseoverHandler'](event, event.data.context);
        })
        .bind('mouseout', {'context':this}, function(event) {
            event.data.context['constellation']['nodemouseoutHandler'](event, event.data.context);
        })
        .bind('mousedown', {'context':this}, function(event) {
            event.data.context['constellation']['nodemousedownHandler'](event, event.data.context);
        })
        .bind('mouseup', {'context':this}, function(event) {
            event.data.context['constellation']['nodemouseupHandler'](event, event.data.context);
        })
        .bind('click', {'context':this}, function(event) {
            event.data.context['constellation']['nodeclickHandler'](event, event.data.context);
        })
        .bind('touchstart', {'context':this}, function(event) {
            event.data.context['constellation']['nodetouchstartHandler'](event, event.data.context);
        })
        .bind('touchend', {'context':this}, function(event) {
            event.data.context['constellation']['nodetouchendHandler'](event, event.data.context);
        });
};
DefaultNodeRenderer.prototype["create"] = DefaultNodeRenderer.prototype.create;

DefaultNodeRenderer.prototype.draw = function() {
    var svg = this['constellation']['svg'];

    // Update the display at the beginning of the draw call so getBBox doesn't fail in Firefox.
    jQuery(this.renderer.group).css('display', 'inline');
    
    var graphicSettings = {
        'fill': this.getStyle('graphicFillColor'),
        'stroke': this.getStyle('graphicLineColor')
    };

    var label = this.getStyle('label');
    var graphicSize = this.getStyle('graphicSize');
    var graphicShape = this.getStyle('graphicShape');
    
    if (this.graphicShape != graphicShape) {
        // Shape changed so we need to redraw the graphic.
        if (this.renderer.graphic) {
            jQuery(this.renderer.graphic).remove();
            this.renderer.graphic = null;
        }
        
        switch (graphicShape) {
            case 'pentagon':
                // FIXME: Support pentagon node graphic shape.
                break;
            case 'square':
                this.renderer.graphic = svg.rect(this.renderer.graphicContainer,
                    -graphicSize/2, -graphicSize/2, graphicSize, graphicSize, graphicSettings);
                break;
            case 'diamond':
                // FIXME: Support diamond node graphic shape.
                break;
            case 'triangle':
                // FIXME: Support triangle node graphic shape.
                break;
            case 'circle':
                this.renderer.graphic = svg.circle(this.renderer.graphicContainer,
                    0, 0, graphicSize/2, graphicSettings);
                break;
            default:
                throw "Failed to draw node graphic. Unknown shape. shape='" + graphicShape + "'";
        }
    }
    else if (this.graphicSize != graphicSize) {
        // Size changed so we need to adjust the graphic position and dimensions.
        switch (graphicShape) {
            case 'pentagon':
                // FIXME: Support pentagon node graphic shape.
                break;
            case 'square':
                graphicSettings['x'] = -graphicSize/2;
                graphicSettings['y'] = -graphicSize/2;
                graphicSettings['width'] = graphicSize;
                graphicSettings['height'] = graphicSize;
                break;
            case 'diamond':
                // FIXME: Support diamond node graphic shape.
                break;
            case 'triangle':
                // FIXME: Support triangle node graphic shape.
                break;
            case 'circle':
                graphicSettings['r'] = graphicSize / 2;
                break;
            default:
                throw "Failed to draw node graphic. Unknown shape. shape='" + graphicShape + "'";
        }
        svg.change(this.renderer.graphic, graphicSettings);
    }
    else {
        // No shape or size change but we still need to update other settings.
        svg.change(this.renderer.graphic, graphicSettings);
    }
    
    if (this.label != label) {
        jQuery(this.renderer.label)
            .contents().remove().end()
            .append(label);
    }

    svg.change(this.renderer.label, {
        'fontFamily': this.getStyle('labelFontFamily'),
        'fontSize': this.getStyle('labelFontSize'),
        'fontStyle': this.getStyle('labelFontStyle'),
        'fontWeight': this.getStyle('labelFontWeight'),
        'fill': this.getStyle('labelFontColor')
    });

    var labelMargin = 5;
    var horizontalPadding = 8, verticalPadding = 3;

    var graphicBounds = this.renderer.graphic.getBBox();
    var labelBounds = this.renderer.label.getBBox();

    switch (this.getStyle('labelPosition')) {
        case 'top':
            labelPosition = {x: 0, y: -graphicBounds.height/2 - labelMargin - verticalPadding - labelBounds.height/2};
            break;
        
        case 'right':
            labelPosition = {x: graphicBounds.width/2 + labelMargin + labelBounds.width/2 + horizontalPadding, y: 0};
            break;
        
        case 'bottom':
            labelPosition = {x: 0, y: graphicBounds.height/2 + labelMargin + verticalPadding + labelBounds.height/2};
            break;
        
        case 'left':
            labelPosition = {x: -graphicBounds.width/2 - labelMargin - horizontalPadding - labelBounds.width/2, y: 0};
            break;
        
        default:
            // Leave an error message and then default to center.
            this['constellation'].error('Unexpected value for node labelPosition property. value=' + this.getStyle('labelPosition'));
        case 'center':
            labelPosition = {x: 0, y: 0};
    }
    svg.change(this.renderer.label, labelPosition);
    labelBounds = this.renderer.label.getBBox();
    
    var labelBackground = jQuery(this.renderer.labelBackground);
    if (this.getStyle('labelBoxEnabled')
        && labelBounds.width > 0
        && labelBounds.height > 0) {
        labelBackground.css('display', 'inline');
        labelBackground.attr('x', labelBounds.x - horizontalPadding);
        labelBackground.attr('y', labelBounds.y - verticalPadding);
        labelBackground.attr('width', labelBounds.width + 2*horizontalPadding);
        labelBackground.attr('height', labelBounds.height + 2*verticalPadding);

        svg.change(this.renderer.labelBackground, {
            'fill': this.getStyle('labelBoxFillColor'),
            'stroke': this.getStyle('labelBoxLineColor')
        });
    
    }
    else {
        labelBackground.css('display', 'none');
    }

    this.position();

    this.label = label;
    this.graphicSize = graphicSize;
    this.graphicShape = graphicShape;
    //this.prevLeftIconUrl = prevLeftIconUrl;
    //this.prevRightIconUrl = prevRightIconUrl;
};
DefaultNodeRenderer.prototype["draw"] = DefaultNodeRenderer.prototype.draw;

DefaultNodeRenderer.prototype.position = function() {
    jQuery(this.renderer.group)
        .attr('transform', 'translate(' + this['x'] + ',' + this['y'] + ')' + 
            'rotate(' + (-this['constellation'].rotation * 180/Math.PI) + ')');
};
DefaultNodeRenderer.prototype["position"] = DefaultNodeRenderer.prototype.position;

DefaultNodeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.group).remove();
    this.renderer = null;
};
DefaultNodeRenderer.prototype["destroy"] = DefaultNodeRenderer.prototype.destroy;

/**
 * Node renderer based on Gephi.
 * FIXME: Finish implementing the GephiNodeRenderer.
 * 
 * @see http://gephi.org
 * @param constellation
 * @param nodeId
 * @param data
 * @returns {GephiNodeRenderer}
 * @constructor
 */
GephiNodeRenderer = function(constellation, nodeId, data) {
    NodeRenderer.call(this, constellation, nodeId, data);
    
    this.label = '';
    this.size = 0;
};
window["GephiNodeRenderer"] = GephiNodeRenderer;

GephiNodeRenderer.prototype = new NodeRenderer();
GephiNodeRenderer.prototype.constructor = GephiNodeRenderer;

GephiNodeRenderer.prototype.defaultStyles = {
    'label': '',
    'r': 255,
    'g': 255,
    'b': 255,
    'size': 5
};

GephiNodeRenderer.prototype.create = function(){
    var svg = this['constellation']['svg'];
    var container = this['constellation'].getNodeContainer();
    
    var group = svg.group(container, {'display': 'none'});
    var graphicContainer = svg.group(group);
    this.renderer = {
        group: group,
        graphicContainer: graphicContainer,
        graphic: svg.circle(graphicContainer, 0, 0, this.size/2, {'strokeWidth': 3}),
        label: svg.text(group, 0, 0, '', {
            'style': '-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-o-user-select: none;user-select: none;',
            'fontFamily': 'Verdana',
            'fontSize': 12,
            'fontWeight': 'normal',
            'fill': '#333333',
            'textAnchor': 'left',
            
            // HACK: Better cross-browser compatibility with 'dy'
            //dominantBaseline: 'central'
            'dy': '.35em'
        })
    };
    
    jQuery(this.renderer.group)
        .bind('mouseover', {'context':this}, function(event) {
            event.data.context['constellation']['nodemouseoverHandler'](event, event.data.context);
        })
        .bind('mouseout', {'context':this}, function(event) {
            event.data.context['constellation']['nodemouseoutHandler'](event, event.data.context);
        })
        .bind('mousedown', {'context':this}, function(event) {
            event.data.context['constellation']['nodemousedownHandler'](event, event.data.context);
        })
        .bind('mouseup', {'context':this}, function(event) {
            event.data.context['constellation']['nodemouseupHandler'](event, event.data.context);
        })
        .bind('click', {'context':this}, function(event) {
            event.data.context['constellation']['nodeclickHandler'](event, event.data.context);
        })
        .bind('touchstart', {'context':this}, function(event) {
            event.data.context['constellation']['nodetouchstartHandler'](event, event.data.context);
        })
        .bind('touchend', {'context':this}, function(event) {
            event.data.context['constellation']['nodetouchendHandler'](event, event.data.context);
        });
};
GephiNodeRenderer.prototype["create"] = GephiNodeRenderer.prototype.create;

GephiNodeRenderer.prototype.draw = function() {
    var svg = this['constellation']['svg'];

    // Update the display at the beginning of the draw call so getBBox doesn't fail in Firefox.
    jQuery(this.renderer.group).css('display', 'inline');
    
    var graphicSettings = {
        'fill': '#' + (this.getStyle('b') | this.getStyle('g') << 8 | this.getStyle('r') << 16).toString(16),
        'stroke': '#333333'
    };
    
    var label = this.getStyle('label');
    var size = this.getStyle('size');
    
    if (this.size != size) {
        // Size changed so we need to adjust the graphic position and dimensions.
        graphicSettings['r'] = size/2;
        svg.change(this.renderer.graphic, graphicSettings);
        
        svg.change(this.renderer.label, {'x': size/2 + 10});
    }
    else {
        // No size change but we still need to update other settings.
        svg.change(this.renderer.graphic, graphicSettings);
    }
    
    if (this.label != label) {
        jQuery(this.renderer.label)
            .contents().remove().end()
            .append(label);
    }
    
    this.position();

    this.label = label;
    this.size = size;
};
GephiNodeRenderer.prototype["draw"] = GephiNodeRenderer.prototype.draw;

GephiNodeRenderer.prototype.position = function() {
    jQuery(this.renderer.group)
        .attr('transform', 'translate(' + this['x'] + ',' + this['y'] + ')' + 
            'rotate(' + (-this['constellation'].rotation * 180/Math.PI) + ')');
};
GephiNodeRenderer.prototype["position"] = GephiNodeRenderer.prototype.position;

GephiNodeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.group).remove();
    this.renderer = null;
};
GephiNodeRenderer.prototype["destroy"] = GephiNodeRenderer.prototype.destroy;


/**
 * 
 * @param constellation
 * @param edgeId
 * @param tailNodeRenderer
 * @param headNodeRenderer
 * @param data
 * @returns {EdgeRenderer}
 * @constructor
 */
EdgeRenderer = function(constellation, edgeId, tailNodeRenderer, headNodeRenderer, data) {
    this['constellation'] = constellation;
    this['classes'] = [];
    
    Edge.call(this, edgeId, tailNodeRenderer, headNodeRenderer, data);
    this.dataChanged();
};
window["EdgeRenderer"] = EdgeRenderer;

EdgeRenderer.prototype = new Edge();
EdgeRenderer.prototype.constructor = EdgeRenderer;

EdgeRenderer.prototype.defaultStyles = {};

EdgeRenderer.prototype.getStyle = function(propertyName) {
    return this['constellation'].getStyle('edge', this['classes'], propertyName, this['data'], this.defaultStyles);
};
EdgeRenderer.prototype["getStyle"] = EdgeRenderer.prototype.getStyle;

// FIXME: Duplicates NodeRenderer class methods. Factor this out.
EdgeRenderer.prototype.addClass = function(className) {
    if (jQuery.inArray(className, this['classes']) < 0) {
        this['classes'].push(className);
    }
};
EdgeRenderer.prototype["addClass"] = EdgeRenderer.prototype.addClass;

EdgeRenderer.prototype.hasClass = function(className) {
    return jQuery.inArray(className, this['classes']) >= 0;
};
EdgeRenderer.prototype["hasClass"] = EdgeRenderer.prototype.hasClass;

EdgeRenderer.prototype.removeClass = function(className) {
    var index;
    while ((index = jQuery.inArray(className, this['classes'])) >= 0) {
        this['classes'].splice(index, 1);
    }
};
EdgeRenderer.prototype["removeClass"] = EdgeRenderer.prototype.removeClass;

EdgeRenderer.prototype.dataChanged = function() {
    Edge.prototype.dataChanged.call(this);

    if (this['data']['class']) {
        this['classes'] = [];
        var classes = this['data']['class'].split(/\s/);
        for (var i = 0; i < classes.length; i++) {
            this.addClass(classes[i]);
        }
    }
};
EdgeRenderer.prototype["dataChanged"] = EdgeRenderer.prototype.dataChanged;

EdgeRenderer.prototype.create = function() {};
EdgeRenderer.prototype["create"] = EdgeRenderer.prototype.create;

EdgeRenderer.prototype.draw = function() {};
EdgeRenderer.prototype["draw"] = EdgeRenderer.prototype.draw;

EdgeRenderer.prototype.destroy = function() {};
EdgeRenderer.prototype["destroy"] =EdgeRenderer.prototype.destroy;


/**
 * 
 * @param constellation
 * @param edgeId
 * @param tailNodeRenderer
 * @param headNodeRenderer
 * @param data
 * @returns {DefaultEdgeRenderer}
 * @constructor
 */
DefaultEdgeRenderer = function(constellation, edgeId, tailNodeRenderer, headNodeRenderer, data) {
    EdgeRenderer.call(this, constellation, edgeId, tailNodeRenderer, headNodeRenderer, data);
};
window["DefaultEdgeRenderer"] = DefaultEdgeRenderer;

DefaultEdgeRenderer.prototype = new EdgeRenderer();
DefaultEdgeRenderer.prototype.constructor = DefaultEdgeRenderer;

DefaultEdgeRenderer.prototype.defaultStyles = {
    'edgeLineColor': '#000000',
    'edgeLineThickness': 1,
    
    'arrowhead': true,
    'bidirectional': false,
    'reverse': false
};

DefaultEdgeRenderer.prototype.create = function() {
    var svg = this['constellation']['svg'];
    var container = this['constellation'].getEdgeContainer();
    this.renderer = {
        line: svg.line(container, 0, 0, 10, 0, {
            'display': 'none',
            'stroke': this.getStyle('edgeLineColor'),
            'strokeWidth': this.getStyle('edgeLineThickness')
        })
    };
    
    jQuery(this.renderer.line)
        .bind('mouseover', {'context':this}, function(event) {
            event.data.context['constellation']['edgemouseoverHandler'](event, event.data.context);
        })
        .bind('mouseout', {'context':this}, function(event) {
            event.data.context['constellation']['edgemouseoutHandler'](event, event.data.context);
        })
        .bind('mousedown', {'context':this}, function(event) {
            event.data.context['constellation']['edgemousedownHandler'](event, event.data.context);
        })
        .bind('mouseup', {'context':this}, function(event) {
            event.data.context['constellation']['edgemouseupHandler'](event, event.data.context);
        })
        .bind('click', {'context':this}, function(event) {
            event.data.context['constellation']['edgeclickHandler'](event, event.data.context);
        })
        .bind('touchstart', {'context':this}, function(event) {
            event.data.context['constellation']['edgetouchstartHandler'](event, event.data.context);
        })
        .bind('touchend', {'context':this}, function(event) {
            event.data.context['constellation']['edgetouchendHandler'](event, event.data.context);
        });
};
DefaultEdgeRenderer.prototype["create"] = DefaultEdgeRenderer.prototype.create;

DefaultEdgeRenderer.prototype.draw = function() {
    jQuery(this.renderer.line)
        .attr('x1', this['tailNode']['x'])
        .attr('y1', this['tailNode']['y'])
        .attr('x2', this['headNode']['x'])
        .attr('y2', this['headNode']['y'])
        .css('stroke', this.getStyle('edgeLineColor'))
        .css('strokeWidth', this.getStyle('edgeLineThickness'))
        .css('display', 'inline');
};
DefaultEdgeRenderer.prototype["draw"] = DefaultEdgeRenderer.prototype.draw;

DefaultEdgeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.line).remove();
};
DefaultEdgeRenderer.prototype["destroy"] = DefaultEdgeRenderer.prototype.destroy;


/**
 * Instantiates a Constellation data visualization with the given configuration.
 * @param {Object} config
 * @constructor
 */
Constellation = function(config, styles){
    // Extend the default configuration.
    this['config'] = jQuery.extend(true, this.defaultConfig, config);
    
    // Replace the default styles.
    this.styles = styles ? styles : this.defaultStyles;
    
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
    
    var p = this['config']['zoomSlider'];
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
    'graphParserClass': GraphMlParser,
    'graphParser': {
    },
    'graphViewClass': TreeGraphView,
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
    jQuery(this).trigger('nodeselect');
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
    jQuery(this).trigger('edgeselect');
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
    var id = this['config']['id'];
    jQuery('#' + id + ' .zoomSlider').slider('option', 'value', this.zoomScale);
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

    var touchMetadata = this.touchMetadata['_mouse'] = {
        isTouch: false,
        node: node,
        touch: event,
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
    if (touchMetadata && (new Date()).getTime() - touchMetadata.timestamp < 300) {
        jQuery(this).trigger('nodeclick', node['id']);
    }

    delete this.touchMetadata['_mouse'];
};
Constellation.prototype['nodeclickHandler'] = Constellation.prototype.nodeclickHandler;
Constellation.prototype.nodetouchstartHandler = function(event, node){
    event.stopPropagation();
    event.preventDefault();

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

        if (touchMetadata && (new Date()).getTime() - touchMetadata.timestamp < 300) {
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
        timestamp: (new Date()).getTime()
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
    if (touchMetadata && (new Date()).getTime() - touchMetadata.timestamp < 300) {
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
        timestamp: (new Date()).getTime()
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

    if (touchMetadata && (new Date()).getTime() - touchMetadata.timestamp < 300) {
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
        
        if (touchMetadata &&
                (new Date()).getTime() - touchMetadata.timestamp < 300) {
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
