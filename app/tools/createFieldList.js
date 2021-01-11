module.exports = createFieldList;

function createFieldList(modelName, options = {}) {
  const modelSchema = require(`../${modelName}/model-schema`);

  const fieldNames = modelSchema
    .filter(prop => prop.includeInExport)
    .map(prop => prop.name);

  const fields = modelSchema
    .filter(prop => {
      return prop.showInEditTable !== false;
    }).map(prop => {
      if (prop.specialType === 'tags') {
        prop.allowUpdatingExistingValues = true;
      }
      return {
        multi: prop.isArray,
        dataType: (options.useDataType && prop.references === 'Person')
          ? 'people' : undefined,
        ...prop
      }
    });

  return {fieldNames, fields};
}
