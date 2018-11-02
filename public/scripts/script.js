
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

function filterRelativeList() {
  var $buttons = $('.relative-list .filter-button');
  var $allRows = $('.relative-list .person-row');
  console.log($allRows.length)

  $buttons.toArray().forEach(button => {
    var current = true;
    var $button = $(button);
    var type = $button.attr('relative-type');
    var $rows = $allRows.filter('[relative-type="' + type + '"]');
    console.log($rows.length)
    $button.click(() => {
      current = !current;
      if (current) {
        console.log('show ' + type);
        $button.addClass('active');
      } else {
        console.log('hide ' + type);
        $button.removeClass('active');
      }
      $rows.toggle(current);
    });
  });
}

function toggleRegionUsState() {
  var $country = $('[name="location_country"]');
  var $usaRegion = $('[name="location_region1_usa"]');
  var $otherRegion = $('[name="location_region1"]');

  function toggle() {
    var isUSA = $country.val() == 'United States';
    $usaRegion.toggle(isUSA);
    $otherRegion.toggle(!isUSA);
  }

  toggle();
  $country.change(toggle);
}

function confirmDeletion(itemType) {
  return confirm('Delete this ' + itemType + '?');
}
