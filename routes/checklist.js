const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const getAllData = require('./tools').getAllData;
const populatePeopleDates = require('./tools').populatePeopleDates;

router.get('/checklist', checklistIndex);
router.get('/checklist/vitals', checklistVitals);
router.get('/checklist/wikitree', checklistWikiTree);

router.get('/to-do', showToDoList);
router.post('/to-do/new', newToDoItem);
router.post('/to-do/:id/edit', editToDoItem);

function checklistIndex(req, res, next) {
  res.render('layout', {
    view: 'checklist/index',
    title: 'Checklist',
  });
}

function checklistVitals(req, res, next) {
  getAllData(data => {
    data.people = populatePeopleDates(data.people, data.events);

    data.personRef = {};
    data.people.forEach(person => data.personRef['' + person._id] = person);

    const anna = data.people.filter(person => person.name == 'Anna Peterson')[0];
    anna.connection = 'start';
    anna.degree = 1;
    findAncestors(anna, 2);

    function findAncestors(person, degree) {
      (person.parents || []).forEach(parentId => {
        const parent = data.personRef['' + parentId];
        parent.connection = 'ancestor';
        parent.degree = degree;
        findAncestors(parent, degree + 1);
        findDescendants(parent, degree + 1);
      });
    }

    function findDescendants(person, degree) {
      (person.children || []).forEach(childId => {
        const child = data.personRef['' + childId];
        child.connection = child.connection || 'cousin';
        child.degree = child.degree || degree;
        findDescendants(child, degree + 1);
      });
    }

    const connOrder = ['cousin', 'ancestor', 'start'];
    data.people.sort((a, b) => {
      // order by connection type, then by degree of separation
      let swap = connOrder.indexOf(b.connection) - connOrder.indexOf(a.connection);
      return swap == 0 ? (a.degree || 100) - (b.degree || 100) : swap;
    });

    res.render('layout', {
      view: 'checklist/vitals',
      title: 'Checklist',
      ...data
    });
  });
}

function checklistWikiTree(req, res, next) {
  mongoose.model('Person').find({}, (err, people) => {
    res.render('layout', {
      view: 'checklist/wikitree',
      title: 'Checklist',
      people,
    });
  });
}

function showToDoList(req, res, next) {
  mongoose.model('To-do').find({}, (err, todoItems) => {
    res.render('layout', {
      view: 'checklist/to-do',
      title: 'To-do List',
      todoItems: todoItems,
    });
  });
}

function newToDoItem(req, res, next) {
  const items = req.body.items.split('\n')
    .map(item => item.trim())
    .filter(item => item);

  const newTodo = {
    items: items,
  };

  mongoose.model('To-do').create(newTodo, (err, todo) => {
    if (err) {
      return res.send('There was a problem adding the information to the database.');
    }
    res.redirect('/to-do');
  });
}

function editToDoItem(req, res, next) {
  const todoId = req.params.id;

  const items = req.body.items.split('\n')
    .map(item => item.trim())
    .filter(item => item);

  const findTodo = {
    _id: todoId,
  };

  const updatedTodo = {
    items: items,
  };

  mongoose.model('To-do').update(findTodo, updatedTodo, err => {
    if (err) {
      return res.send('There was a problem updating the information to the database: ' + err);
    }

    res.redirect('/to-do');
  });
}
