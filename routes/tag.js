const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

router.get('/tags', tagIndex);
router.get('/tag/:tag', tagShow);

function tagIndex(req, res, next) {
  const tags = {};
  const definitions = {};

  function getAllTags(modelName, resolve) {
    mongoose.model(modelName).find({}, (err, items) => {
      items.forEach(item => {
        item.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      });
      resolve(items);
    });
  }

  new Promise(resolve => {
    getAllTags('Person', resolve);
  }).then(() => {
    return new Promise(resolve => {
      getAllTags('Source', resolve);
    });
  }).then(() => {
    return new Promise(resolve => {
      getAllTags('Story', resolve);
    });
  }).then(() => {
    return new Promise(resolve => {
      getAllTags('Event', resolve);
    });
  }).then(() => {
    return new Promise(resolve => {
      getAllTags('Notation', notations => {
        notations
        .filter(notation => notation.tags.includes('tag definition'))
        .forEach(notation => {
          definitions[notation.title] = notation.text;
        });
        resolve();
      });
    });
  }).then(() => {
    res.render('layout', {
      view: 'tags/index',
      title: 'Tags',
      tags,
      definitions,
    });
  });
}

function tagShow(req, res) {
  const tag = req.params.tag.split('_').join(' ');
  const data = {};

  function getItemsWithTag(modelName, variableName, resolve) {
    mongoose.model(modelName).find({}, (err, items) => {
      data[variableName] = items.filter(item => {
        return item.tags.map(tag => tag.split('=')[0].trim()).includes(tag);
      });
      resolve();
    });
  }

  new Promise(resolve => {
    getItemsWithTag('Person', 'people', resolve);
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Source').find({}).populate('story')
      .exec((err, items) => {
        data['sources'] = items.filter(item => {
          return item.tags.map(tag => tag.split('=')[0].trim()).includes(tag);
        });
        resolve();
      });
    });
  }).then(() => {
    return new Promise(resolve => {
      getItemsWithTag('Story', 'stories', resolve);
    });
  }).then(() => {
    return new Promise(resolve => {
      getItemsWithTag('Event', 'events', resolve);
    });
  }).then(() => {
    return new Promise(resolve => {
      getItemsWithTag('Notation', 'notations', resolve);
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Notation')
      .findOne({title: tag, tags: ['tag definition']})
      .exec((err, notation) => {
        resolve(notation);
      });
    });
  }).then(definition => {
    res.render('layout', {
      view: 'tags/show',
      title: 'Tag: ' + tag,
      tag,
      data,
      definition,
    });
  });
}
