const {
  Event,
  Notation,
  Person,
  Source,
  createModelRoutes,
  getDateValues,
  getLocationValues,
  getNewEventValues,
  reorderList,
  sortEvents,
} = require('./import');

module.exports = createEventRoutes;

function createEventRoutes(router) {
  router.get('/events', makeEventsIndexRoute(false));
  router.get('/events/new', makeEventsIndexRoute(true));
  router.post('/events/new', createNewEvent);

  router.get('/event/:eventId', makeRouteEditGet('none'));
  router.post('/event/:eventId/delete', deleteEvent);

  router.get('/event/:eventId/edit/date', makeRouteEditGet('date'));
  router.post('/event/:eventId/edit/date', makeRouteEditPost('date'));
  router.get('/event/:eventId/edit/location', makeRouteEditGet('location'));
  router.post('/event/:eventId/edit/location', makeRouteEditPost('location'));

  router.post('/event/:eventId/add/people', makeRouteEditPost('people', true));
  router.post('/event/:eventId/delete/people/:deleteId', makeRouteDelete('people'));
  router.post('/event/:eventId/reorder/people/:orderId', makeRouteReorder('people'));

  router.post('/event/:eventId/add/tags', makeRouteEditPost('tags', true));
  router.post('/event/:eventId/delete/tags/:deleteId', makeRouteDelete('tags'));
  router.post('/event/:eventId/reorder/tags/:orderId', makeRouteReorder('tags'));

  createModelRoutes({
    Model: Event,
    modelName: 'event',
    router: router,
    editView: false,
    singleAttributes: ['title', 'notes'],
  });
}

function withEvent(req, callback) {
  const eventId = req.params.eventId;
  Event
  .findById(eventId)
  .populate('people')
  .exec((err, event) => {
    callback(event, eventId);
  });
}

function makeEventsIndexRoute(showNew) {
  return function(req, res, next) {
    Event
    .find({})
    .populate('people')
    .exec(function (err, events) {
      events = sortEvents(events);
      if (err) {
        return console.error(err);
      } else {
        res.render('event/index', {
          title: 'All Events',
          events,
          showNew,
        });
      }
    });
  };
}

function createNewEvent(req, res) {
  const newEvent = getNewEventValues(req);

  if (newEvent == null) {
    return;
  }

  Event.create(newEvent, function(err, event) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.format({
        html: function() {
          res.redirect('/event/' + event._id);
        }
      });
    }
  });
}

function makeRouteEditGet(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      Person.find({}, (err, people) => {
        people.sort((a, b) => a.name < b.name ? -1 : 1);
        res.render('layout', {
          view: 'events/show',
          title: 'Edit Event',
          eventId: eventId,
          event: event,
          editField: fieldName,
          people: people,
        });
      });
    });
  };
}

function makeRouteEditPost(fieldName, multipleValues) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};

      if (fieldName == 'date') {
        updatedObj[fieldName] = getDateValues(req);
      } else if (fieldName == 'location') {
        updatedObj[fieldName] = getLocationValues(req);
      } else if (multipleValues) {
        const newValue = req.body[fieldName];
        updatedObj[fieldName] = event[fieldName];
        updatedObj[fieldName].push(newValue);
      } else {
        updatedObj[fieldName] = req.body[fieldName];
      }

      event.update(updatedObj, err => {
        res.redirect('/event/' + eventId);
      });
    });
  };
}

function makeRouteDelete(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};
      const deleteId = req.params.deleteId;

      if (fieldName == 'people') {
        updatedObj[fieldName] = Person.removeFromList(event.people, deleteId);
      } else {
        updatedObj[fieldName] = event[fieldName].filter((value, index) => index != deleteId);
      }

      event.update(updatedObj, err => {
        res.redirect('/event/' + eventId);
      });
    });
  };
}

function makeRouteReorder(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};
      const orderId = req.params.orderId;

      updatedObj[fieldName] = reorderList(event[fieldName], orderId, fieldName);

      event.update(updatedObj, err => {
        res.redirect('/event/' + eventId);
      });
    });
  };
}

function deleteEvent(req, res) {
  withEvent(req, (event, eventId) => {
    event.remove(err => {
      res.redirect('/events');
    });
  });
}
