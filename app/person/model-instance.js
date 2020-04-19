const mongoose = require('mongoose');
const methods = {};
module.exports = methods;

methods.getLifeEvents = async function() {
  const Event = mongoose.model('Event');
  const events = await Event.find({people: this}).populate('people');
  Event.sortByDate(events);
  return events;
};

methods.isLiving = function() {
  return this.tags.includes('living');
};

methods.isPublic = function() {
  return this.sharing.level === 2;
};

methods.populateBirthAndDeath = async function() {
  const Event = mongoose.model('Event');

  this.birth = await Event.findOne({title: 'birth', people: this});
  this.death = await Event.findOne({title: 'death', people: this});

  if (!this.birth && !this.death) {
    const double = await Event.findOne({title: 'birth and death', people: this});
    if (double) {
      this.birth = double;
      this.death = double;
    }
  }
};

methods.populateSiblings = async function() {
  const Person = mongoose.model('Person');
  const done = {};
  done[this._id] = true;

  this.siblings = [];

  for (let parentIndex in this.parents) {
    const parent = this.parents[parentIndex];

    for (let childIndex in parent.children) {
      const childId = parent.children[childIndex];

      if (done[childId]) {
        continue;
      }

      done[childId] = true;
      const sibling = await Person.findById(childId);
      this.siblings.push(sibling);
    }
  }
};
