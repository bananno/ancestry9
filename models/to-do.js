const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  items: Array,
});

mongoose.model('To-do', todoSchema);
