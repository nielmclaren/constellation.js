CustomGraphLoader = function(config) {
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0)
		return;

	GraphLoader.call(this, config);

	this.lastfm = new LastFM({
		apiKey : config.lastfm_api_key,
		apiSecret : config.lastfm_api_secret,
		cache : new LastFMCache()
	});
};

CustomGraphLoader.prototype = new GraphLoader();
CustomGraphLoader.prototype.constructor = CustomGraphLoader;

CustomGraphLoader.prototype.setConstellation = function(constellation) {
	GraphLoader.prototype.setConstellation.call(this, constellation);

	jQuery(this.constellation).bind('nodeselect', {
		context : this
	}, function(event) {
		var context = event.data.context;
		var lastfm = context.lastfm;
		var parser = context.parser;
		
		var rootNodeId = context.constellation.getSelectedNodeId();
		var rootNode = context.constellation.getNode(rootNodeId);
		if (!rootNode || rootNode.data.depthLoaded < 3) {
			lastfm.artist.getInfo({artist: rootNodeId}, {success: function(data) {
				parser.parse(data, 3);
				
				jQuery.each(data.artist.similar.artist, function(i, d) {
					lastfm.artist.getInfo({artist: d.name}, {success: function(data) {
						parser.parse(data, 2);
					}});
				});
			}});
		}
	});
};

CustomGraphParser = function(config) {
	// Constructor with no arguments is used for subclasses.
	if (arguments.length <= 0)
		return;

	GraphParser.call(this, config);
};

CustomGraphParser.prototype = new GraphParser();
CustomGraphParser.prototype.constructor = CustomGraphParser;

CustomGraphParser.prototype.parse = function(data, depth) {
	var graph = this.graph;
	var parser = this;

	var rootNodeId = data.artist.name;
	var rootNode = graph.getNode(rootNodeId);
	if (!rootNode) {
		rootNode = graph.addNode(rootNodeId, parser.parseNodeData(data.artist));
	}
	rootNode.data.depthLoaded = isNaN(rootNode.data.depthLoaded) || rootNode.data.depthLoaded < depth ? depth : rootNode.data.depthLoaded
	rootNode.dataChanged();

	jQuery.each(data.artist.similar.artist, function(i, d) {
		var nodeId = d.name;
		
		var n = graph.getNode(nodeId);
		if (!n) {
			n = graph.addNode(nodeId, parser.parseNodeData(d));
		}
		
		n.data.depthLoaded = isNaN(n.data.depthLoaded) || n.data.depthLoaded < depth - 1 ? depth - 1 : n.data.depthLoaded;
		n.dataChanged();
		
		var nodeIds = [rootNodeId, nodeId];
		nodeIds.sort();
		var edgeId = nodeIds.join(' * ');
		
		var e = graph.getEdge(edgeId);
		if (!e) {
			e = graph.addEdge(edgeId, nodeIds[0], nodeIds[1]);
		}
	});

	jQuery(this).trigger('complete');
};

CustomGraphParser.prototype.parseNodeData = function(artist) {
	return {
		image: artist.image,
		name: artist.name,
		listeners: artist.stats ? artist.stats.listeners : -1,
		playcount: artist.stats ? artist.stats.playcount : -1,
		url: artist.url
	};
};


CustomNodeRenderer = function(constellation, nodeId, data) {
	NodeRenderer.call(this, constellation, nodeId, data);
};

CustomNodeRenderer.prototype = new NodeRenderer();
CustomNodeRenderer.prototype.constructor = CustomNodeRenderer;

CustomNodeRenderer.prototype.create = function(){
	var svg = this.constellation.svg;
	var container = this.constellation.getNodeContainer();
	
	var group = svg.group(container, {'display': 'none'});
	this.renderer = {
		group: group,
		graphic: svg.rect(group, -22, -22, 44, 44, {'fill': '#eeeeee', 'stroke': '#999999'}),
		imageContainer: svg.group(group),
		image: null,
		labelBackground: svg.rect(group, 0, 0, 0, 0, 2, 2, {
			'fill': '#ffffcc',
			'stroke': '#333333',
			'strokeWidth': 1
		}),
		label: svg.text(group, 0, 24, '', {
			'style': '-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-o-user-select: none;user-select: none;',
			'fontFamily': 'Verdana',
			'fontSize': 12,
			'fontWeight': 'normal',
			'fill': '#333333',
			'textAnchor': 'middle',
			
			// HACK: Better cross-browser compatibility with 'dy'
			//dominantBaseline: 'central'
			'dy': '.35em'
		})
	};
	
	jQuery(this.renderer.group)
		.bind('mouseover', {'context':this}, function(event) {
			event.data.context.constellation.nodemouseoverHandler(event, event.data.context);
		})
		.bind('mouseout', {'context':this}, function(event) {
			event.data.context.constellation.nodemouseoutHandler(event, event.data.context);
		})
		.bind('mousedown', {'context':this}, function(event) {
			event.data.context.mouseDownTime = (new Date()).getTime();
			event.data.context.constellation.nodemousedownHandler(event, event.data.context);
		})
		.bind('mouseup', {'context':this}, function(event) {
			event.data.context.constellation.nodemouseupHandler(event, event.data.context);
		})
		.bind('click', {'context':this}, function(event) {
			if ((new Date()).getTime() - event.data.context.mouseDownTime < 300) {
				event.data.context.constellation.nodeclickHandler(event, event.data.context);
			}
		})
		.bind('touchstart', {'context':this}, function(event) {
			event.data.context.constellation.nodetouchstartHandler(event, event.data.context);
		})
		.bind('touchend', {'context':this}, function(event) {
			event.data.context.constellation.nodetouchendHandler(event, event.data.context);
		});
};

CustomNodeRenderer.prototype.draw = function() {
	var svg = this.constellation.svg;

	// Update the display at the beginning of the draw call so getBBox doesn't fail in Firefox.
	jQuery(this.renderer.group).css('display', 'inline');
	
	if (this.data.image) {
		if (this.renderer.image) {
			svg.remove(this.renderer.image);
		}
		this.renderer.image = svg.image(this.renderer.imageContainer, -20, -20, 40, 40, this.data.image[0]['#text']);
	}
	
	var label = this.data.name;
	
	jQuery(this.renderer.label)
		.contents().remove().end()
		.append(label);
	
	var labelBounds = this.renderer.label.getBBox();
	var horizontalPadding = 8, verticalPadding = 3;
	
	var labelBackground = jQuery(this.renderer.labelBackground);
	if (labelBounds.width > 0 && labelBounds.height > 0) {
		labelBackground.css('display', 'inline');
		labelBackground.attr('x', labelBounds.x - horizontalPadding);
		labelBackground.attr('y', labelBounds.y - verticalPadding);
		labelBackground.attr('width', labelBounds.width + 2*horizontalPadding);
		labelBackground.attr('height', labelBounds.height + 2*verticalPadding);
	}
	else {
		labelBackground.css('display', 'none');
	}

	this.position();
};

CustomNodeRenderer.prototype.position = function() {
	jQuery(this.renderer.group)
		.attr('transform', 'translate(' + this['x'] + ',' + this['y'] + ')' + 
			'rotate(' + (-this['constellation'].rotation * 180/Math.PI) + ')');
};

CustomNodeRenderer.prototype.destroy = function() {
	jQuery(this.renderer.group).remove();
	this.renderer = null;
};


CustomEdgeRenderer = function(constellation, edgeId, tailNodeRenderer, headNodeRenderer, data) {
	EdgeRenderer.call(this, constellation, edgeId, tailNodeRenderer, headNodeRenderer, data);
};

CustomEdgeRenderer.prototype = new EdgeRenderer();
CustomEdgeRenderer.prototype.constructor = CustomEdgeRenderer;

CustomEdgeRenderer.prototype.defaultStyles = {
		
};

CustomEdgeRenderer.prototype.create = function() {
	var svg = this.constellation.svg;
	var container = this.constellation.getEdgeContainer();
	this.renderer = {
		line: svg.line(container, 0, 0, 10, 0, {
			'display': 'none',
			'stroke': '#999999',
			'strokeWidth': 5
		})
	};
	
	jQuery(this.renderer.line)
		.bind('mouseover', {'context':this}, function(event) {
			event.data.context.constellation.edgemouseoverHandler(event, event.data.context);
		})
		.bind('mouseout', {'context':this}, function(event) {
			event.data.context.constellation.edgemouseoutHandler(event, event.data.context);
		})
		.bind('mousedown', {'context':this}, function(event) {
			event.data.context.constellation.edgemousedownHandler(event, event.data.context);
		})
		.bind('mouseup', {'context':this}, function(event) {
			event.data.context.constellation.edgemouseupHandler(event, event.data.context);
		})
		.bind('click', {'context':this}, function(event) {
			event.data.context.constellation.edgeclickHandler(event, event.data.context);
		});
};

CustomEdgeRenderer.prototype.draw = function() {
	jQuery(this.renderer.line)
		.attr('x1', this['tailNode']['x'])
		.attr('y1', this['tailNode']['y'])
		.attr('x2', this['headNode']['x'])
		.attr('y2', this['headNode']['y'])
		.css('display', 'inline');
};

CustomEdgeRenderer.prototype.destroy = function() {
	jQuery(this.renderer.line).remove();
};

