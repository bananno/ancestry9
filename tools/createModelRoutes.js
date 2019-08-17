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
    specs.updateAttributes = specs.updateAttributes || specs.attributes; // temp

    if (specs.editView || specs.editView === undefined) {
      this.redirectTo = '/edit';
    }

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
      this.router.get('/' + this.modelName + '/:id', specs.show);
    }

    if (specs.edit) {
      this.router.get('/' + this.modelName + '/:id/edit', specs.edit);
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

  updateAndRedirect(res, item, itemId, updatedObj) {
    item.update(updatedObj, err => {
      res.redirect('/' + this.modelName + '/' + itemId + this.redirectTo);
    });
  }

  toggleAttribute(fieldName) {
    this.postEdit(fieldName, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        const currentValue = item[fieldName] || false;
        updatedObj[fieldName] = !currentValue;
        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }

  updateAttribute(fieldName) {
    this.postEdit(fieldName, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        if (fieldName == 'date') {
          updatedObj[fieldName] = getDateValues(req);
        } else if (fieldName == 'location') {
          updatedObj[fieldName] = getLocationValues(req);
        } else {
          updatedObj[fieldName] = req.body[fieldName];
        }
        this.updateAndRedirect(res, item, itemId, updatedObj);
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

        if (fieldName == 'people') {
          updatedObj[fieldName] = removePersonFromList(item[fieldName], deleteId);
        } else {
          updatedObj[fieldName] = item[fieldName].filter((url, i) => {
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
