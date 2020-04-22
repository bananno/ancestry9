const mongoose = require('mongoose');
const Image = mongoose.model('Image');
const Person = mongoose.model('Person');
const reorderList = require('./reorderList');

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

    if (specs.fields) {
      specs.fields.forEach(field => {
        if (field.multi) {
          this.addListAttribute(field);
          this.deleteListAttribute(field);
          this.reorderListAttribute(field);
        } else if (field.toggle) {
          this.toggleAttribute(field);
        } else {
          this.updateAttribute(field);
        }
      });
    }

    if (specs.toggleAttributes) {
      specs.toggleAttributes.forEach(fieldName => {
        this.toggleAttribute({name: fieldName});
      });
    }

    if (specs.singleAttributes) {
      specs.singleAttributes.forEach(fieldName => {
        this.updateAttribute({name: fieldName});
      });
    }

    if (specs.listAttributes) {
      specs.listAttributes.forEach(fieldName => {
        this.addListAttribute({name: fieldName});
        this.deleteListAttribute({name: fieldName});
        this.reorderListAttribute({name: fieldName});
      });
    }
  }

  postEdit(fieldName, callback) {
    this.router.post('/' + this.modelName + '/:id/edit/' + fieldName, callback);
  }

  updateAndRedirect(req, res, item, itemId, updatedObj, fieldName) {
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

  toggleAttribute(field) {
    const fieldName = field.name;
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
        this.updateAndRedirect(req, res, item, itemId, updatedObj);
      });
    });
  }

  updateAttribute(field) {
    const fieldName = field.name;
    this.postEdit(fieldName, (req, res, next) => {
      this.withItem(req, (item, itemId) => {
        const updatedObj = {};
        if (fieldName == 'date') {
          updatedObj[fieldName] = req.getFormDataDate();
        } else if (fieldName == 'location') {
          updatedObj[fieldName] = req.getFormDataLocation();
        } else {
          updatedObj[fieldName] = req.body[fieldName];
        }
        if (['story', 'source'].includes(fieldName)
            && ['0', ''].includes(updatedObj[fieldName])) {
          updatedObj[fieldName] = null;
        }
        this.updateAndRedirect(req, res, item, itemId, updatedObj, fieldName);
      });
    });
  }

  addListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/add/' + field.name;
    this.router.post(routePath, async (req, res) => {
      const newValue = req.body[field.name].trim();

      if (!newValue) {
        return res.send('error');
      }

      this.withItem(req, async (item, itemId) => {
        const newItem = await (async () => {
          if (field.name === 'images') {
            return await Image.create({url: newValue});
          }

          if (field.corresponding) {
            const relative = await Person.findById(newValue);
            await relative.addRelative(field.corresponding, item);
          }

          return newValue;
        })();

        const updatedObj = {};

        updatedObj[field.name] = (item[field.name] || []).concat(newItem);

        this.updateAndRedirect(req, res, item, itemId, updatedObj);
      });
    });
  }

  deleteListAttribute(field) {
    const fieldName = field.name;
    const routePath = '/' + this.modelName + '/:id/delete/' + fieldName + '/:deleteId';
    this.router.post(routePath, (req, res, next) => {
      this.withItem(req, async (item, itemId) => {
        const updatedObj = {};
        const deleteId = req.params.deleteId;

        const attrName = field.dataType || field.name;

        if (['people', 'stories', 'images'].includes(attrName)) {
          updatedObj[fieldName] = item[fieldName].filter(item => {
            return ('' + (item._id || item)) != deleteId;
          });
        } else {
          updatedObj[fieldName] = item[fieldName].filter((item, i) => {
            return i != deleteId;
          });
        }

        if (attrName === 'images') {
          const image = await Image.findById(deleteId);
          await image.remove();
        } else if (field.corresponding) {
          const relative = await Person.findById(deleteId);
          await relative.removeRelative(field.corresponding, item);
        }

        this.updateAndRedirect(req, res, item, itemId, updatedObj);
      });
    });
  }

  reorderListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/reorder/' + field.name + '/:orderId';
    this.router.post(routePath, (req, res) => {
      this.withItem(req, (item, itemId) => {
        const updatedObj = {};
        const orderId = req.params.orderId;
        const attrName = field.dataType || field.name;
        updatedObj[field.name] = reorderList(item[field.name], orderId, attrName);
        this.updateAndRedirect(req, res, item, itemId, updatedObj);
      });
    });
  }
}

module.exports = createModelRoutes;
