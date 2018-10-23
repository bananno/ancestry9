
function removePersonFromList(people, person) {
  var removeId = person;

  if (person._id) {
    removeId = person._id;
  }

  removeId = '' + removeId;

  return people.filter((thisPerson) => {
    return ('' + thisPerson._id) != removeId;
  });
}

module.exports = removePersonFromList;
