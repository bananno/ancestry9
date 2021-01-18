const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const Image = mongoose.model('Image');
const Person = mongoose.model('Person');
const reorderList = require('./reorderList');

module.exports = createController;

function createController(specs) {
  new Controller(specs);
}

class Controller {
  constructor(specs) {
    this.router = specs.router;
    this.Model = specs.Model;
    this.modelName = specs.modelName;
    this.modelNamePlural = specs.modelNamePlural || (specs.modelName + 's');

    // Where to redirect after submitting a form on the edit view.
    this.redirectTo = specs.editFromMainShowView ? '' : '/edit';

    const routes = specs.routes;

    const basePathGet = '/' + this.modelName + '/:id/';

    if (routes.index) {
      this.router.get('/' + this.modelNamePlural, routes.index);
    }

    if (routes.new) {
      this.router.get('/' + this.modelNamePlural + '/new', routes.new);
    }

    if (routes.create) {
      this.router.post('/' + this.modelNamePlural + '/new', routes.create);
    }

    if (routes.show) {
      this.router.get(basePathGet, routes.show);
    }

    if (routes.edit) {
      this.router.get(basePathGet + 'edit', routes.edit);
    }

    if (routes.delete) {
      this.router.post('/' + this.modelName + '/:id/delete', routes.delete);
    }

    if (routes.other) {
      for (let path in routes.other) {
        this.router.get(basePathGet + path, routes.other[path]);
      }
    }

    const {fields} = this.Model.constants();

    fields.forEach(field => {
      if (field.isList) {
        this.addListAttribute(field);
        this.deleteListAttribute(field);
        this.reorderListAttribute(field);
        if (field.allowUpdatingExistingValues) {
          this.updateListAttribute(field);
        }
      } else if (field.inputType === 'toggle') {
        this.toggleAttribute(field);
      } else {
        this.updateAttribute(field);
      }
    });
  }

  redirect({req, res, item, itemId, updatedObj, fieldName}) {
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
  }

  async getItem(req) {
    const itemId = req.params.id;

    if (ObjectId.isValid(itemId)) {
      const item = await this.Model.findById(itemId);
      if (item) {
        return {item, itemId};
      }
    }

    if (this.modelName === 'person') {
      const item = await Person.findOne({customId: itemId});
      return {item, itemId};
    }

    return {itemId};
  }

  toggleAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/edit/' + field.name;
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);
      if (!item) {
        return res.send('error');
      }
      if (field.onUpdate) {
        await field.onUpdate(item);
      } else if (field.valueNames) {
        let newValue = (item[field.name] || 0) + 1;
        if (newValue >= field.valueNames.length) {
          newValue = 0;
        }
        await item.update({[field.name]: newValue});
      } else {
        const updatedObj = {};
        const currentValue = item[field.name] || false;
        updatedObj[field.name] = !currentValue;
        await item.update(updatedObj);
      }
      this.redirect({req, res, item, itemId});
    });
  }

  updateAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/edit/' + field.name;
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);
      const updatedObj = {};

      if (field.name == 'date') {
        updatedObj[field.name] = req.getFormDataDate();
      } else if (field.name == 'location') {
        updatedObj[field.name] = req.getFormDataLocation();
      } else {
        updatedObj[field.name] = req.body[field.name];
      }

      if (['story', 'source'].includes(field.name)
          && ['0', ''].includes(updatedObj[field.name])) {
        updatedObj[field.name] = null;
      }

      await item.update(updatedObj);
      this.redirect({req, res, item, itemId, updatedObj, fieldName: field.name});
    });
  }

  addListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/add/' + field.name;
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);
      const newValue = req.body[field.name].trim();

      if (!item || !newValue) {
        return res.send('error');
      }

      if (field.onAdd) {
        await field.onAdd(item, newValue);
      } else if (field.dataType === 'tag') {
        if (item.tags.includes(newValue)) {
          return res.send('error - tag is already in the list');
        }

        const tagValue = req.body.tagValue.trim();
        const idx = item.tags.length;

        const updatedObj = {tags: item.tags, tagValues: item.tagValues};
        updatedObj.tags[idx] = newValue;
        updatedObj.tagValues[idx] = tagValue;

        await item.update(updatedObj);
      } else {
        const updatedObj = {
          [field.name]: (item[field.name] || [])
        };

        if (field.dataType === 'image') {
          const newItem = await Image.create({url: newValue});
          updatedObj[field.name].push(newItem);
        } else if (field.dataType === 'link') {
          const linkUrl = newValue;
          const linkText = req.body[field.name + 'Text'].trim();
          const newLink = linkUrl + (linkText ? ' ' + linkText : '');
          updatedObj[field.name].push(newLink);
        } else {
          updatedObj[field.name].push(newValue);
        }

        await item.update(updatedObj);
      }

      this.redirect({req, res, item, itemId});
    });
  }

  deleteListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/delete/' + field.name + '/:deleteId';
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);
      const deleteId = req.params.deleteId;

      if (field.onDelete) {
        await field.onDelete(item, deleteId);
      } else {
        const updatedObj = {};
        const dataType = field.dataType;

        if (['person', 'story', 'image'].includes(dataType)) {
          updatedObj[field.name] = item[field.name].filter(item => {
            return ('' + (item._id || item)) != deleteId;
          });
        } else if (dataType === 'tag') {
          const idx = item.tags.indexOf(deleteId);
          updatedObj.tags = item.tags.filter((item, i) => i != idx);
          updatedObj.tagValues = item.tagValues.filter((item, i) => i != idx);
        } else {
          updatedObj[field.name] = item[field.name].filter((item, i) => {
            return i != deleteId;
          });
        }

        if (dataType === 'image') {
          const image = await Image.findById(deleteId);
          await image.remove();
        }

        await item.update(updatedObj);
      }

      this.redirect({req, res, item, itemId});
    });
  }

  reorderListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/reorder/' + field.name + '/:orderId';
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);
      const updatedObj = {};
      const orderId = req.params.orderId;
      const dataType = field.dataType;

      if (dataType === 'tag') {
        const idx = item.tags.indexOf(orderId);
        updatedObj.tags = reorderList(item.tags, idx, dataType);
        updatedObj.tagValues = reorderList(item.tagValues, idx, dataType);
      } else {
        updatedObj[field.name] = reorderList(item[field.name], orderId, dataType);
      }

      await item.update(updatedObj);
      this.redirect({req, res, item, itemId, updatedObj});
    });
  }

  updateListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/update/' + field.name;
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);

      const updatedObj = {};
      const index = parseInt(req.body.index);

      if (field.dataType === 'tag') {
        const newValue = req.body.newValue.trim();
        updatedObj.tagValues = item.tagValues;
        updatedObj.tagValues[index] = newValue;
      } else if (field.dataType === 'link') {
        const linkUrl = req.body[field.name].trim();
        const linkText = req.body[field.name + 'Text'].trim();
        updatedObj[field.name] = item[field.name];
        updatedObj[field.name][index] = linkUrl + (linkText ? ' ' + linkText : '');
      } else {
        return res.send(`Route not implemented: update existing ${field.name} value`);
      }

      await item.update(updatedObj);
      this.redirect({req, res, item, itemId});
    });
  }
}
