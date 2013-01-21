
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



