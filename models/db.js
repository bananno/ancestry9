const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ancestry', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
