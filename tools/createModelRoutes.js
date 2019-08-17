
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

    if (specs.create) {
      this.router.post('/' + this.modelNamePlural + '/new', specs.create);
    }

    if (specs.show) {
      this.router.get('/' + this.modelName + '/:id', specs.show);
    }

    if (specs.edit) {
      this.router.get('/' + this.modelName + '/:id/edit', specs.edit);
    }

    if (specs.updateAttributes.toggle) {
      specs.updateAttributes.toggle.forEach(fieldName => {
        this.toggleAttribute(fieldName);
      });
    }

    if (specs.updateAttributes.text) {
      specs.updateAttributes.text.forEach(fieldName => {
        this.textAttribute(fieldName);
      });
    }

    if (specs.updateAttributes.list) {
      specs.updateAttributes.list.forEach(fieldName => {
        this.addListAttribute(fieldName);
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

  textAttribute(fieldName) {
    this.postEdit(fieldName, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        updatedObj[fieldName] = req.body[fieldName];
        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }

  addListAttribute(fieldName) {
    this.postEdit(fieldName, (req, res, next) => {
      const itemId = req.params.id;
      this.Model.findById(itemId, (err, item) => {
        const updatedObj = {};
        const newValue = req.body[editField].trim();
        if (newValue == '') {
          return;
        }
        updatedObj[editField] = (item[editField] || []).concat(newValue);
        this.updateAndRedirect(res, item, itemId, updatedObj);
      });
    });
  }
}

module.exports = createModelRoutes;
