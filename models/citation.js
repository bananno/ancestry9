var mongoose = require('mongoose');

var citationSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  item: String,
  information: String,
});

mongoose.model('Citation', citationSchema);
