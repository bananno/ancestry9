var mongoose = require('mongoose');

var personSchema = new mongoose.Schema({
  name: String,
  customId: String,
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  spouses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  links: [String],
  share: Number,
});

mongoose.model('Person', personSchema);
