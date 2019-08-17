const mongoose = require('mongoose');
const createRoutes = {};

module.exports = createRoutes;

createRoutes.toggleAttribute = (router, Model, modelName, fieldName) => {
  const postPath = '/' + modelName + '/:id/edit/' + fieldName;

  router.post(postPath, (req, res, next) => {
    console.log('yassss ' + modelName)
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
};
