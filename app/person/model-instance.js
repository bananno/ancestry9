const mongoose = require('mongoose');
const getRelativesList = require('./getPersonRelativesList');
const tools = require('../tools/modelTools');

const methods = {};
module.exports = methods;

methods.getRelativesList = getRelativesList;
methods.getTagTitles = tools.getTagTitles;
methods.getTagValue = tools.getTagValue;

// These birth/death methods only to be used after populateBirthAndDeath()
methods.getBirthYear = function() {
  return this.birth && this.birth.date ? this.birth.date.year : undefined;
};
methods.getDeathYear = function() {
  return this.death && this.death.date ? this.death.date.year : undefined;
};
methods.getBirthCountry = function() {
  return this.birth && this.birth.location ? this.birth.location.country : undefined;
};
methods.getDeathCountry = function() {
  return this.death && this.death.location ? this.death.location.country : undefined;
};

methods.getImmigrationYear = async function() {
  if (!this.immigration) {
    const Event = mongoose.model('Event');
    this.immigration = await Event.findOne({people: this, title: 'immigration'});
  }
  return this.immigration && this.immigration.date ? this.immigration.date.year : undefined;
};

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
  return this.tags.some(tag => tag.title === 'living');
};

methods.isPublic = function() {
  return this.shareLevel === 2;
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
