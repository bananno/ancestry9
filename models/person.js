const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: String,
  customId: String,
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  spouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  tags: [String],
  profileImage: String,
  gender: Number,
  sharing: {
    level: { type: Number, default: 0 },
    name: { type: String, default: '' },
  },
});

personSchema.statics.findInList = findInList;
personSchema.statics.isSame = isSame;

mongoose.model('Person', personSchema);

function findInList(people, person) {
  return people.find(nextPerson => isSame(person, nextPerson));
}

function isSame(person1, person2) {
  const id1 = '' + (person1 ? (person1._id || person1) : 'null');
  const id2 = '' + (person2 ? (person2._id || person2) : 'null');
  return id1 === id2;
}
