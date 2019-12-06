/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.20.5 from webgme on Sat Nov 30 2019 15:05:05 GMT-0600 (CST).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'q',
    'common/storage/constants'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    Q,
    STORAGE_CONSTANTS
    
    ) {
    'use strict';
    var fs = require('fs'),
        path = require('path'),
        cp = require('child_process'),
        os = require('os');
    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of SimulateModelica.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin SimulateModelica.
     * @constructor
     */
    function SimulateModelica() {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    }

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructure etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    SimulateModelica.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    SimulateModelica.prototype = Object.create(PluginBase.prototype);
    SimulateModelica.prototype.constructor = SimulateModelica;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(Error|null, plugin.PluginResult)} callback - the result callback
     */
    SimulateModelica.prototype.main = function (callback) {
        // Use this to access core, project, result, logger etc from PluginBase.
        var self = this,
            logger = this.logger,
            activeNode = self.activeNode;

        function generateDirectory(modelName){

            var MAX_DIR_TRIES = 100,
                result;
            try {
                fs.mkdirSync('outputs')
             } catch(e) {
                if (e.code !== 'EEXIST'){
                    throw e;
                }  
             }
            var dirname = modelName + '_' +Date.now();
            
            for (var i = 0; i< MAX_DIR_TRIES; i+=1){
                 
                result = path.join('outputs',dirname+ '_'+ i);
                 
                try{
                    fs.mkdirSync(result);
                    break;

                 } catch(e){
                      if (e.code !== 'EEXIST'){
                         throw e;
                      }else if (i === MAX_DIR_TRIES - 1){
                         throw new Error('Fail to generate unique output directory after ' + MAX_DIR_TRIES + 'attempts');
                       }
                   }
            }
            return result;
        }

        function writeFiles(dir,moFileContent,modelName,stopTime){
            fs.writeFileSync(path.join(dir, modelName+ '.mo'),moFileContent);
            fs.writeFileSync(path.join(dir,'simulate.mos'),[
               'loadModel(Modelica);getErrorString();',
               'loadFile("'+ modelName + '.mo"); getErrorString();',
               'simulate(' + modelName + ',startTime = 0.0, stopTime=' + stopTime+ ',outputFormat = "csv");getErrorString();'

            ].join('\n'));
        }

        function simulateModel(dir,modelName){
            var command;
            if (os.platform().indexOf('win')=== 0){
                command = '%OPENMODELICAHOME%\\bin\\omc.exe simulate.mos';
            }else{
                command = 'omc simulate.mos'
            }
            return Q.ninvoke(cp,'exec',command,{cwd:dir})
            .then(function(res){
                logger.info(res);

                return{
                    dir:dir,
                    resultFileName: modelName + '_res.csv'

                };
            });
        }

        self.invokePlugin('ModelicaCodeGenerator')
            .then(function(result) {
                if (result.getSuccess()!==true){
                   throw new Error('modelicacodegenerator did not return the success');
                  }
                var moFileHash = result.getArtifacts()[0];
                self.result.addArtifact(moFileHash);
                return self.blobClient.getObjectAsString(moFileHash);
            })
            .then(function(moFileContent) {
                logger.info('moFileContent',moFileContent);
                var modelName = self.core.getAttribute(activeNode,'name');
                var dir = generateDirectory(modelName);
                writeFiles (dir,moFileContent,modelName,self.getCurrentConfig().stopTime);

                return simulateModel(dir,modelName);
            })
            .then(function(res) {
                return self.blobClient.putFile(res.resultFileName, fs.readFileSync(path.join(res.dir,res.resultFileName)));
                //putFile(name,data[,callback])
            })
            .then(function(csvFileHash) {
                self.core.setAttribute(activeNode,'simResults',csvFileHash);
                return self.save('Attached simulation results at' + self.core.getPath(activeNode));
            })
            .then(function(commitResult) {
                if(commitResult.status === STORAGE_CONSTANTS.SYNCED){
                    self.result.setSuccess(true);
                    callback(null, self.result);
                }else{
                    self.createMessage(activeNode,'simulation succeeded but commit did not update branch.');
                    callback(new Error('Did not update branch.'),self.result);
                }
            })
            .catch((err) =>{
                // Result success is false at invocation.
                self.logger.error(err.stack);
                callback(err, self.result);
            });
    };

    return SimulateModelica;
});
