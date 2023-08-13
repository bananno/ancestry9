const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const {modelsThatHaveTags} = require('./constants');
const tagModelSchema = require('./model-schema');
const methods = {};
module.exports = methods;

methods.getTagTitles = tools.getTagTitles;
methods.getTagValue = tools.getTagValue;
methods.hasTag = tools.hasTag;
methods.convertTags = tools.convertTags2;

methods.isModelAllowed = function(modelName) {
  return !this.restrictModels || this['allow' + modelName];
};

// A tag can be deleted if it's not attached to any items.
methods.canBeDeleted = async function() {
  for (let i in modelsThatHaveTags) {
    const modelName = modelsThatHaveTags[i].name;
    const items = await mongoose.model(modelName).find({tags: this});
    if (items.length) {
      return false;
    }
  }

  return true;
};

// Given the raw saved value for a tag, get the actual value based on the tag value type.
methods.getValueFor = function(rawTagValue) {
  // 0. Tag value type = not applicable. The tag is attached, so the value is true.
  // Example: "featured", "died young", "needs image"
  if (this.valueType === 0) {
    return true;
  }
  // 1. Tag value is anything input by textbox.
  // 2. Tag value is selected from preset list of values, but the actual text is saved.
  return rawTagValue;
};

// Given the current value of a tag (for an Item: person, source, whatever)
// get the settings to build a form for editing that value in the Item's edit table.
// (Example: load "edit" view for a person. If the person has 3 tags, this function
// will be called for each of them to determine if/how those tags can be edited.)
methods.getEditTableSettings = function(tagValue) {
  // The value should be chosen from a dropdown.
  if (this.valueType === 2) {
    const valueList = this.values
      ? this.values.split('\n').map(s => s.trim())
      : [];

    // If the value is not in the dropdown (and the value does exist)
    // use a textbox to avoid losing the value.
    if (tagValue && !valueList.includes(tagValue)) {
      return {showTextbox: true};
    }

    return {
      showDropdown: true,
      dropdownOptions: valueList.map(text =>
        ({text, selected: text === tagValue})),
    };
  }

  // If the value type should be any text, or if there should not be
  // a value but it's already there, use a textbox.
  if (tagValue || this.valueType === 1) {
    return {showTextbox: true};
  }

  // There is no value associated with this tag, so it is not editable.
  return false;
};

// Get the list of model names that can use this tag to display in the UI.
// If not restricted, return an empty list.
methods.getRestrictedModelList = function() {
  if (!this.restrictModels) {
    return [];
  }
  return modelsThatHaveTags
    .filter(({name}) => this.isModelAllowed(name))
    .map(({plural}) => plural);
};

// Applicable for any any field with inputType=dropdown.
// Given the name of the field, find the corresponding text of the current value.
// TO DO: make this more general to use for other models & fields.
methods.getDropdownFieldValueName = function(fieldName) {
  const field = tagModelSchema.find(field => field.name === fieldName);
  if (field.inputType !== 'dropdown') {
    throw `value name not applicable for this field: ${fieldName}`;
  }
  return field.valueNames[this[fieldName]];
}

// TO DO: merge the rest of "getTagShowData" functionality into this method;
// update old template to use populateAllAttachedItems; delete getTagShowData
methods.populateAllAttachedItems = async function() {
  const data = {};

  await forEachModel(async (Model, modelName, pluralName) => {
    if (!this.isModelAllowed(modelName)) {
      return;
    }

    if (pluralName === 'sources') {
      const rawSources = await Model.find({tags: this._id}).populate('story');
      data[pluralName] = rawSources.map(source => ({
        id: source._id,
        fullTitle: source.populateFullTitle(),
      }));
      return;
    }

    const rawItems = await Model.find({tags: this._id});

    data[pluralName] = rawItems.map(item => ({
      id: item._id, // all models
      name: item.name, // people only
      tagValue: this.valueType !== 0 ? item.getTagValue(this) : undefined, // all models
      title: item.title, // everything but people & images
      // TO DO: add whatever's needed for images
    }));
  });

  this.attachedItems = data;
};

/////////////////////

async function forEachModel(callback) {
  for (let i in modelsThatHaveTags) {
    const modelName = modelsThatHaveTags[i].name;
    const Model = mongoose.model(modelName);
    const pluralName = modelsThatHaveTags[i].plural;
    await callback(Model, modelName, pluralName);
  }
}
