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
  const $buttonSet = $('.filter-buttons[filter="' + filterName + '"] .filter-button');
  const $items = $('[filter="' + filterName + '"]').not($buttonSet);

  $buttonSet.each((i, button) => {
    const $button = $(button);
    const set = $button.attr('filter-set');
    const $setItems = $items.filter('[filter-set="' + set + '"]');
    let active = $button.hasClass('active');
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
