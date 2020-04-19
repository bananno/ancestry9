const {
  Citation,
  Event,
  Notation,
  Person,
  Story,
  Source,
} = require('../import');

const constants = require('./constants');
const {fields} = constants;

module.exports = getSharedData;

async function getSharedData() {
  const raw = {};
  const data = {};

  raw.stories = await Story.find({sharing: true}).populate('images');
  raw.sources = await Source.find({sharing: true}).populate('images')

  data.citations = await Citation.getAllSharedData();
  data.events = await Event.getAllSharedData();
  data.notations = await Notation.getAllSharedData();

  const rawPeople = await Person.find({});
  const ancestors = {};

  const anna = rawPeople.find(person => person.name === 'Anna Peterson');

  anna.parents.forEach((person, i) => findAncestors(person, i + 1, 1));

  function findAncestors(personId, treeSide, degree) {
    personId += '';
    ancestors[personId] = [treeSide, degree];
    const person = rawPeople.find(person => person._id + '' == personId);
    person.parents.forEach(parent => findAncestors(parent, treeSide, degree + 1));
  }

  const tempPersonRef = {};
  const tempStoryRef = {};

  data.people = rawPeople.map(personInfo => {
    if (personInfo.sharing.level == 0) {
      return null;
    }

    let person = {};

    fields.personEveryone.forEach(key => {
      person[key] = personInfo[key];
    });

    person._id += '';

    if (ancestors[person._id]) {
      person.leaf = ancestors[person._id][0];
      person.degree = ancestors[person._id][1];
    }

    if (personInfo.sharing.level == 1) {
      person.private = true;
      person.name = personInfo.sharing.name || 'Person';
      person.customId = personInfo._id;
      person.tags = {};
      return person;
    }

    person.private = false;

    fields.personShared.forEach(key => {
      person[key] = personInfo[key];
    });

    tempPersonRef['' + person._id] = true;

    person.tags = convertTags(personInfo);

    return person;
  }).filter(Boolean);

  data.people.forEach(person => {
    if (person.tags['number of children'] == 'done') {
      // some children might not be shared and will be removed from list later
      person.tags['number of children'] = person.children.length;
    } else if (person.tags['number of children'] == 'too distant'
        || person.tags['number of children'] == 'unknown') {
      person.tags['number of children'] = null;
    }
  });

  data.stories = raw.stories.map(storyInfo => {
    const story = {};
    fields.story.forEach(attr => story[attr] = storyInfo[attr]);
    story.tags = convertTags(storyInfo);
    story.people = story.people.filter(personId => tempPersonRef['' + personId]);

    story.images = storyInfo.images.map(imageRaw => {
      const image = {};
      fields.image.forEach(attr => image[attr] = imageRaw[attr]);
      image.tags = convertTags(image);
      return image;
    });

    tempStoryRef[story._id] = story;
    return story;
  });

  data.sources = raw.sources.map(sourceInfo => {
    const source = {};
    fields.source.forEach(attr => source[attr] = sourceInfo[attr]);
    source.tags = convertTags(sourceInfo);
    source.people = source.people.filter(personId => tempPersonRef['' + personId]);

    source.images = sourceInfo.images.map(imageRaw => {
      const image = {};
      fields.image.forEach(attr => image[attr] = imageRaw[attr]);
      image.tags = convertTags(image);
      return image;
    });

    const tempStory = tempStoryRef[source.story._id];
    source.fullTitle = tempStory.title + ' - ' + source.title;

    return source;
  });

  data.places = {
    list: [],
    items: [],
  };

  [...data.events, ...data.sources].forEach(item => {
    if (item.location == null) {
      return;
    }
    const places = [
      item.location.country || 'other', item.location.region1 || 'other',
      item.location.region2 || 'other', item.location.city || 'other'];

    let tempObj = data.places;

    for (let i = 0; i < 4; i++) {
      if (tempObj[places[i]] == null) {
        tempObj.list.push(places[i]);
        tempObj[places[i]] = {
          list: [],
          items: [],
        };
      }
      tempObj = tempObj[places[i]];
    }
  });

  data.countryList = Person.getAllCountriesOfOrigin(data.people);

  return data;
}

function convertTags(obj) {
  const tags = {};
  obj.tags.forEach(tag => {
    if (tag.match('=')) {
      let [key, value] = tag.split('=').map(s => s.trim());
      tags[key] = value;
    } else {
      tags[tag] = true;
    }
  });
  return tags;
}
