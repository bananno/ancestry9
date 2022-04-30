const mongoose = require('mongoose');
const tools = require('./modelTools');

module.exports = createModel;

function createModel(resource) {
  const modelName = resource.modelName;

  const dir = '../' + modelName.toLowerCase() + '/';

  const rawFieldList = require(dir + 'model-schema');
  const instanceMethods = require(dir + 'model-instance');
  const staticMethods = require(dir + 'model-static');

  // For schema validation
  const propFieldsUsed = [];

  // The schema for the actual mongoose model.
  // Usually each field will add ONE property to the mongoose schema,
  // but sometimes it will add ZERO or TWO properties.
  const modelSchema = {};

  // Fields will be a cleaned-up version of rawFieldList.
  // Default values will be filled in, etc.
  const fields = [];

  rawFieldList.forEach(fieldData => {
    const keysDone = [];
    propFieldsUsed.push(keysDone);

    // Track used keys to determine if the property contains any invalid combinations
    // or redundant/unused keys. Do not use getPropKey() or push to keysDone unless
    // the key is actually needed and valid.
    function getPropKey(key, options = {}) {
      const value = fieldData[key];

      if (options.defaultTo !== undefined) {
        if (value === undefined) {
          return options.defaultTo;
        }
        // Make sure the value isn't equal to the default value.
        // If it is, then it isn't "used" because it isn't necessary.
        if (value !== options.defaultTo) {
          keysDone.push(key);
        }
        return value;
      }

      if (options.expectOneOf) {
        if (options.expectOneOf.includes(options.defaultTo)) {
          keysDone.push(key);
          return value;
        }
        throw 'unexpected value for schema property key';
      }

      if (value === undefined) {
        if (options.required) {
          throw 'required value is missing';
        }
      } else {
        keysDone.push(key);
      }

      return value;
    };

    const field = {
      name: getPropKey('name', {required: true}),
      includeInExport: getPropKey('includeInExport', {defaultTo: true}),
    };

    fields.push(field);

    const includeInSchema = getPropKey('includeInSchema', {defaultTo: true});

    if (!includeInSchema) {
      field.showInEditTable = () => false;
      field.showDisabledWhenNotEditable = getPropKey('showDisabledWhenNotEditable');
      return;
    }

    // DATA TYPE

    field.dataType = getPropKey('dataType', {required: true});

    // EDITABILITY

    const isEditable = getPropKey('isEditable', {defaultTo: true});

    if (typeof isEditable === 'function') {
      field.showInEditTable = isEditable;
      field.showDisabledWhenNotEditable = getPropKey('showDisabledWhenNotEditable', {defaultTo: false});
    } else if (isEditable === true) {
      field.showInEditTable = () => true;
    } else {
      field.showInEditTable = () => false;
      field.showDisabledWhenNotEditable = getPropKey('showDisabledWhenNotEditable', {defaultTo: false});
    }

    // SPECIAL TYPES - date/location

    if (field.dataType === 'date') {
      modelSchema[field.name] = tools.dateStructure;
      return;
    }
    if (field.dataType === 'location') {
      modelSchema[field.name] = tools.locationTools.locationStructure;
      return;
    }

    // LIST OPTIONS

    field.isList = getPropKey('isList', {defaultTo: false});

    if (field.isList) {
      field.onAdd = getPropKey('onAdd');
      field.onDelete = getPropKey('onDelete');
    }

    // SPECIAL TYPE - links

    if (field.dataType === 'link') {
      modelSchema[field.name] = field.isList ? [String] : String;
      field.allowUpdatingExistingValues = true;
      return;
    }

    // BASIC TYPE

    const mongoSpec = {};

    const isBasicType = [String, Boolean, Number].includes(field.dataType);

    if (isBasicType) {
      mongoSpec.type = field.dataType;

      const defaultValue = getPropKey('defaultValue');
      if (defaultValue !== undefined) {
        mongoSpec.default = defaultValue;
      }

      if (field.dataType === String) {
        field.inputType = getPropKey('inputType', {
          defaultTo: 'text',
          expectOneOf: ['textarea', 'text'],
        });

      } else if (field.dataType === Number) {
        field.inputType = getPropKey('inputType', {
          defaultTo: 'text',
          expectOneOf: ['text', 'dropdown', 'toggle'],
        });

        if (field.inputType !== 'text') {
          field.valueNames = getPropKey('valueNames', {required: true});
        }

      } else {
        field.inputType = 'toggle';
      }


    // REFERENCE TYPE

    } else {
      const refableModels = ['image', 'person', 'source', 'story', 'tag'];

      if (!refableModels.includes(field.dataType)) {
        throw "invalid data type: " + field.dataType;
      }

      const otherModelName = capitalize(field.dataType);

      mongoSpec.type = mongoose.Schema.Types.ObjectId;
      mongoSpec.ref = otherModelName;

      field.referenceModel = otherModelName;

      if (field.dataType === 'tag') {
        const tagValueAttrName = field.name === 'tags'
          ? 'tagValues'
          : (field.name + 'Values');
        modelSchema[tagValueAttrName] = field.isList ? [String] : String;
        field.allowUpdatingExistingValues = true;
      }
    }

    modelSchema[field.name] = field.isList ? [mongoSpec] : mongoSpec;
  });

  checkForUnusedKeys(modelName, rawFieldList, propFieldsUsed);

  const exportFieldNames = fields
    .filter(field => field.includeInExport)
    .map(field => field.name);

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

  resource.Model = mongoose.model(modelName, mongooseSchema);
}

function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function checkForUnusedKeys(modelName, rawFieldList, propFieldsUsed) {
  rawFieldList.forEach((prop, i) => {
    const propKeys = Object.keys(prop).sort();
    const keysUsed = propFieldsUsed[i].sort();
    if (propKeys.join(',') != keysUsed.join(',')) {
      const missing = propKeys.filter(key => !keysUsed.includes(key));
      const extra = keysUsed.filter(key => !propKeys.includes(key));
      console.log('EXTRA KEYS', modelName, prop.name, missing, extra);
    }
  });
}
