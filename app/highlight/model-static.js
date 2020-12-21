const mongoose = require('mongoose');
const methods = {};
module.exports = methods;

methods.createFromForm = req => {
  const newHighlight = {
    source: req.sourceId,
    text: (req.body.text || '').trim(),
    instance: parseInt(req.body.instance),
  };

  if (!newHighlight.text) {
    return {error: 'missing text'};
  }

  if (isNaN(newHighlight.instance) || newHighlight.instance < 0) {
    return {
      error: 'invalid instance value',
      instance: req.body.instance,
    };
  }

  const type = req.body.type;

  if (type === 'person') {
    newHighlight.linkPerson = req.body.linkPerson;
  }

  return mongoose.model('Highlight').create(newHighlight);
};

methods.getForSource = source => {
  return mongoose.model('Highlight').find({source});
};
