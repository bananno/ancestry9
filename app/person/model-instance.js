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

// Populate tags before using these link methods.
methods.getMissingLinks = function() {
  const expectLinks = ['Ancestry', 'FamilySearch'];
  const wikitreeStatus = this.getTagValue('wikitree');
  if (wikitreeStatus !== 'ignore') {
    expectLinks.push('WikiTree');
  }
  if (this.living) {
    expectLinks.push('Facebook profile');
  } else {
    expectLinks.push('FindAGrave');
  }
  return expectLinks.filter(linkTitle => !this.getLink(linkTitle));
};
methods.getLink = function(linkType) {
  return this.links.find(link => link.match(linkType));
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

methods.isRoot = function() {
  return this.customId === 'anna-bidstrup';
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

methods.populateHighlightMentions = async function() {
  this.mentions = await mongoose.model('Highlight')
    .getMentionsForItem({linkPerson: this});
}

// Remove the added names [brackets] if applicable.
methods.getMaidenName = function() {
  return this.name.match('\\[')
    ? this.name.slice(0, this.name.indexOf('[')).trim()
    : this.name;
}

// Get all the info needed for the descendants chart.
methods.getDescendantChartInfo = function(data) {
  const {
    findPersonInList,
    marriageEvents, // all marriage-related events in the database
    people,
    toDoList,
    formatEventDate,
  } = data;

  const errors = [];

  const maidenName = this.getMaidenName();
  const numNameParts = maidenName.split(' ').length;
  if (numNameParts === 1) {
    toDoList.push({person: this, missing: 'name?'});
  } else if (numNameParts === 2) {
    toDoList.push({person: this, missing: 'middle name?'});
  }

  // Determine if any pieces of the birth event are missing.
  const birthDateIncomplete =
    getEventMissingPieces({person: this, event: this.birth, title: 'birth'});

  if (birthDateIncomplete) {
    errors.push('birth?');
  }

  if (!this.living) {
    const deathDateIncomplete =
      getEventMissingPieces({person: this, event: this.death, title: 'death'});

    if (deathDateIncomplete) {
      errors.push('death?');
    }
  }

  if (this.getTagValue('number of children') !== 'done') {
    errors.push('children?');
    toDoList.push({person: this, missing: 'children?'});
  }

  const childrenList = this.children.map(childId => findPersonInList(people, childId));

  const childrenListedSoFar = [];

  const personMarriageEvents = marriageEvents.filter(event =>
    findPersonInList(event.people, this));

  const spouseList = this.spouses.map(spouseId => {
    const spouse = findPersonInList(people, spouseId);
    const spouseErrors = [];

    const spouseChildren = childrenList.filter((child, i) => {
      if (findPersonInList(child.parents, spouse)) {
        childrenListedSoFar.push(child);
        return true;
      }
      return false;
    });

    let foundMarriageEvent = false;

    const marriageEventsFormat = personMarriageEvents.filter(event => {
      return findPersonInList(event.people, spouse);
    }).map(event => {
      if (event.title === 'marriage') {
        foundMarriageEvent = true;
        getEventMissingPieces({person: this, event});
        return 'married ' + formatEventDate(event);
      }
      return 'divorced ' + formatEventDate(event);
    }).join('; ');

    if (!foundMarriageEvent) {
      toDoList.push({
        person: spouse,
        missing: 'marriage event',
        priority: 2,
      });
      spouseErrors.push('marriage?');
    }

    if (!spouse.getBirthYear()) {
      spouseErrors.push('birth?');
    }

    if (!spouse.living && !spouse.getDeathYear()) {
      spouseErrors.push('death?');
    }

    return {
      spouse,
      spouseChildren,
      marriageEventsFormat,
      errorMessage: spouseErrors ? spouseErrors.join(' ') : undefined,
    };
  });

  const additionalChildren = this.children.filter(child => {
    if (!findPersonInList(childrenListedSoFar, child)) {
      toDoList.push({person: child, missing: 'parent', priority: 1});
      return true;
    }
    return false;
  });

  return {
    errors,
    maidenName,
    spouseList,
    additionalChildren,
  };

  // Add missing pieces of given event's date and location to the to-do list.
  // Return true if the event is missing any part of the date (not location though).
  function getEventMissingPieces({person, event, title}) {
    if (!event || !event.date || !event.date.year) {
      toDoList.push({person, missing: title + ' event', priority: 1});
      return true;
    }

    const eventTitle = title || event.title;
    let dateIsIncomplete = false;

    if (event.date.display) {
      toDoList.push({person, missing: `${eventTitle} date? "${event.date.display}"`});
      dateIsIncomplete = true;
    } else if (!event.date.month || !event.date.day) {
      toDoList.push({person, missing: eventTitle + ' - partial date'});
      dateIsIncomplete = true;
    }

    if (!event.location) {
      toDoList.push({person, missing: eventTitle + ' location'});
    } else if (event.location.country === 'United States') {
      // For purpose of this chart: if location is outside the US, don't worry about
      // missing more specific location info.
      if (!event.location.region1) {
        toDoList.push({person, missing: eventTitle + ' location'});
      } else if (!event.location.region2) {
        toDoList.push({
          person,
          missing: eventTitle + ' location - ' + (event.location.city ? 'county' : 'city/county'),
        });
      } else if (!event.location.city) {
        toDoList.push({person, missing: eventTitle + ' - location - city'});
      }
    }

    return dateIsIncomplete;
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
