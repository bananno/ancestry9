const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

methods.getFormDataNew = req => {
  const storyTitle = req.body.title.trim();

  if (!storyTitle) {
    return false;
  }

  const newTag = {
    title: storyTitle,
  };

  return newTag;
};
