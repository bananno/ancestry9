const {
  Notation,
} = require('../import');

module.exports = {
  convertParamNotationId,
  createRenderNotation,
};

async function convertParamNotationId(req, res, next, notationId) {
  if (req.originalUrl.slice(0, 10) !== '/notation/') {
    return next();
  }

  req.notationId = notationId;
  req.rootPath = '/notation/' + notationId;

  const notation = await Notation
    .findById(notationId)
    .populate('source')
    .populate('people')
    .populate('stories')
    .populate('tags');

  if (!notation) {
    return res.send('Notation not found.');
  }

  if (notation.source) {
    await notation.source.populateStory();
  }

  req.notation = notation;
  next();
}

function createRenderNotation(req, res, next) {
  res.renderNotation = (subview, options = {}) => {
    res.render('notation/' + subview, {
      title: 'Notation',
      notation: req.notation,
      rootPath: req.rootPath,
      ...options
    });
  };
  next();
}
