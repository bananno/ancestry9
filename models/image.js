const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: String,
  tags: [String],
});

mongoose.model('Image', imageSchema);
