
function sortPeople(peopleList, sortBy) {
  const sortRef = {};

  peopleList.forEach(person => {
    sortRef['' + person._id] = (() => {
      return person.name.toLowerCase();
    })();
  });

  peopleList.sort((a, b) => {
    let strA = sortRef['' + a._id];
    let strB = sortRef['' + b._id];
    return strA === strB ? 0 : strA < strB ? -1 : 1;
  });
}

module.exports = sortPeople;
