const reorderList = require('./reorderList');
const removePersonFromList = require('./removePersonFromList');
const getDateValues = require('./getDateValues');
const getLocationValues = require('./getLocationValues');

function createModelRoutes(specs) {
  new ModelRoutes(specs);
}

class ModelRoutes {
  constructor(specs) {
    this.router = specs.router;
    this.Model = specs.Model;
    this.modelName = specs.modelName;
    this.modelNamePlural = specs.modelNamePlural || (specs.modelName + 's');
    this.redirectTo = '';

    if (specs.editView !== false) {
      this.redirectTo = '/edit';
    }

    let basePathGet = '/' + this.modelName + '/:id/';

    if (specs.index) {
      this.router.get('/' + this.modelNamePlural, specs.index);
    }

    if (specs.new) {
      this.router.get('/' + this.modelNamePlural + '/new', specs.new);
    }

    if (specs.create) {
      this.router.post('/' + this.modelNamePlural + '/new', specs.create);
    }

    if (specs.show) {
      this.router.get(basePathGet, specs.show);
    }

    if (specs.edit) {
      this.router.get(basePathGet + 'edit', specs.edit);
    }

    if (specs.delete) {
      this.router.post('/' + this.modelName + '/:id/delete', specs.delete);
    }

    if (specs.otherRoutes) {
      for (let path in specs.otherRoutes) {
        this.router.get(basePathGet + path, specs.otherRoutes[path]);
      }
    }

    if (specs.toggleAttributes) {
      specs.toggleAttributes.forEach(fieldName => {
        this.toggleAttribute(fieldName);
      });
    }

    if (specs.singleAttributes) {
      specs.singleAttributes.forEach(fieldName => {
        this.updateAttribute(fieldName);
      });
    }

    if (specs.listAttributes) {
      specs.listAttributes.forEach(fieldName => {
        this.addListAttribute(fieldName);
        this.deleteListAttribute(fieldName);
        this.reorderListAttribute(fieldName);
      });
    }
  }

  postEdit(fieldName, callback) {
    this.router.post('/' + this.modelName + '/:id/edit/' + fieldName, callback);
  }

  updateAndRedirect(res, item, itemId, updatedObj, fieldName) {
    item.update(updatedObj, err => {
      let redirectId;

      if (this.modelName == 'person') {
        if (fieldName == 'customId') {
          redirectId = updatedObj.customId;
        } else {
          redirectId = req.paramPersonId;
        }
      } else {
        redirectId = itemId;
      }

      res.redirect('/' + this.modelName + '/' + redirectId + this.redirectTo);
    });
  }

  withItem(req, callback) {
    const itemId = req.params.id;
    this.Model.findById(itemId, (err, item) => {
      if (!item && this.modelName == 'person') {
        this.Model.find({ customId: itemId }, (err, item) => {
          callback(item[0], itemId);
        });
      } else {
        callback(item, itemId);
      }
    });
  }

  toggleAttribute(fieldName) {
    this.postEdit(fieldName, (req, res, next) => {
      this.withItem(req, (item, itemId) => {
        const updatedObj = {};
        if (fieldName == 'shareLevel') {
          updatedObj.sharing = item.sharing;
          updatedObj.sharing.level += 1;
          if (updatedObj.sharing.level == 3) {
            updatedObj.sharing.level = 0;
          }
        } else {
          const currentValue = item[fieldName] || false;
          updatedObj[fieldName] = !currentValue;
        }
        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }

  updateAttribute(fieldName) {
    this.postEdit(fieldName, (req, res, next) => {
      this.withItem(req, (item, itemId) => {
        const updatedObj = {};
        if (fieldName == 'date') {
          updatedObj[fieldName] = getDateValues(req);
        } else if (fieldName == 'location') {
          updatedObj[fieldName] = getLocationValues(req);
        } else {
          updatedObj[fieldName] = req.body[fieldName];
        }
        if (fieldName == 'story' && updatedObj[fieldName] == '0') {
          updatedObj[fieldName] = null;
        }
        this.updateAndRedirect(res, item, itemId, updatedObj, fieldName);
      });
    });
  }

  addListAttribute(fieldName) {
    const routePath = '/' + this.modelName + '/:id/add/' + fieldName;
    this.router.post(routePath, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        const newValue = req.body[fieldName].trim();
        if (newValue == '') {
          return;
        }
        updatedObj[fieldName] = (item[fieldName] || []).concat(newValue);
        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }

  deleteListAttribute(fieldName) {
    const routePath = '/' + this.modelName + '/:id/delete/' + fieldName + '/:deleteId';
    this.router.post(routePath, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        const deleteId = req.params.deleteId;

        if (['people', 'stories'].includes(fieldName)) {
          updatedObj[fieldName] = item[fieldName].filter(item => {
            return ('' + item._id) != deleteId;
          });
        } else {
          updatedObj[fieldName] = item[fieldName].filter((item, i) => {
            return i != deleteId;
          });
        }

        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }

  reorderListAttribute(fieldName) {
    const routePath = '/' + this.modelName + '/:id/reorder/' + fieldName + '/:orderId';
    this.router.post(routePath, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        const orderId = req.params.orderId;
        updatedObj[fieldName] = reorderList(item[fieldName], orderId, fieldName);
        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }
}

module.exports = createModelRoutes;
