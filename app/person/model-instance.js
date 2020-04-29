const mongoose = require('mongoose');
const getRelativesList = require('./getPersonRelativesList');

const methods = {};
module.exports = methods;

methods.getRelativesList = getRelativesList;

methods.addRelative = async function(relationship, relative) {
  const updatedPerson = {
    [relationship]: (this[relationship] || []).concat(relative)
  };

  await this.update(updatedPerson);
};

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

methods.toggleSharing = async function() {
  const updatedPerson = {
    sharing: this.sharing
  };
  updatedPerson.sharing.level += 1;
  if (updatedPerson.sharing.level === 3) {
    updatedPerson.sharing.level = 0;
  }
  await this.update(updatedPerson);
};

// RELATIVES

methods.attachParent = async function(relativeId) {
  const relative = await mongoose.model('Person').findById(relativeId);
  await _attachRelative(this, 'parents', relative);
  await _attachRelative(relative, 'children', this);
};

methods.detachParent = async function(relativeId) {
  const relative = await mongoose.model('Person').findById(relativeId);
  await _detachRelative(this, 'parents', relative);
  await _detachRelative(relative, 'children', this);
};

methods.attachSpouse = async function(relativeId) {
  const relative = await mongoose.model('Person').findById(relativeId);
  await _attachRelative(this, 'spouses', relative);
  await _attachRelative(relative, 'spouses', this);
};

methods.detachSpouse = async function(relativeId) {
  const relative = await mongoose.model('Person').findById(relativeId);
  await _detachRelative(this, 'spouses', relative);
  await _detachRelative(relative, 'spouses', this);
};

methods.attachChild = async function(relativeId) {
  const relative = await mongoose.model('Person').findById(relativeId);
  await _attachRelative(this, 'children', relative);
  await _attachRelative(relative, 'parents', this);
};

methods.detachChild = async function(relativeId) {
  const relative = await mongoose.model('Person').findById(relativeId);
  await _detachRelative(this, 'children', relative);
  await _detachRelative(relative, 'parents', this);
};

async function _attachRelative(person, relationship, relative) {
  const updatedPerson = {
    [relationship]: person[relationship].concat(relative)
  };

  await person.update(updatedPerson);
}

async function _detachRelative(person, relationship, relative) {
  const updatedPerson = {
    [relationship]: mongoose.model('Person')
      .removeFromList(person[relationship], relative)
  };

  await person.update(updatedPerson);
}
