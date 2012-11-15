
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
