const {
  Event,
  Image,
  Notation,
  Person,
  Story,
  Source,
} = require('../import');

const tagTools = require('./tools');
const mongoose = require('mongoose');
module.exports = createRoutes;

function createRoutes(router) {
  router.get('/tags', tagIndex);
  router.get('/tag/:tag', tagShow);
  router.post('/tag/newDefinition', createTagDefinition);
  router.post('/tag/updateDefinition', updateTagDefinition);
}

async function tagIndex(req, res) {
  const tags = await tagTools.getTagIndexData();

  res.render('tag/index', {
    title: 'Tags',
    tagsDefined: tags.filter(tag => tag.definition),
    tagsUndefined: tags.filter(tag => !tag.definition),
    totalNumTags: tags.length
  });
}

async function tagShow(req, res) {
  const tag = req.params.tag.split('_').join(' ');

  const data = await tagTools.getTagShowData(tag);

  const definition = await Notation
    .findOne({title: tag, tags: 'tag definition'});

  res.render('tag/show', {
    title: 'Tag: ' + tag,
    tag,
    data,
    definition,
  });
}

function createTagDefinition(req, res) {
  const tag = req.body.tag;
  const newNotation = {
    title: tag,
    tags: ['tag definition'],
    text: req.body.text
  };
  mongoose.model('Notation').create(newNotation, (err, notation) => {
    return res.redirect('/tag/' + tag);
  });
}

function updateTagDefinition(req, res) {
  const tag = req.body.tag;
  const notationId = req.body.notation;
  const updatedNotation = {
    text: req.body.text
  };
  mongoose.model('Notation').findById(notationId, (err, notation) => {
    notation.update(updatedNotation, err => {
      return res.redirect('/tag/' + tag);
    });
  });
}
