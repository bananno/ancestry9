const mongoose = require('mongoose');
const tools = require('./modelTools');

module.exports = createModel;

function createModel(modelName) {
  const dir = '../' + modelName.toLowerCase() + '/';

  const modelProperties = require(dir + 'model-schema');
  const instanceMethods = require(dir + 'model-instance');
  const staticMethods = require(dir + 'model-static');

  const exportFieldNames = modelProperties
    .filter(prop => prop.includeInExport)
    .map(prop => prop.name);

  const modelSchema = {};
  const fields = [];

  modelProperties.forEach(prop => {
    if (prop.showInEditTable !== false) {
      if (prop.specialType === 'tags') {
        prop.allowUpdatingExistingValues = true;
      }

      fields.push({
        multi: prop.isArray,
        dataType: prop.references === 'Person' ? 'people' : undefined,
        ...prop
      });
    }

    if (prop.includeInSchema === false) {
      return;
    }

    if (prop.specialType) {
      if (prop.specialType === 'date') {
        modelSchema[prop.name] = tools.dateStructure;
        return;
      }

      if (prop.specialType === 'location') {
        modelSchema[prop.name] = tools.locationStructure;
        return;
      }

      if (prop.specialType === 'tags') {
        modelSchema.tags = [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}];
        modelSchema.tagValues = [String];
        return;
      }
    }

    const spec = {};

    if (prop.references) {
      spec.type = mongoose.Schema.Types.ObjectId;
      spec.ref = prop.references;
    } else {
      spec.type = prop.type;
    }

    spec.default = prop.defaultValue;

    modelSchema[prop.name] = prop.isArray ? [spec] : spec;
  });

  const constants = {
    modelName,
    fields,
    exportFieldNames,
  };

  const mongooseSchema = new mongoose.Schema(modelSchema);

  for (let methodName in instanceMethods) {
    mongooseSchema.methods[methodName] = instanceMethods[methodName];
  }

  for (let methodName in staticMethods) {
    mongooseSchema.statics[methodName] = staticMethods[methodName];
  }

  mongooseSchema.methods.constants = () => constants;
  mongooseSchema.statics.constants = () => constants;

  mongoose.model(modelName, mongooseSchema);
}
