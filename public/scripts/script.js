
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
