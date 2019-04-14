
function filterPersonList() {
  var $filter = $('#quickFilterPeople');
  var $rows = $('#listOfPeople .person_row');

  $filter.change(filterPeopleRows);
  $filter.keydown(filterPeopleRows);

  function filterPeopleRows() {
    var searchWords = $filter.val().toLowerCase().trim().split(' ');
    $rows.toArray().forEach(function(row) {
      var $row = $(row);
      var personName = $row.attr('person_name');
      var keepRow = true;
      searchWords.forEach(function(thisWord) {
          keepRow = keepRow && personName.match(thisWord) != null;
      });
      $row.toggle(keepRow);
    });
  }
}

function toggleLocationOptions() {
  const $country = $('[name="location-country"]');
  const $otherCountry = $('[name="location-country-other"]');
  const $usaRegion = $('[name="location-region1-usa"]');
  const $otherRegion = $('[name="location-region1"]');

  function toggle() {
    const isUSA = $country.val() == 'United States';
    const isOther = $country.val() == 'other';
    $usaRegion.toggle(isUSA);
    $otherRegion.toggle(!isUSA);
    $otherCountry.toggle(isOther);
  }

  toggle();
  $country.change(toggle);
}

function confirmDeletion(itemType) {
  return confirm('Delete this ' + itemType + '?');
}
