
/*

  BUTTONS:

  <div class="filter-buttons" filter="putNameHere">
      <div class="filter-button active" filter-set="thing1">
          thing 1 <!-- currently active -->
      </div>
      <div class="filter-button" value="thing2">
          thing 2 <!-- currently NOT active -->
      </div>
  </div>

  ITEMS TOGGLED:

  <div filter="putNameHere" filter-set="thing1"></div>
  <div filter="putNameHere" filter-set="thing1"></div>
  <div filter="putNameHere" filter-set="thing2"></div>
  <div filter="putNameHere" filter-set="thing2"></div>

  BOTTOM OF PAGE:

  <script>
      createToggleFilter('putNameHere');
  </script>

*/

function createToggleFilter(filterName) {
  var $buttonSet = $('.filter-buttons[filter="' + filterName + '"] .filter-button');
  var $items = $('[filter="' + filterName + '"]').not($buttonSet);

  $buttonSet.toArray().forEach(button => {
    var $button = $(button);
    var set = $button.attr('filter-set');
    var $setItems = $items.filter('[filter-set="' + set + '"]');
    var active = $button.hasClass('active');
    if (!active) {
      $setItems.hide();
    }
    $button.click(() => {
      active = !active;
      if (active) {
        $button.addClass('active');
      } else {
        $button.removeClass('active');
      }
      $setItems.toggle(active);
    });
  });
}
