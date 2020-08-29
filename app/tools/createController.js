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

    specs.fields.forEach(field => {
      if (field.multi) {
        this.addListAttribute(field);
        this.deleteListAttribute(field);
        this.reorderListAttribute(field);
      } else if (field.inputType === 'toggle') {
        this.toggleAttribute(field);
      } else {
        this.updateAttribute(field);
      }
    });
  }

  redirect(req, res, item, itemId, updatedObj, fieldName) {
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
      } else if (field.maxValue) {
        let newValue = (item[field.name] || 0) + 1;
        if (newValue > field.maxValue) {
          newValue = 0;
        }
        await item.update({[field.name]: newValue});
      } else {
        const updatedObj = {};
        const currentValue = item[field.name] || false;
        updatedObj[field.name] = !currentValue;
        await item.update(updatedObj);
      }
      this.redirect(req, res, item, itemId);
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
      this.redirect(req, res, item, itemId, updatedObj, field.name);
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
      } else if (field.name === 'tags') {
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

        if (field.name === 'images') {
          const newItem = await Image.create({url: newValue});
          updatedObj[field.name].push(newItem);
        } else {
          updatedObj[field.name].push(newValue);
        }

        await item.update(updatedObj);
      }

      this.redirect(req, res, item, itemId);
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
        const attrName = field.dataType || field.name;

        if (['people', 'stories', 'images'].includes(attrName)) {
          updatedObj[field.name] = item[field.name].filter(item => {
            return ('' + (item._id || item)) != deleteId;
          });
        } else if (attrName === 'tags') {
          const idx = item.tags.indexOf(deleteId);
          updatedObj.tags = item.tags.filter((item, i) => i != idx);
          updatedObj.tagValues = item.tagValues.filter((item, i) => i != idx);
        } else {
          updatedObj[field.name] = item[field.name].filter((item, i) => {
            return i != deleteId;
          });
        }

        if (attrName === 'images') {
          const image = await Image.findById(deleteId);
          await image.remove();
        }

        await item.update(updatedObj);
      }

      this.redirect(req, res, item, itemId);
    });
  }

  reorderListAttribute(field) {
    const routePath = '/' + this.modelName + '/:id/reorder/' + field.name + '/:orderId';
    this.router.post(routePath, async (req, res) => {
      const {item, itemId} = await this.getItem(req);
      const updatedObj = {};
      const orderId = req.params.orderId;
      const attrName = field.dataType || field.name;

      if (attrName === 'tags') {
        const idx = item.tags.indexOf(orderId);
        updatedObj.tags = reorderList(item.tags, idx, attrName);
        updatedObj.tagValues = reorderList(item.tagValues, idx, attrName);
      } else {
        updatedObj[field.name] = reorderList(item[field.name], orderId, attrName);
      }

      await item.update(updatedObj);
      this.redirect(req, res, item, itemId, updatedObj);
    });
  }
}
