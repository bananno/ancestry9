const mongoose = require('mongoose');
const methods = {};
module.exports = methods;

methods.addError = function(errorMsg) {
  if (!this.errors) {
    this.errors = [];
  }
  this.errors.push(errorMsg);
};

methods.getRegex = function() {
  let text = this.text;
  text = text.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  return new RegExp(text, 'gi');
};

// Use given content to assign temporary attributes to this highlight.
methods.processForContent = function(content) {
  const regex = this.getRegex();

  const matches = content.match(regex);

  if (!matches || this.instance >= matches.length) {
    this.actualText = this.text;
    this.characterIndex = -1;
    this.addError('NOT FOUND');
    // Note: skipHighlight can also occur if highlights overlap.
    this.skipHighlight = true;
    return;
  }

  // The "text" attribute is not case-sensitive so cannot be used to print content.
  // The "actualText" attribute represents the exact original text.
  this.actualText = matches[this.instance];

  // Find exactly where this highlight appears in the original text.
  // Accounts for skipped occurances.
  // Does not account for formatting changes to the text when printing.
  // This property needs to be populated for all highlights before the
  // highlights can be sorted or the placeholders can be injected.
  // (Note: characterIndex cannot be stored because it could change, e.g., if
  // spacing or or punctuation is corrected.)
  this.characterIndex = content.split(regex).slice(0, this.instance + 1).join('').length
    + (this.text.length * this.instance);

  // If "linkPath" is not populated, this highlight will be marked/highlighted
  // in the text but won't contain a link.
  if (this.linkPerson) {
    this.linkPath = '/person/' + this.linkPerson._id;
  } else if (this.linkStory) {
    this.linkPath = '/story/' + this.linkStory._id;
  }
};
