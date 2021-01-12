const {
  Event,
  Person,
  Tag,
  createController,
  modelFields,
  getEditTableRows,
} = require('../import');

const constants = require('./constants');
module.exports = createRoutes;

function createRoutes(router) {
  router.use(createRenderEvent);

  createController({
    Model: Event,
    modelName: 'event',
    router,
    index: eventIndex,
    create: createEvent,
    delete: deleteEvent,
    show: showEvent,
    edit: editEvent,
    fields: constants.fields,
  });
}

function createRenderEvent(req, res, next) {
  res.renderEvent = (subview, options = {}) => {
    res.render('event/_layout', {
      subview,
      rootPath: req.rootPath || '/event/' + req.event._id,
      title: options.title || 'Event',
      event: req.event,
      ...options
    });
  };
  next();
}

async function eventIndex(req, res) {
  const events = await Event.find({})
    .populate('people')
    .populate('tags');

  Event.sortByDate(events);

  res.render('event/index', {title: 'All Events', events});
}

function createEvent(req, res) {
  const newEvent = Event.getFormDataNew(req);

  if (!newEvent) {
    return res.send('error');
  }

  Event.create(newEvent, (err, event) => {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.redirect('/event/' + event._id);
    }
  });
}

async function deleteEvent(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.send('event not found');
  }
  await event.remove();
  res.redirect('/events');
}

async function showEvent(req, res) {
  req.event = await Event.findById(req.params.id)
    .populate('people').populate('tags');
  if (!req.event) {
    return res.send('event not found');
  }
  res.renderEvent('show');
}

async function editEvent(req, res) {
  req.event = await Event.findById(req.params.id)
    .populate('people')
    .populate('tags');

  if (!req.event) {
    return res.send('event not found');
  }

  req.rootPath = '/event/' + req.event._id

  const people = await Person.find();
  Person.sortByName(people);

  const tags = await Tag.find();
  Tag.sortByTitle(tags);

  const tableRows = getEditTableRows({
    item: req.event,
    rootPath: req.rootPath,
    fields: constants.fields,
    people,
    tags,
  });

  res.renderEvent('edit', {
    title: 'Edit Event',
    itemName: 'event',
    canDelete: true,
    tableRows,
  });
}
