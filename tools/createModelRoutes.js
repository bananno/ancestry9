
function createModelRoutes(specs) {
  const router = specs.router;
  const Model = specs.Model;
  const modelName = specs.modelName;

  if (specs.attributes.toggle) {
    specs.attributes.toggle.forEach(fieldName => {
      toggleAttribute(router, Model, modelName, fieldName);
    });
  }

  if (specs.attributes.text) {
    specs.attributes.text.forEach(fieldName => {
      textAttribute(router, Model, modelName, fieldName);
    });
  }
}

function toggleAttribute(router, Model, modelName, fieldName) {
  const postPath = '/' + modelName + '/:id/edit/' + fieldName;

  router.post(postPath, (req, res, next) => {
    const itemId = req.params.id;

    Model.findById(itemId, (err, item) => {
      const updatedObj = {};
      const currentValue = item[fieldName] || false
      updatedObj[fieldName] = !currentValue;

      item.update(updatedObj, err => {
        res.redirect('/' + modelName + '/' + itemId + '/edit');
      });
    });
  });
}

function textAttribute(router, Model, modelName, fieldName) {
  const postPath = '/' + modelName + '/:id/edit/' + fieldName;

  router.post(postPath, (req, res, next) => {
    const itemId = req.params.id;

    Model.findById(itemId, (err, item) => {
      const updatedObj = {};
      updatedObj[fieldName] = req.body[fieldName];

      item.update(updatedObj, err => {
        res.redirect('/' + modelName + '/' + itemId + '/edit');
      });
    });
  });
}

module.exports = createModelRoutes;
