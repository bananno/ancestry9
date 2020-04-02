const {
  Notation,
  Source,
} = require('../import');

module.exports = {
  createCiteText,
  createNotation,
  deleteSource,
};

async function createCiteText(req, res) {
  const newNotation = {
    title: 'source citation',
    text: req.body.text.trim(),
    source: req.sourceId,
  };

  await Notation.create(newNotation);

  res.redirect('/source/' + req.sourceId + '/edit');
}

async function createNotation(req, res) {
  const newNotation = {
    title: req.body.title.trim(),
    text: req.body.text.trim(),
    source: req.sourceId,
  };

  await Notation.create(newNotation);

  res.redirect('/source/' + req.sourceId + '/notations');
}

async function deleteSource(req, res) {
  await Source.deleteOne({_id: req.sourceId});
  res.redirect('/sources');
}
