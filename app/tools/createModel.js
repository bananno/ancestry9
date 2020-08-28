const mongoose = require('mongoose');

module.exports = createModel;

function createModel(modelName) {
  const dir = '../' + modelName.toLowerCase() + '/';

  const modelProperties = require(dir + 'model-schema');
  const instanceMethods = require(dir + 'model-instance');
  const staticMethods = require(dir + 'model-static');

  const modelSchema = {};

  modelProperties.forEach(prop => {
    let spec;

    if (prop.references) {
      spec = {
        type: mongoose.Schema.Types.ObjectId,
        ref: prop.references,
      };
    } else {
      spec = prop.type;
    }

    modelSchema[prop.name] = spec;
  });

  const citationSchema = new mongoose.Schema(modelSchema);

  for (let methodName in instanceMethods) {
    citationSchema.methods[methodName] = instanceMethods[methodName];
  }

  for (let methodName in staticMethods) {
    citationSchema.statics[methodName] = staticMethods[methodName];
  }

  mongoose.model(modelName, citationSchema);
}
