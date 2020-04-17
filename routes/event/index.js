const {
  Event,
  Person,
  createModelRoutes,
  getNewEventValues,
} = require('../import');

module.exports = createEventRoutes;

const eventFields = [
  {name: 'title'},
  {name: 'date'},
  {name: 'location'},
  {name: 'people', multi: true},
  {name: 'notes'},
  {name: 'tags', multi: true},
];

function createEventRoutes(router) {
  router.use(createRenderEvent);

  createModelRoutes({
    Model: Event,
    modelName: 'event',
    router,
    index: eventIndex,
    create: createEvent,
    delete: deleteEvent,
    show: showEvent,
    edit: editEvent,
    fields: eventFields,
  });
}

function createRenderEvent(req, res, next) {
  res.renderEvent = (subview, options = {}) => {
    res.render('event/_layout', {
      subview,
      rootPath: '/event/' + req.event._id,
      title: options.title || 'Event',
      event: req.event,
      ...options
    });
  };
  next();
}

async function eventIndex(req, res) {
  const events = await Event.find({}).populate('people');
  Event.sortByDate(events);
  res.render('event/index', {title: 'All Events', events});
}

function createEvent(req, res) {
  const newEvent = getNewEventValues(req);

  if (newEvent == null) {
    return;
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
  req.event = await Event.findById(req.params.id).populate('people');
  if (!req.event) {
    return res.send('event not found');
  }
  res.renderEvent('show');
}

async function editEvent(req, res) {
  req.event = await Event.findById(req.params.id).populate('people');
  if (!req.event) {
    return res.send('event not found');
  }
  const people = await Person.find({});
  Person.sortByName(people);
  res.renderEvent('edit', {title: 'Edit Event', eventFields, people});
}
