/*globals define, _, WebGMEGlobal*/
/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Fri Nov 29 2019 15:49:35 GMT-0600 (CST).
 */

define([
    'js/PanelBase/PanelBaseWithHeader',
    'js/PanelManager/IActivePanel',
    'widgets/ModelViz/ModelVizWidget',
    './ModelVizControl'
], function (
    PanelBaseWithHeader,
    IActivePanel,
    ModelVizWidget,
    ModelVizControl
) {
    'use strict';

    function ModelVizPanel(layoutManager, params) {
        var options = {};
        //set properties from options
        options[PanelBaseWithHeader.OPTIONS.LOGGER_INSTANCE_NAME] = 'ModelVizPanel';
        options[PanelBaseWithHeader.OPTIONS.FLOATING_TITLE] = true;

        //call parent's constructor
        PanelBaseWithHeader.apply(this, [options, layoutManager]);

        this._client = params.client;

        //initialize UI
        this._initialize();

        this.logger.debug('ctor finished');
    }

    //inherit from PanelBaseWithHeader
    _.extend(ModelVizPanel.prototype, PanelBaseWithHeader.prototype);
    _.extend(ModelVizPanel.prototype, IActivePanel.prototype);

    ModelVizPanel.prototype._initialize = function () {
        var self = this;

        //set Widget title
        this.setTitle('');

        this.widget = new ModelVizWidget(this.logger, this.$el);

        this.widget.setTitle = function (title) {
            self.setTitle(title);
        };

        this.control = new ModelVizControl({
            logger: this.logger,
            client: this._client,
            widget: this.widget
        });

        this.onActivate();
    };

    /* OVERRIDE FROM WIDGET-WITH-HEADER */
    /* METHOD CALLED WHEN THE WIDGET'S READ-ONLY PROPERTY CHANGES */
    ModelVizPanel.prototype.onReadOnlyChanged = function (isReadOnly) {
        //apply parent's onReadOnlyChanged
        PanelBaseWithHeader.prototype.onReadOnlyChanged.call(this, isReadOnly);

    };

    ModelVizPanel.prototype.onResize = function (width, height) {
        this.logger.debug('onResize --> width: ' + width + ', height: ' + height);
        this.widget.onWidgetContainerResize(width, height);
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    ModelVizPanel.prototype.destroy = function () {
        this.control.destroy();
        this.widget.destroy();

        PanelBaseWithHeader.prototype.destroy.call(this);
        WebGMEGlobal.KeyboardManager.setListener(undefined);
        WebGMEGlobal.Toolbar.refresh();
    };

    ModelVizPanel.prototype.onActivate = function () {
        this.widget.onActivate();
        this.control.onActivate();
        WebGMEGlobal.KeyboardManager.setListener(this.widget);
        WebGMEGlobal.Toolbar.refresh();
    };

    ModelVizPanel.prototype.onDeactivate = function () {
        this.widget.onDeactivate();
        this.control.onDeactivate();
        WebGMEGlobal.KeyboardManager.setListener(undefined);
        WebGMEGlobal.Toolbar.refresh();
    };

    return ModelVizPanel;
});
