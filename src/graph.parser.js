
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

