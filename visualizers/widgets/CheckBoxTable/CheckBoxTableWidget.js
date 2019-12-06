/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Tue Oct 29 2019 16:18:52 GMT-0500 (Central Daylight Time).
 */

define(['css!./styles/CheckBoxTableWidget.css'], function () {
    'use strict';

    var WIDGET_CLASS = 'check-box-table';

    function CheckBoxTableWidget(logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this._initialize();

        this._logger.debug('ctor finished');
    }

    CheckBoxTableWidget.prototype._initialize = function () {
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        // Create a dummy header
        this._el.append('<h3>New header:</h3>');

        // Registering to events can be done with jQuery (as normal)
        this._el.on('dblclick', function (event) {
            event.stopPropagation();
            event.preventDefault();
            self.onBackgroundDblClick();
        });
    };

    CheckBoxTableWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
    };

    CheckBoxTableWidget.prototype.setSpreadSheet = function (desc) {
        const self = this;
        $(this._el).empty();
        this._nodeIds2Names = {};
        this._sources = {};
        desc.nodes.forEach(function(node){
            self._nodeIds2Names[node.id] = node.name;
        });
        desc.edges.forEach(function(edge){
            console.log(edge.id);
            self._sources[edge.src] = self._sources[edge.src] || {};
            self._sources[edge.src][edge.dst] = edge.id; 
        });
        console.log(self._sources);

        let myTable = document.createElement('table');
        let firstRow = document.createElement('tr');
        $(firstRow).append('<th><th/>');
        desc.nodes.forEach(function(node){
            $(firstRow).append('<th>'+node.name+'<th/>');
        });
        $(myTable).append(firstRow);

        desc.nodes.forEach(function(node){
            let currentRow = document.createElement('tr');
            $(currentRow).append('<th>'+node.name+'<th/>');
            desc.nodes.forEach(function(otherNode){
                if(otherNode.id === node.id){
                    $(currentRow).append('<th>X<th/>');
                    return;
                }
                let checked = false;
                let id = '';
                let checkedText = '';
                console.log('node:',node.id,' other:',otherNode.id);
                if( self._sources.hasOwnProperty(node.id) && self._sources[node.id].hasOwnProperty(otherNode.id)){
                    console.log('found one');
                    checked = true;
                    id = self._sources[node.id][otherNode.id];
                    checkedText = 'checked="true"';
                }

                let cell = document.createElement('th');
                let input = document.createElement('input');
                $(input).prop('type','checkbox');
                if(id){
                    $(input).prop('id',id);
                }
                if(checked){
                    $(input).prop('checked',true);
                    $(input).on('click',function(event){
                        event.stopPropagation();
                        event.preventDefault();
                        console.log('remove edge',this.id);
                        self.onRemoveEdge(this.id);
                    });
                } else {
                    $(input).data('src',node.id);
                    $(input).data('dst',otherNode.id);
                    $(input).on('click',function(){
                        console.log('create edge',$(this).data('src'),$(this).data('dst'));
                        self.onCreateEdge($(this).data('src'),$(this).data('dst'));
                    });
                }
                //$(cell).append('<input type="checkbox" '+id+' '+checkedText+'>');
                $(cell).append(input);
                $(currentRow).append(cell);
            });
            $(myTable).append(currentRow);
        });


        $(this._el).append(myTable);
    };

    // Adding/Removing/Updating items
    CheckBoxTableWidget.prototype.addNode = function (desc) {
        if (desc) {
            // Add node to a table of nodes
            var node = document.createElement('div'),
                label = 'children';

            if (desc.childrenIds.length === 1) {
                label = 'child';
            }

            this.nodes[desc.id] = desc;
            node.innerHTML = 'Adding node "' + desc.name + '" (click to view). It has ' +
                desc.childrenIds.length + ' ' + label + '.';

            this._el.append(node);
            node.onclick = this.onNodeClick.bind(this, desc.id);
        }
    };

    CheckBoxTableWidget.prototype.removeNode = function (gmeId) {
        var desc = this.nodes[gmeId];
        this._el.append('<div>Removing node "' + desc.name + '"</div>');
        delete this.nodes[gmeId];
    };

    CheckBoxTableWidget.prototype.updateNode = function (desc) {
        if (desc) {
            this._logger.debug('Updating node:', desc);
            this._el.append('<div>Updating node "' + desc.name + '"</div>');
        }
    };

    /* * * * * * * * Visualizer event handlers * * * * * * * */

    CheckBoxTableWidget.prototype.onNodeClick = function (/*id*/) {
        // This currently changes the active node to the given id and
        // this is overridden in the controller.
    };

    CheckBoxTableWidget.prototype.onRemoveEdge = function(/*edgeId*/) {
        console.log('should be overridden in controller');
    };
    CheckBoxTableWidget.prototype.onCreateEdge = function(/*srcId,dstId*/) {
        console.log('should be overridden in controller');
    };
    CheckBoxTableWidget.prototype.onBackgroundDblClick = function () {
        this._el.append('<div>Background was double-clicked!!</div>');
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    CheckBoxTableWidget.prototype.destroy = function () {
    };

    CheckBoxTableWidget.prototype.onActivate = function () {
        this._logger.debug('CheckBoxTableWidget has been activated');
    };

    CheckBoxTableWidget.prototype.onDeactivate = function () {
        this._logger.debug('CheckBoxTableWidget has been deactivated');
    };

    return CheckBoxTableWidget;
});
