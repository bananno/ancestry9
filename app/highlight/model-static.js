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
  } else if (type === 'story') {
    newHighlight.linkStory = req.body.linkStory;
  }

  return mongoose.model('Highlight').create(newHighlight);
};

methods.processForContent = (content, highlights) => {
  highlights.forEach(highlight => highlight.processForContent(content));

  highlights.sort((a, b) => a.characterIndex - b.characterIndex);

  let remainingContent = content;
  let contentSoFar = '';
  let lengthSoFar = 0;

  highlights.forEach((highlight, i) => {
    highlight.placeholderId = 'INSERT-HIGHLIGHT-' + i;

    if (highlight.characterIndex < 0) {
      return;
    }

    if (highlight.characterIndex < lengthSoFar) {
      // skipHighlight = do not even highlight the text
      highlight.skipHighlight = true;
      highlight.addError('OVERLAP');
      return;
    }

    const startIndex = highlight.characterIndex - lengthSoFar;
    const endIndex = startIndex + highlight.actualText.length;

    const contentBefore = remainingContent.slice(0, startIndex);
    remainingContent = remainingContent.slice(endIndex);

    lengthSoFar += contentBefore.length + highlight.actualText.length;

    contentSoFar += contentBefore + highlight.placeholderId;
  });

  contentSoFar += remainingContent;

  return contentSoFar;
};
