const mongoose = require('mongoose');
const Source = mongoose.model('Source');
const Story = mongoose.model('Story');
const Citation = mongoose.model('Citation');
const Notation = mongoose.model('Notation');
const Person = mongoose.model('Person');
const tool = path => require('../../tools/' + path);
const createModelRoutes = tool('createModelRoutes');
const getDateValues = tool('getDateValues');
const getLocationValues = tool('getLocationValues');
const removePersonFromList = tool('removePersonFromList');
const sortPeople = tool('sortPeople');
const sortCitations = tool('sortCitations');
const sortSources = tool('sortSources');

const mainSourceTypes = ['document', 'index', 'cemetery', 'newspaper',
  'photo', 'website', 'book', 'other'];

module.exports = createRoutes;

function createRoutes(router) {
  createModelRoutes({
    Model: Source,
    modelName: 'source',
    router: router,
    index: getSourcesIndex('none'),
    new: null,
    create: createSource,
    show: showSource,
    edit: editSource,
    delete: deleteSource,
    otherRoutes: {
      'notations': showSourceNotations,
      'mentions': showSourceMentions,
      'fastCitations': editSourceFastCitations,
    },
    toggleAttributes: ['sharing'],
    singleAttributes: ['title', 'content', 'notes', 'summary',
      'date', 'location', 'story'],
    listAttributes: ['people', 'links', 'images', 'tags', 'stories'],
  });

  mainSourceTypes.forEach(sourceType => {
    router.get('/sources/' + sourceType, getSourcesIndex(sourceType));
  });

  router.post('/source/:id/createNotation', createSourceNotation);
  router.post('/source/:id/createCitationNotation', createSourceCitationTextNotation);
}

function getSourcesIndex(subview) {
  return (req, res, next) => {
    Source.find({})
    .populate('people')
    .populate('story')
    .exec((err, sources) => {
      if (err) {
        return console.error(err);
      }

      sources = filterSourcesByType(sources, subview);

      sortSources(sources, 'story');

      res.render('layout', {
        view: 'sources/index',
        title: 'Sources',
        sources: sources,
        subview: subview,
        mainSourceTypes: mainSourceTypes,
      });
    });
  };
}

function createSource(req, res) {
  const newItem = {
    type: req.body.type.trim(),
    title: req.body.title.trim(),
    story: req.body.story,
  };

  newItem.date = getDateValues(req);
  newItem.location = getLocationValues(req);

  if (newItem.title == '') {
    return res.send('Title is required.');
  }

  mongoose.model('Source').create(newItem, (err, source) => {
    if (err) {
      return res.send('There was a problem adding the information to the '
        + 'database.<br>' + err);
    }
    res.redirect('/source/' + source._id + '/edit');
  });
}

function withSource(req, res, options, callback) {
  const sourceId = req.params.id;
  Source.findById(sourceId)
  .populate('people')
  .populate('story')
  .populate('stories')
  .populate('images')
  .exec((err, source) => {
    if (source == null) {
      return res.send('Source not found');
    }
    if (!options) {
      return callback(source);
    }
    const data = { source };
    if (options.citationText == 'source only') {
      return withCitationText(source, false, citationText => {
        data.citationText = citationText;
        callback(data);
      });
    }
    if (options.citationText) {
      return withCitationText(source, true, citationText => {
        data.citationText = citationText;
        callback(data);
      });
    }
    callback(data);
  });
}

function withCitationText(source, includeStory, callback) {
  mongoose.model('Notation')
  .find({ title: 'source citation', source: source})
  .exec((err, sourceNotation) => {
    if (!includeStory) {
      return callback(sourceNotation.map(notation => {
        return notation.text;
      }));
    }
    mongoose.model('Notation')
    .find({ title: 'source citation', stories: [source.story]})
    .exec((err, storyNotation) => {
      callback([...sourceNotation, ...storyNotation].map(notation => {
        return notation.text;
      }));
    });
  });
}

function showSource(req, res) {
  withSource(req, res, { citationText: true }, data => {
    const { source, citationText } = data;
    mongoose.model('Citation').find({ source: source }).populate('person')
    .exec((err, citations) => {
      res.render('layout', {
        view: 'sources/layout',
        subview: 'show',
        title: source.story.title + ' - ' + source.title,
        source: source,
        citations: sortCitations(citations, 'item', source.people),
        citationsByPerson: sortCitations(citations, 'person', source.people),
        citationText,
      });
    });
  });
}

function showSourceNotations(req, res, next) {
  withSource(req, res, null, source => {
    Notation
    .find({ source: source })
    .populate('people')
    .populate('stories')
    .exec((err, notations) => {
      res.render('layout', {
        view: 'sources/layout',
        subview: 'notations',
        title: source.story.title + ' - ' + source.title,
        source,
        notations,
      });
    });
  });
}

function showSourceMentions(req, res, next) {
  withSource(req, res, {mentions: true}, ({source}) => {
    Notation
    .find({source, tags: 'mentions'})
    .populate('people')
    .exec((err, notations) => {
      res.render('layout', {
        view: 'sources/layout',
        subview: 'mentions',
        title: source.story.title + ' - ' + source.title,
        source,
        notations,
      });
    });
  });
}

function editSource(req, res, next) {
  withSource(req, res, {citationText: 'source only'}, data => {
    const {source, citationText} = data;
    Person.find({ }).exec((err, people) => {
      Citation.find({ source: source }).populate('person')
      .exec((err, citations) => {
        Story.find({}, (err, stories) => {
          stories.sort((a, b) => a.title < b.title ? -1 : 1);

          res.render('layout', {
            view: 'sources/layout',
            subview: 'edit',
            title: 'Edit Source',
            source: source,
            people: sortPeopleListForNewCitations(source, people, citations),
            stories: stories,
            citations: sortCitations(citations, 'item', source.people),
            citationsByPerson: sortCitations(citations, 'person', source.people),
            needCitationText: source.story.title.match('Census')
              && citationText.length == 0
          });
        });
      });
    });
  });
}

function sortPeopleListForNewCitations(source, people, citations) {
  source.people.forEach(thisPerson => {
    people = removePersonFromList(people, thisPerson);
  });

  sortPeople(people, 'name');

  const citationsPeople = [];
  const tempPeople = source.people.map(person => '' + person._id);
  citations.forEach(citation => {
    if (!tempPeople.includes('' + citation.person._id)) {
      tempPeople.push('' + citation.person._id);
      citationsPeople.push(citation.person);
      people = removePersonFromList(people, citation.person);
    }
  });

  return [...source.people, ...citationsPeople, ...people];
}

function editSourceFastCitations(req, res, next) {
  withSource(req, res, null, source => {
    Person.find({ }).exec((err, people) => {
      Citation.find({ source: source }).populate('person')
      .exec((err, citations) => {
        Story.find({}, (err, stories) => {
          sortPeople(people, 'name');

          source.people.forEach(thisPerson => {
            people = removePersonFromList(people, thisPerson);
          });

          people = [...source.people, ...people];

          stories.sort((a, b) => a.title < b.title ? -1 : 1);

          res.render('layout', {
            view: 'sources/layout',
            subview: 'fastCitations',
            title: 'Edit Source',
            source: source,
            people: people,
            stories: stories,
            citations: sortCitations(citations, 'item', source.people),
            citationsByPerson: sortCitations(citations, 'person', source.people),
          });
        });
      });
    });
  });
}

function createSourceNotation(req, res, next) {
  withSource(req, res, null, source => {
    const newNotation = {
      title: req.body.title.trim(),
      text: req.body.text.trim(),
      source,
    };
    Notation.create(newNotation, (err, notation) => {
      if (err) {
        return res.send('There was a problem adding the information to the database.');
      }
      res.redirect('/source/' + source._id + '/notations');
    });
  });
}

function createSourceCitationTextNotation(req, res, next) {
  withSource(req, res, null, source => {
    const newNotation = {
      title: 'source citation',
      text: req.body.text.trim(),
      source,
    };
    Notation.create(newNotation, (err, notation) => {
      if (err) {
        return res.send('There was a problem adding the information to the database.');
      }
      res.redirect('/source/' + source._id + '/edit');
    });
  });
}

function filterSourcesByType(sources, type) {
  if (type == 'none') {
    return sources;
  }

  if (type == 'photo') {
    return sources.filter(source => source.story.title == 'Photo');
  }

  if (type == 'other') {
    return sources.filter(source => {
      let storyType = source.story.type.toLowerCase();
      return source.story.title != 'Photo'
        && storyType == 'other' || !mainSourceTypes.includes(storyType);
    });
  }

  return sources.filter(source => source.story.type.toLowerCase() == type);
}

function deleteSource(req, res, next) {
  withSource(req, res, null, source => {
    source.delete(() => {
      res.redirect('/sources');
    });
  });
}
