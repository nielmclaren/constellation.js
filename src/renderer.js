
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

    Node.call(this, nodeId, data);
    
    if (!this['data']['classes']) {
        this['data']['classes'] = [];
    }
    
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
    return this['constellation'].getStyle('node', this['data']['classes'], propertyName, this['data'], this.defaultStyles);
};
NodeRenderer.prototype["getStyle"] = NodeRenderer.prototype.getStyle;

NodeRenderer.prototype.addClass = function(className) {
    if (jQuery.inArray(className, this['data']['classes']) < 0) {
        this['data']['classes'].push(className);
    }
};
NodeRenderer.prototype["addClass"] = NodeRenderer.prototype.addClass;

NodeRenderer.prototype.hasClass = function(className) {
    return jQuery.inArray(className, this['data']['classes']) >= 0;
};
NodeRenderer.prototype["hasClass"] = NodeRenderer.prototype.hasClass;

NodeRenderer.prototype.removeClass = function(className) {
    var index;
    while ((index = jQuery.inArray(className, this['data']['classes'])) >= 0) {
        this['data']['classes'].splice(index, 1);
    }
};
NodeRenderer.prototype["removeClass"] = NodeRenderer.prototype.removeClass;

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
};
window["DefaultNodeRenderer"] = DefaultNodeRenderer;

DefaultNodeRenderer.prototype = new NodeRenderer();
DefaultNodeRenderer.prototype.constructor = DefaultNodeRenderer;

DefaultNodeRenderer.prototype.defaultStyles = {
    
};

DefaultNodeRenderer.prototype.create = function(){
    var svg = this['constellation']['svg'];
    var container = this['constellation'].getNodeContainer();
    
    var group = svg.group(container, {'display': 'none'});
    this.renderer = {
        group: group,
        graphic: svg.circle(group, 0, 0, 30, {
            'fill': '#ffffff',
            'stroke': '#666666',
            'strokeWidth': 1
        }),
        labelBackground: svg.rect(group, 0, 0, 0, 0, 2, 2, {
            'fill': '#ffffcc',
            'stroke': '#333333',
            'strokeWidth': 1
        }),
        label: svg.text(group, 0, 0, this['data']['label'], {
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
        });
};
DefaultNodeRenderer.prototype["create"] = DefaultNodeRenderer.prototype.create;

DefaultNodeRenderer.prototype.draw = function() {
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
    
    jQuery(this.renderer.group).css('display', 'inline');
};
DefaultNodeRenderer.prototype["draw"] = DefaultNodeRenderer.prototype.draw;

DefaultNodeRenderer.prototype.position = function() {
    jQuery(this.renderer.group)
        .attr('transform', 'translate(' + this['x'] + ',' + this['y'] + ')');
};
DefaultNodeRenderer.prototype["position"] = DefaultNodeRenderer.prototype.position;

DefaultNodeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.group).remove();
    this.renderer = null;
};
DefaultNodeRenderer.prototype["destroy"] = DefaultNodeRenderer.prototype.destroy;

/**
 * 
 * @param constellation
 * @param nodeId
 * @param data
 * @returns {RoamerNodeRenderer}
 * @constructor
 */
RoamerNodeRenderer = function(constellation, nodeId, data) {
    NodeRenderer.call(this, constellation, nodeId, data);

    // Keep track of state to optimize redraw.
    this.label = null;
    this.graphicShape = null;
    this.graphicSize = null;
    this.graphicImageUrl = null;
    this.prevLeftIconUrl = null;
    this.prevRightIconUrl = null;
};
window["RoamerNodeRenderer"] = RoamerNodeRenderer;

RoamerNodeRenderer.prototype = new NodeRenderer();
RoamerNodeRenderer.prototype.constructor = RoamerNodeRenderer;

RoamerNodeRenderer.prototype.defaultStyles = {
    'label': "",
    'tooltip': "",
    
    'url': "",
    'url_target': "_self",
    
    'graphic_type': "shape",
    'graphic_image_url': "",
    
    'graphic_shape': "circle",
    'graphic_fill_color': '#ffffff',
    'graphic_line_color': '#000000',
    'graphic_gradient_fill': true,
    'graphic_size': 40,
    
    'selected_graphic_shape': "circle",
    'selected_graphic_fill_color': '#ffffff',
    'selected_graphic_line_color': '#000000',
    'selected_graphic_gradient_fill': true,
    'selected_graphic_size': 40,
    
    'left_icon_url': "",
    'right_icon_url': "",
    
    'selected_left_icon_url': "",
    'selected_right_icon_url': "",
    
    'left_icon_spacing': 0,
    'right_icon_spacing': 0,
    
    'label_bg_enabled': true,
    'label_bg_fill_color': '#ffffff',
    'label_bg_line_color': '#000000',
    'label_bg_rounded_corners': true,
    
    'selected_label_bg_enabled': true,
    'selected_label_bg_fill_color': '#ffffff',
    'selected_label_bg_line_color': '#000000',
    'selected_label_bg_rounded_corners': true,
    
    'label_position': "center",
    'label_embed_fonts': true,
    
    'label_font_color': '#000000',
    'label_font_bold': false,
    'label_font_family': "Arial",
    'label_font_italic': false,
    'label_font_size': 12,
    
    'selected_label_font_color': '#000000',
    'selected_label_font_bold': true,
    'selected_label_font_family': "Arial",
    'selected_label_font_italic': false,
    'selected_label_font_size': 12
};

// FIXME: Implement graphic image in node renderers.
// FIXME: Implement left and right icons.
RoamerNodeRenderer.prototype.create = function(){
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
RoamerNodeRenderer.prototype["create"] = RoamerNodeRenderer.prototype.create;

RoamerNodeRenderer.prototype.draw = function() {
    var svg = this['constellation']['svg'];

    // Update the display at the beginning of the draw call so getBBox doesn't fail in Firefox.
    jQuery(this.renderer.group).css('display', 'inline');
    
    var graphicSettings = {
        'fill': this.getStyle('graphic_fill_color'),
        'stroke': this.getStyle('graphic_line_color')
    };
    
    var label = this.getStyle('label');
    var graphicSize = this.getStyle('graphic_size');
    var graphicShape = this.getStyle('graphic_shape');
    
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
    
    // FIXME: Implement label positioning.
    
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

    this.label = label;
    this.graphicSize = graphicSize;
    this.graphicShape = graphicShape;
    //this.graphicImageUrl = graphicImageUrl;
    //this.prevLeftIconUrl = prevLeftIconUrl;
    //this.prevRightIconUrl = prevRightIconUrl;
};
RoamerNodeRenderer.prototype["draw"] = RoamerNodeRenderer.prototype.draw;

RoamerNodeRenderer.prototype.position = function() {
    jQuery(this.renderer.group)
        .attr('transform', 'translate(' + this['x'] + ',' + this['y'] + ')' + 
            'rotate(' + (-this['constellation'].rotation * 180/Math.PI) + ')');
};
RoamerNodeRenderer.prototype["position"] = RoamerNodeRenderer.prototype.position;

RoamerNodeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.group).remove();
    this.renderer = null;
};
RoamerNodeRenderer.prototype["destroy"] = RoamerNodeRenderer.prototype.destroy;

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
        .attr('transform', 'translate(' + this['x'] + ',' + this['y'] + ')');
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
    
    Edge.call(this, edgeId, tailNodeRenderer, headNodeRenderer, data);
    
    if (!this['data']['classes']) {
        this['data']['classes'] = [];
    }
};
window["EdgeRenderer"] = EdgeRenderer;

EdgeRenderer.prototype = new Edge();
EdgeRenderer.prototype.constructor = EdgeRenderer;

EdgeRenderer.prototype.defaultStyles = {};

EdgeRenderer.prototype.getStyle = function(propertyName) {
    return this['constellation'].getStyle('edge', this['data']['classes'], propertyName, this['data'], this.defaultStyles);
};
EdgeRenderer.prototype["getStyle"] = EdgeRenderer.prototype.getStyle;

// FIXME: Duplicates NodeRenderer class methods. Factor this out.
EdgeRenderer.prototype.addClass = function(className) {
    if (jQuery.inArray(className, this['data']['classes']) < 0) {
        this['data']['classes'].push(className);
    }
};
EdgeRenderer.prototype["addClass"] = EdgeRenderer.prototype.addClass;

EdgeRenderer.prototype.hasClass = function(className) {
    return jQuery.inArray(className, this['data']['classes']) >= 0;
};
EdgeRenderer.prototype["hasClass"] = EdgeRenderer.prototype.hasClass;

EdgeRenderer.prototype.removeClass = function(className) {
    var index;
    while ((index = jQuery.inArray(className, this['data']['classes'])) >= 0) {
        this['data']['classes'].splice(index, 1);
    }
};
EdgeRenderer.prototype["removeClass"] = EdgeRenderer.prototype.removeClass;

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
        
};

DefaultEdgeRenderer.prototype.create = function() {
    var svg = this['constellation']['svg'];
    var container = this['constellation'].getEdgeContainer();
    this.renderer = {
        line: svg.line(container, 0, 0, 10, 0, {
            'display': 'none',
            'stroke': '#999999',
            'strokeWidth': 5
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
        .css('display', 'inline');
};
DefaultEdgeRenderer.prototype["draw"] = DefaultEdgeRenderer.prototype.draw;

DefaultEdgeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.line).remove();
};
DefaultEdgeRenderer.prototype["destroy"] = DefaultEdgeRenderer.prototype.destroy;


/**
 * 
 * @param constellation
 * @param edgeId
 * @param tailNodeRenderer
 * @param headNodeRenderer
 * @param data
 * @returns {RoamerEdgeRenderer}
 * @constructor
 */
RoamerEdgeRenderer = function(constellation, edgeId, tailNodeRenderer, headNodeRenderer, data) {
    EdgeRenderer.call(this, constellation, edgeId, tailNodeRenderer, headNodeRenderer, data);
};
window["RoamerEdgeRenderer"] = RoamerEdgeRenderer;

RoamerEdgeRenderer.prototype = new EdgeRenderer();
RoamerEdgeRenderer.prototype.constructor = RoamerEdgeRenderer;

RoamerEdgeRenderer.prototype.defaultStyles = {
    'tooltip': "",
    
    'edge_line_color': '#000000',
    'edge_line_thickness': 1,
    
    'arrowhead': true,
    'bidirectional': false,
    'reverse': false,
    
    'edge_length_weight': 0
};

RoamerEdgeRenderer.prototype.create = function() {
    var svg = this['constellation']['svg'];
    var container = this['constellation'].getEdgeContainer();
    this.renderer = {
        line: svg.line(container, 0, 0, 10, 0, {
            'display': 'none',
            'stroke': this.getStyle('edge_line_color'),
            'strokeWidth': this.getStyle('edge_line_thickness')
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
RoamerEdgeRenderer.prototype["create"] = RoamerEdgeRenderer.prototype.create;

RoamerEdgeRenderer.prototype.draw = function() {
    jQuery(this.renderer.line)
        .attr('x1', this['tailNode']['x'])
        .attr('y1', this['tailNode']['y'])
        .attr('x2', this['headNode']['x'])
        .attr('y2', this['headNode']['y'])
        .css('stroke', this.getStyle('edge_line_color'))
        .css('strokeWidth', this.getStyle('edge_line_thickness'))
        .css('display', 'inline');
};
RoamerEdgeRenderer.prototype["draw"] = RoamerEdgeRenderer.prototype.draw;

RoamerEdgeRenderer.prototype.destroy = function() {
    jQuery(this.renderer.line).remove();
};
RoamerEdgeRenderer.prototype["destroy"] = RoamerEdgeRenderer.prototype.destroy;
