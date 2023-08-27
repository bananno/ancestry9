const mongoose = require('mongoose');
const {pick} = require('lodash');

module.exports = getAllSharedData;

async function getAllSharedData() {
  const rawPeople = await mongoose.model('Person').find({}).populate('tags');
  const ancestors = {};

  const root = rawPeople.find(person => person.isRoot());

  root.parents.forEach((personId, i) => findAncestors(personId, i + 1, 1));

  // Create the map of direct ancestors to be used for assigning leaf type and
  // ancestor degree.
  function findAncestors(personId, treeSide, degree) {
    personId += '';
    ancestors[personId] = [treeSide, degree];
    const person = rawPeople.find(person => person._id + '' == personId);
    person.parents.forEach(parent => findAncestors(parent, treeSide, degree + 1));
  }

  const people = rawPeople.map(rawPerson => {
    if (rawPerson.shareLevel === 0) {
      return false;
    }

    let person = {
      id: String(rawPerson._id),
      childIds: rawPerson.children,
      parentIds: rawPerson.parents,
      spouseIds: rawPerson.spouses,
    };

    if (ancestors[person.id]) {
      person.leaf = ancestors[person.id][0];
      person.degree = ancestors[person.id][1];
    }

    if (rawPerson.shareLevel == 1) {
      return {
        ...person,
        private: true,
        name: rawPerson.shareName || 'Person',
        customId: person.id,
        tags: {},
        links: [],
      };
    }

    return {
      ...person,
      ...pick(rawPerson, ['name', 'customId', 'profileImage', 'gender']),
      private: false,
      tags: getSharedTagObj(rawPerson),
      links: rawPerson.links.map(link => {
        const arr = link.split(' ');
        return {url: arr.shift(), text: arr.join(' ')};
      }),
    };
  }).filter(Boolean);

  return people;
}

////////////

function getSharedTagObj(rawPerson) {
  const tags = rawPerson.convertTags();

  if (tags['number of children'] === 'done') {
    // some children might not be shared and will be removed from list later
    tags['number of children'] = rawPerson.children.length;
  } else if (tags['number of children'] === 'too distant'
      || tags['number of children'] === 'unknown') {
    tags['number of children'] = null;
  }

  return tags;
};