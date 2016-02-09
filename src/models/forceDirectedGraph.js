nv.models.forceDirectedGraph = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 2, right: 0, bottom: 2, left: 0}
        , width = 400
        , height = 32
        , container = null
        , dispatch = d3.dispatch('renderEnd')
        , color = nv.utils.getColor(['#000'])
        , noData = null
        // Force directed graph specific parameters [default values]
        , linkStrength = 0.1
        , friction = 0.9
        , linkDist = 30
        , charge = -120
        , gravity = 0.1
        , theta = 0.8
        , alpha = 0.1
        , symbol = d3.svg.symbol()
                            .type( function(d) { return d.shape || "circle"; } )
                            .size( function(d) { return d.size  || 50; } )
        , curveLinks = false
        , useArrows = false
        // These functions allow to add extra attributes to ndes and links
        ,nodeExtras = function(nodes) { /* Do nothing */ }
        ,linkExtras = function(links) { /* Do nothing */ }
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();

        selection.each(function(data) {
          container = d3.select(this);
          nv.utils.initSVG(container);

          var availableWidth = nv.utils.availableWidth(width, container, margin),
              availableHeight = nv.utils.availableHeight(height, container, margin);

          container
                  .attr("width", availableWidth)
                  .attr("height", availableHeight);

          // Display No Data message if there's nothing to show.
          if (!data || !data.links || !data.nodes) {
              nv.utils.noData(chart, container)
              return chart;
          } else {
              container.selectAll('.nv-noData').remove();
          }
          container.selectAll('*').remove();

          var force = d3.layout.force()
                .nodes(data.nodes)
                .links(data.links)
                .size([availableWidth, availableHeight])
                .linkStrength(linkStrength)
                .friction(friction)
                .linkDistance(linkDist)
                .charge(charge)
                .gravity(gravity)
                .theta(theta)
                .alpha(alpha)
                .start();

          var link = container.append("svg:g").selectAll("path")
                .data(data.links)
                .enter().append("svg:path")
                .attr("class", "nv-force-link");

          // build the arrow.
          if (useArrows) {
            container.append("svg:defs").selectAll("marker")
                  .data(["end"])      // Different link/path types can be defined here
                  .enter().append("svg:marker")    // This section adds in the arrows
                  .attr("id", String)
                  .attr("viewBox", "0 -5 10 10")
                  .attr("refX", 15)
                  .attr("refY", -1.5)
                  .attr("markerWidth", 10)
                  .attr("markerHeight", 10)
                  .attr("orient", "auto")
                  .append("svg:path")
                  .attr("d", "M0,-5L10,0L0,5")
                  .attr("class", "nv-force-link-arrow");
            link.attr("marker-end", "url(#end)");
          }

          var node = container.append("svg:g").selectAll(".node")
                .data(data.nodes)
                .enter()
                .append("g")
                .attr("class", "nv-force-node")
                .call(force.drag);
          node
            .append("path")
            .attr("d", symbol)
            .style("fill", function(d) { return color(d) } );

          // Apply extra attributes to nodes and links (if any)
          linkExtras(link);
          nodeExtras(node);

          force.on("tick", function() {
              link.attr("d", curveLinks ? _curveLinkPath : _straightLinkPath);

              node.attr("transform", function(d) {
                return "translate(" + d.x + ", " + d.y + ")";
              });
            });
        });

        return chart;
    }

    function _curveLinkPath(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y +
             "A" + dr + "," + dr + " 0 0,1 " +
             d.target.x + "," + d.target.y;
    }

    function _straightLinkPath(d) {
      return "M" + d.source.x + "," + d.source.y +
             "L" + d.target.x + "," + d.target.y;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:     {get: function(){return width;}, set: function(_){width=_;}},
        height:    {get: function(){return height;}, set: function(_){height=_;}},

        // Force directed graph specific parameters
        linkStrength:{get: function(){return linkStrength;}, set: function(_){linkStrength=_;}},
        friction:    {get: function(){return friction;}, set: function(_){friction=_;}},
        linkDist:    {get: function(){return linkDist;}, set: function(_){linkDist=_;}},
        charge:      {get: function(){return charge;}, set: function(_){charge=_;}},
        gravity:     {get: function(){return gravity;}, set: function(_){gravity=_;}},
        theta:       {get: function(){return theta;}, set: function(_){theta=_;}},
        alpha:       {get: function(){return alpha;}, set: function(_){alpha=_;}},
        symbol:      {get: function(){return symbol;}, set: function(_){symbol=_;}},
        curveLinks:  {get: function(){return curveLinks;}, set: function(_){curveLinks=_;}},
        useArrows:   {get: function(){return useArrows;}, set: function(_){useArrows=_;}},

        //functor options
        x: {get: function(){return getX;}, set: function(_){getX=d3.functor(_);}},
        y: {get: function(){return getY;}, set: function(_){getY=d3.functor(_);}},

        // options that require extra logic in the setter
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }},
        color:  {get: function(){return color;}, set: function(_){
            color = nv.utils.getColor(_);
        }},
        noData:    {get: function(){return noData;}, set: function(_){noData=_;}},
        nodeExtras: {get: function(){return nodeExtras;}, set: function(_){
            nodeExtras = _;
        }},
        linkExtras: {get: function(){return linkExtras;}, set: function(_){
            linkExtras = _;
        }}
    });

    chart.dispatch = dispatch;
    nv.utils.initOptions(chart);
    return chart;
};
