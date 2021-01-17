const mongoose = require('mongoose');
const Person = mongoose.model('Person');
const Story = mongoose.model('Story');
const Tag = mongoose.model('Tag');

module.exports = getEditTableRows;

async function getEditTableRows(data) {
  const rows = [];
  const {fields} = data.item.constants();
  for (let i in fields) {
    const value = await mapFieldRow(fields[i], data);
    rows.push(value);
  }
  return rows.filter(Boolean);
}

/*
  field = data about the property.
  item = the actual instance of the item (person, source, etc) being edited.
  rootPath = the item's home path ("/person/personId") taking into account
    which type of ID (actual vs. custom) is already in the url.
*/
async function mapFieldRow(field, data) {
  const {
    item,
    rootPath,
  } = data;

  const itemIsEditable = field.onlyEditableIf
    ? field.onlyEditableIf(item)
    : field.inputType !== 'none';

  if (!itemIsEditable && !field.showDisabledWhenNotEditable) {
    return false;
  }

  const itemAttrValue = field.getValue ? field.getValue(item) : item[field.name];

  const dataType = field.dataType || field.name;

  const tableRowData = {
    dataType,
    addItemPath: rootPath + '/add/' + field.name,
    dataForDropdown: {},
    editPath: rootPath + '/edit/' + field.name,
    fieldName: field.name,
    filename: field.multi ? './tableRowMulti' : './tableRowSingle',
    inputType: field.inputType || 'text',
    isDisabled: !itemIsEditable, // when "showDisabledWhenNotEditable"
    item,
    shareInfo: false,
    useToggleButton: field.inputType === 'toggle',
    fieldValueOptions: field.valueNames || [],
  };

  tableRowData.disableToggleButton = tableRowData.useToggleButton
    && tableRowData.isDisabled;

  await assignDataForDropdowns();

  if (field.multi) {
    tableRowData.values = itemAttrValue;
    tableRowData.valueDropownOptions = field.valueNames; // Is this ever used for multi?

    if (dataType === 'tags') {
      // The tag values that correspond with the actual tags for this item.
      tableRowData.tagValues = item.tagValues;
    }

    // If this attribute is a list, there is additional info needed for each
    // entry in the list.
    // The objectInList may be a string (e.g., for links) or an object (person, tag, etc)
    tableRowData.subRows = itemAttrValue.map(mapSubRowData);
  } else {
    assignMiscSingleRowData();

    if (['sharing', 'shareLevel'].includes(field.name)) {
      assignShareData();
    }
  }

  return tableRowData;

  function mapSubRowData(objectInList, index) {
    const itemId = objectInList._id || index;

    const subRowData = {
      itemPaths: {
        delete: rootPath + '/delete/' + field.name + '/' + itemId,
        reorder: rootPath + '/reorder/' + field.name + '/' + itemId,
        update: rootPath + '/update/' + field.name,
      },
      itemKey: field.name + '-' + index,
      objectInList,
    };

    if (field.allowUpdatingExistingValues) {
      if (dataType === 'tags') {
        subRowData.tagValue = item.tagValues[index];
        subRowData.editData = objectInList.getEditTableSettings(subRowData.tagValue);
      } else {
        subRowData.editData = true;
      }
    }

    return subRowData;
  }

  async function assignDataForDropdowns() {
    if (dataType == 'people') {
      // Use the list of unlinkedPeople if it has already been created.
      // (E.g., contains special requirements, is specially sorted,
      // or was already needed for something else.)
      // Otherwise get the default list of not-already-linked people.
      tableRowData.dataForDropdown.people = data.unlinkedPeople
        || await Person.getAvailableForItem(item);
      return;
    }
    // Source has 2 story attributes: belongs to 1 story + can be linked to many
    // other stories. Use the same list for both dropdowns; do not populate twice.
    // The single story must be in the list as the "current value". The many
    // stories are not in the list.
    // (Maybe consolidate these two fields with one single data type?)
    if (dataType === 'stories' || dataType === 'story') {
      if (!tableRowData.dataForDropdown.stories) {
        tableRowData.dataForDropdown.stories = await Story.getAvailableForItem(item);
      }
      return;
    }
    if (dataType === 'tags') {
      tableRowData.dataForDropdown.tags = await Tag.getAvailableForItem(item);
      return;
    }
  }

  function assignMiscSingleRowData() {
    tableRowData.originalValue = itemAttrValue;

    tableRowData.originalValueText = itemAttrValue
      ? (itemAttrValue._id || itemAttrValue)
      : itemAttrValue;

    if (tableRowData.inputType === 'textarea') {
      tableRowData.currentValueAsList = itemAttrValue
        ? itemAttrValue.split('\n')
        : [];
    }

    tableRowData.valueDropownOptions = tableRowData.fieldValueOptions
      .map((text, value) => {
        if (text) {
          return {text, value, selected: itemAttrValue === value};
        }
        // If there is no text, then that index should not be selected.
        // Example: person gender should be 1, 2, or 3, not 0.
        return false;
      }).filter(Boolean);
  }

  function assignShareData() {
    tableRowData.shareInfo = {
      imageValue: itemAttrValue === 2 || itemAttrValue === true,
    };

    if (tableRowData.fieldValueOptions.length) {
      tableRowData.shareInfo.shareText = tableRowData.fieldValueOptions[itemAttrValue];
    } else {
      tableRowData.shareInfo.shareText = itemAttrValue ? 'yes' : 'no';
    }

    if (item.canBeShared && !item.canBeShared()) {
      if (itemAttrValue) {
        tableRowData.shareInfo.showSourceWarning = true;
      } else {
        tableRowData.shareInfo.shareText += ' (story is not shared)';
      }
    }
  }
}
