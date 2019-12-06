/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.20.5 from webgme on Sat Nov 30 2019 14:07:27 GMT-0600 (CST).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of ModelicaCodeGenerator.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ModelicaCodeGenerator.
     * @constructor
     */
    function ModelicaCodeGenerator() {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    }

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructure etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ModelicaCodeGenerator.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ModelicaCodeGenerator.prototype = Object.create(PluginBase.prototype);
    ModelicaCodeGenerator.prototype.constructor = ModelicaCodeGenerator;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(Error|null, plugin.PluginResult)} callback - the result callback
     */
    ModelicaCodeGenerator.prototype.main = function (callback) {
        // Use this to access core, project, result, logger etc from PluginBase.
        var self = this,
            core = this.core,
            logger = this.logger,
            modelJson = {
                  name:'',
                  components:[],
                  connections:[]
            },
            activeNode = this.activeNode;


        function atComponent(node){
            var componentData = {
                URI:'',
                name:'',
                parameters:{},
		init: ''
             };
            
            componentData.URI = core.getAttribute(node,'ModelicaURI');
            componentData.name = core.getAttribute(node,'name');
            core.getAttributeNames(node).forEach((attrName) => {
                if (attrName !== 'name' && !core.getAttributeMeta(node, attrName).readonly) {
                    if (attrName === 'init') {
                        componentData.init = core.getAttribute(node, attrName) || '';
                    } else {
                        componentData.parameters[attrName] = core.getAttribute(node, attrName);
                    }
                }
            });
            modelJson.components.push(componentData);

        }
        function atConnection(nodes,node){
            var connData = {
                src:'',
                dst:''
             };
            var srcPath = core.getPointerPath(node,'src');
            var dstPath = core.getPointerPath(node,'dst');
            if (srcPath && dstPath){
               var srcNode =nodes[srcPath];
               var dstNode =nodes[dstPath];
               var srcParent = core.getParent(srcNode);
               var dstParent = core.getParent(dstNode);
               connData.src = core.getAttribute(srcParent,'name')+'.'+core.getAttribute(srcNode,'name');
               connData.dst = core.getAttribute(dstParent,'name')+'.'+core.getAttribute(dstNode,'name');
               modelJson.connections.push(connData);
               }

        }

        function getMoFileContent(){
            var moFile = 'model ' + modelJson.name;
            modelJson.components.forEach(function (data){
                const params = Object.keys(data.parameters);
                moFile += '\n  ' + data.URI + ' ' + data.name;
                if (params.length > 0) {
                    moFile += '(';
                    params.map((p, idx) => {
                        moFile += `${p} = ${data.parameters[p]}, `;
                        if (idx === params.length - 1) {
                            if (data.init) {
                                moFile += data.init;
                            } else {
                                moFile = moFile.slice(0, -2);
                            }
                        }else if (data.init) {
                            moFile += `(${data.init})`;
                        }
                        
                    });

                        moFile += ')';
                    } 

                    moFile += ';';
            });
            moFile += '\nequation';     
            modelJson.connections.forEach(function (data){
                moFile += '\n connect(' + data.src+',' + data.dst+ ');';
            });
            moFile += '\nend ' + modelJson.name+';';
            logger.info(moFile);
            return moFile;

        }
        // Using the logger.
        self.logger.debug('This is a debug message.');
        self.logger.info('This is an info message.');
        self.logger.warn('This is a warning message.');
        self.logger.error('This is an error message.');

        // Using the coreAPI to make changes.
        //const nodeObject = self.activeNode;
        //self.core.setAttribute(nodeObject, 'name', 'My new obj');
        //self.core.setRegistry(nodeObject, 'position', {x: 70, y: 70});


        // This will save the changes. If you don't want to save;
        // exclude self.save and call callback directly from this scope.
        //preload the sub-tree from active Node

        self.loadNodeMap(this.activeNode)
            .then(function(nodes){
                var nodePath,
                    node;
                for (nodePath in nodes){
                    self.logger.info(self.core.getAttribute(nodes[nodePath],'name'), 'has path',nodePath);
                    }
                modelJson.name = core.getAttribute(activeNode,'name');
                
                var childrenPaths = core.getChildrenPaths(activeNode);
                
                for(var i = 0; i< childrenPaths.length; i+=1){
                    node = nodes[childrenPaths[i]];
                    
                    if(self.isMetaTypeOf(node,self.META.Component)){
                       atComponent(node);
                       }
                       else if(self.isMetaTypeOf(node,self.META.Connection)){
                         atConnection(nodes,node);
                         }
                       }
                self.logger.info('Extracted data:\n', JSON.stringify(modelJson,null,2));
                var moFileContent = getMoFileContent();
                //self.result.setSuccess(true);
                //callback(null, self.result);
                return self.blobClient.putFile(modelJson.name+ '.mo',moFileContent);
            })
            .then (function (metadataHash){
                self.result.addArtifact(metadataHash);
                self.result.setSuccess(true);
                callback(null,self.result);
             })
            .catch(function(err) {
                // Result success is false at invocation.
                self.logger.error(err.stack);
                callback(err, self.result);
            });
    };

    return ModelicaCodeGenerator;
});