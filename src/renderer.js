
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

NodeRenderer.prototype['defaultStyles'] = {};

NodeRenderer.prototype.getStyle = function(propertyName) {
	return this['constellation'].getStyle('node', this['classes'], propertyName, this['data'], this['defaultStyles']);
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
	this.tooltip = null;
	this.graphicShape = null;
	this.graphicSize = null;
	this.graphicImageUrl = null;
	this.leftIconUrl = null;
	this.rightIconUrl = null;
};
window["DefaultNodeRenderer"] = DefaultNodeRenderer;

DefaultNodeRenderer.prototype = new NodeRenderer();
DefaultNodeRenderer.prototype.constructor = DefaultNodeRenderer;

DefaultNodeRenderer.prototype['defaultStyles'] = {
	'label': '',
	'tooltip': '',

	'cursor': 'default',
	
	'graphicShape': 'circle',
	'graphicFillColor': '#ffffff',
	'graphicLineColor': '#000000',
	'graphicSize': 40,
	
	'leftIconUrl': null,
	'leftIconWidth': 16,
	'leftIconHeight': 16,

	'rightIconUrl': null,
	'rightIconWidth': 16,
	'rightIconHeight': 16,
	
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
		labelBox: svg.rect(group, 0, 0, 0, 0, 2, 2, {
			'preserveAspectRatio': 'none',
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
			'dy': '.35em'
		}),
		leftIcon: null,
		rightIcon: null,
		tooltip: svg.title(group, '')
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
	var tooltip = this.getStyle('tooltip');
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
	var horizontalPadding = 8, verticalPadding = 3, iconPadding = 5;

	var graphicBounds = this.renderer.graphic ? this.renderer.graphic.getBBox() : {width: 0, height: 0};
	var labelBounds = this.renderer.label.getBBox();

	var leftIconUrl = this.getStyle('leftIconUrl');
	if (leftIconUrl == '') leftIconUrl = null;
	var leftIconBounds = {
		width: this.getStyle('leftIconWidth'),
		height: this.getStyle('leftIconHeight')
	};

	var rightIconUrl = this.getStyle('rightIconUrl');
	if (rightIconUrl == '') rightIconUrl = null;
	var rightIconBounds = {
		width: this.getStyle('rightIconWidth'),
		height: this.getStyle('rightIconHeight')
	};

	// The smallest rectangle containing the label and icons. Padding not included.
	var contentBounds = {
		width: (leftIconUrl ? leftIconBounds.width + iconPadding : 0)
			+ labelBounds.width
			+ (rightIconUrl ? iconPadding + rightIconBounds.width : 0),
		height: Math.max(
			leftIconUrl ? leftIconBounds.height : 0,
			labelBounds.height,
			rightIconUrl ? rightIconBounds.height : 0)
	};

	switch (this.getStyle('labelPosition')) {
		case 'top':
			contentBounds.x = -contentBounds.width/2;
			contentBounds.y = -graphicBounds.height/2 - labelMargin - verticalPadding - contentBounds.height;
			break;
		
		case 'right':
			contentBounds.x = graphicBounds.width/2 + labelMargin + horizontalPadding;
			contentBounds.y = -contentBounds.height/2;
			break;
		
		case 'bottom':
			contentBounds.x = -contentBounds.width/2;
			contentBounds.y = graphicBounds.height/2 + labelMargin + verticalPadding;
			break;
		
		case 'left':
			contentBounds.x = -graphicBounds.width/2 - labelMargin - horizontalPadding - contentBounds.width;
			contentBounds.y = -contentBounds.height/2;
			break;
		
		default:
			// Leave an error message and then default to center.
			this['constellation'].error('Unexpected value for node labelPosition property. value=' + this.getStyle('labelPosition'));
		case 'center':
			contentBounds.x = -contentBounds.width/2;
			contentBounds.y = -contentBounds.height/2;
	}

	labelBounds.x = contentBounds.x + (leftIconUrl ? leftIconBounds.width + iconPadding : 0);
	labelBounds.y = contentBounds.y + (contentBounds.height - labelBounds.height) / 2;

	if (this.getStyle('labelBoxEnabled')
		&& labelBounds.width > 0
		&& labelBounds.height > 0) {

		var cornerRadius = this.getStyle('labelBoxCornerRadius');

		jQuery(this.renderer.labelBox)
			.css('display', 'inline')
			.attr('x', contentBounds.x - horizontalPadding)
			.attr('y', contentBounds.y - verticalPadding)
			.attr('width', contentBounds.width + horizontalPadding * 2)
			.attr('height', contentBounds.height + verticalPadding * 2)
			.attr('rx', cornerRadius)
			.attr('ry', cornerRadius);

		svg.change(this.renderer.labelBox, {
			'fill': this.getStyle('labelBoxFillColor'),
			'stroke': this.getStyle('labelBoxLineColor')
		});
	}
	else {
		jQuery(this.renderer.labelBox).css('display', 'none');
	}

	svg.change(this.renderer.label, {x: labelBounds.x + labelBounds.width/2, y: labelBounds.y + labelBounds.height/2});

	leftIconBounds.x = contentBounds.x;
	leftIconBounds.y = contentBounds.y + (contentBounds.height - leftIconBounds.height) / 2;
	if (leftIconUrl != this.leftIconUrl) {
		if (this.leftIconUrl == null) {
			this.renderer.leftIcon = svg.image(
				this.renderer.group, leftIconBounds.x, leftIconBounds.y, leftIconBounds.width, leftIconBounds.height, leftIconUrl);
		}
		else {
			if (leftIconUrl == null) {
				svg.remove(this.renderer.leftIcon);
				this.renderer.leftIcon = null;
			}
			else {
				svg.change(this.renderer.leftIcon, jQuery.extend(leftIconBounds, {'xlink:href': leftIconUrl}));
			}
		}
	}
	else {
		svg.change(this.renderer.leftIcon, leftIconBounds);
	}

	rightIconBounds.x = contentBounds.x + contentBounds.width - rightIconBounds.width;
	rightIconBounds.y = contentBounds.y + (contentBounds.height - rightIconBounds.height) / 2;
	if (rightIconUrl != this.rightIconUrl) {
		if (this.rightIconUrl == null) {
			this.renderer.rightIcon = svg.image(
				this.renderer.group, rightIconBounds.x, rightIconBounds.y, rightIconBounds.width, rightIconBounds.height, rightIconUrl);
		}
		else {
			if (rightIconUrl == null) {
				svg.remove(this.renderer.rightIcon);
				this.renderer.rightIcon = null;
			}
			else {
				svg.change(this.renderer.rightIcon, jQuery.extend(rightIconBounds, {'xlink:href': rightIconUrl}));
			}
		}
	}
	else {
		svg.change(this.renderer.rightIcon, rightIconBounds);
	}
	
	if (this.tooltip != tooltip) {
		jQuery(this.renderer.tooltip)
			.contents().remove().end()
			.append(tooltip);
	}

	jQuery(this.renderer.group).css('cursor', this.getStyle('cursor'));

	this.position();

	this.label = label;
	this.tooltip = tooltip;
	this.graphicSize = graphicSize;
	this.graphicShape = graphicShape;
	this.leftIconUrl = leftIconUrl;
	this.rightIconUrl = rightIconUrl;
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

DefaultNodeRenderer.prototype.getCenterToEdgeVector = function(angle) {
	// FIXME: Implement for other shapes.
	var graphicVector;
	switch (this.graphicShape) {
		case 'circle':
			graphicVector = {x: Math.cos(angle) * this.graphicSize/2, y: Math.sin(angle) * this.graphicSize/2};
			break;
		default:
			graphicVector = {x: 0, y: 0};
	}
	graphicVector.length = Math.sqrt(graphicVector.x * graphicVector.x   +   graphicVector.y * graphicVector.y);

	var labelBoxVector = {x: 0, y: 0};
	if (this.getStyle('labelPosition') == 'center'
		&& this.getStyle('labelBoxEnabled')) {
		var labelBoxBounds = this.renderer.labelBox.getBBox();
		var len = Math.min(
			Math.abs(labelBoxBounds.width / 2 / Math.cos(angle)),
		  Math.abs(labelBoxBounds.height / 2 / Math.sin(angle)));
		labelBoxVector = {x: len * Math.cos(angle), y: len * Math.sin(angle)};
	}
	labelBoxVector.length = Math.sqrt(labelBoxVector.x * labelBoxVector.x   +   labelBoxVector.y * labelBoxVector.y);

	return labelBoxVector.length > graphicVector.length ? labelBoxVector : graphicVector;
};

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

GephiNodeRenderer.prototype['defaultStyles'] = {
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

EdgeRenderer.prototype['defaultStyles'] = {};

EdgeRenderer.prototype.getStyle = function(propertyName) {
	return this['constellation'].getStyle('edge', this['classes'], propertyName, this['data'], this['defaultStyles']);
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

EdgeRenderer.prototype.position = function() {};
EdgeRenderer.prototype["position"] = EdgeRenderer.prototype.position;

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
	
	// Keep track of state to optimize redraw.
	this.tooltip = null;
};
window["DefaultEdgeRenderer"] = DefaultEdgeRenderer;

DefaultEdgeRenderer.prototype = new EdgeRenderer();
DefaultEdgeRenderer.prototype.constructor = DefaultEdgeRenderer;

DefaultEdgeRenderer.prototype['defaultStyles'] = {
	'edgeLineColor': '#000000',
	'edgeLineThickness': 1,

	'tooltip': '',
	'cursor': 'default',
	
	'arrowhead': false,
	'bidirectional': false,
	'reverse': false
};

DefaultEdgeRenderer.prototype.create = function() {
	var svg = this['constellation']['svg'];
	var container = this['constellation'].getEdgeContainer();

	var group = svg.group(container);
	this.renderer = {
		group: group,
		line: svg.line(group, 0, 0, 10, 0, {
			'stroke': this.getStyle('edgeLineColor'),
			'strokeWidth': this.getStyle('edgeLineThickness')
		}),
		arrowhead: null,
		reverseArrowhead: null,
		tooltip: svg.title(group, '')
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
	var svg = this['constellation']['svg'];

	var lineColor = this.getStyle('edgeLineColor');
	var thickness = this.getStyle('edgeLineThickness');
	var arrowhead = this.getStyle('arrowhead');
	var reverse = this.getStyle('reverse');
	var bidirectional = this.getStyle('bidirectional');

	var tx = this['tailNode']['x'];
	var ty = this['tailNode']['y'];
	var hx = this['headNode']['x'];
	var hy = this['headNode']['y'];

	// Delta.
	var dx = hx - tx;
	var dy = hy - ty;
	var d = Math.sqrt(dx * dx   +   dy * dy);

	if (d == 0) {
		jQuery(this.renderer.group).css('display', 'none');

		if (this.renderer.arrowhead) {
			this.renderer.arrowhead.remove();
			this.renderer.arrowhead = null;
		}
		if (this.renderer.reverseArrowhead) {
			this.renderer.reverseArrowhead.remove();
			this.renderer.reverseArrowhead = null;
		}
	}
	else {
		// Normal.
		var nx = dx / d;
		var ny = dy / d;

		// Midpoint.
		var mx = tx + dx/2;
		var my = ty + dy/2;

		var a = Math.atan2(dy, dx);

		var tCenterToEdge = this['tailNode']['getCenterToEdgeVector'] ?
			this['tailNode']['getCenterToEdgeVector'](a) : {x: 0, y: 0};
		tCenterToEdge.length = Math.sqrt(tCenterToEdge.x * tCenterToEdge.x   +   tCenterToEdge.y * tCenterToEdge.y);
		var hCenterToEdge = this['headNode']['getCenterToEdgeVector']
			? this['headNode']['getCenterToEdgeVector'](a + Math.PI) : {x: 0, y: 0};
		hCenterToEdge.length = Math.sqrt(hCenterToEdge.x * hCenterToEdge.x   +   hCenterToEdge.y * hCenterToEdge.y);

		// The endpoints of the edge at each node.
		var tailEnd = {x: tx, y: ty};
		var headEnd = {x: hx, y: hy};

		if (d < tCenterToEdge.length + hCenterToEdge.length) {
			// Nodes are overlapping so don't draw the edge.
			jQuery(this.renderer.group).css('display', 'none');

			if (this.renderer.arrowhead) {
				this.renderer.arrowhead.remove();
				this.renderer.arrowhead = null;
			}
			if (this.renderer.reverseArrowhead) {
				this.renderer.reverseArrowhead.remove();
				this.renderer.reverseArrowhead = null;
			}
		}
		else {
			var edgeLength = d - tCenterToEdge.length - hCenterToEdge.length;
			var arrowLength = Math.min(Math.max(15, thickness * 6), 0.4 * edgeLength);
			var arrowWidth = 0.4 * arrowLength;

			if (arrowhead) {
				if (bidirectional || !reverse) {
					// Tail to head arrowhead.
					headEnd.x += hCenterToEdge.x - nx * arrowLength;
					headEnd.y += hCenterToEdge.y - ny * arrowLength;

					if (!this.renderer.arrowhead) {
						this.renderer.arrowhead = svg.polygon(this.renderer.group, [[0,0]], {'strokeWidth': 0});
					}

					jQuery(this.renderer.arrowhead)
						.attr('points', this.getPointsString(
							[headEnd.x - ny * arrowWidth/2, headEnd.y + nx * arrowWidth/2],
							[headEnd.x + nx * arrowLength, headEnd.y + ny * arrowLength],
							[headEnd.x + ny * arrowWidth/2, headEnd.y - nx * arrowWidth/2]
						))
						.css('fill', lineColor);
				}
				else if (this.renderer.arrowhead) {
					this.renderer.arrowhead.remove();
					this.renderer.arrowhead = null;
				}

				if (bidirectional || reverse) {
					// Head to tail arrowhead.
					tailEnd.x += tCenterToEdge.x + nx * arrowLength;
					tailEnd.y += tCenterToEdge.y + ny * arrowLength;

					if (!this.renderer.reverseArrowhead) {
						this.renderer.reverseArrowhead = svg.polygon(this.renderer.group, [[0,0]], {'strokeWidth': 0});
					}

					jQuery(this.renderer.reverseArrowhead)
						.attr('points', this.getPointsString(
							[tailEnd.x - ny * arrowWidth/2, tailEnd.y + nx * arrowWidth/2],
							[tailEnd.x - nx * arrowLength, tailEnd.y - ny * arrowLength],
							[tailEnd.x + ny * arrowWidth/2, tailEnd.y - nx * arrowWidth/2]
						))
						.css('fill', lineColor);
				}
				else if (this.renderer.reverseArrowhead) {
					this.renderer.reverseArrowhead.remove();
					this.renderer.reverseArrowhead = null;
				}
			}
			else {
				if (this.renderer.arrowhead) {
					this.renderer.arrowhead.remove();
					this.renderer.arrowhead = null;
				}
				if (this.renderer.reverseArrowhead) {
					this.renderer.reverseArrowhead.remove();
					this.renderer.reverseArrowhead = null;
				}
			}

			jQuery(this.renderer.group)
				.css('display', 'inline');

			jQuery(this.renderer.line)
				.css('stroke', lineColor)
				.css('strokeWidth', thickness)
				.css('cursor', this.getStyle('cursor'))
				.attr('x1', tailEnd.x)
				.attr('y1', tailEnd.y)
				.attr('x2', headEnd.x)
				.attr('y2', headEnd.y);
		}
	}

	var tooltip = this.getStyle('tooltip');
	if (this.tooltip != tooltip) {
		jQuery(this.renderer.tooltip)
			.contents().remove().end()
			.append(tooltip);
	}

	this.tooltip = tooltip;
};
DefaultEdgeRenderer.prototype["draw"] = DefaultEdgeRenderer.prototype.draw;

DefaultEdgeRenderer.prototype.position = function() {
	// FIXME: Try to factor out unnecessary draw code.
	this.draw();
};
DefaultEdgeRenderer.prototype["position"] = DefaultEdgeRenderer.prototype.position;

DefaultEdgeRenderer.prototype.destroy = function() {
	jQuery(this.renderer.line).remove();

	if (this.renderer.arrowhead) {
		this.renderer.arrowhead.remove();
	}
	if (this.renderer.reverseArrowhead) {
		this.renderer.reverseArrowhead.remove();
	}
};
DefaultEdgeRenderer.prototype["destroy"] = DefaultEdgeRenderer.prototype.destroy;

DefaultEdgeRenderer.prototype.getPointsString = function() {
	var result = '';
	while (arguments.length > 0) {
		var p = Array.prototype.shift.call(arguments);
		result += ' ' + p[0] + ',' + p[1];
	}
	return result;
};
DefaultEdgeRenderer.prototype['getPointsString'] = DefaultEdgeRenderer.prototype.getPointsString;

