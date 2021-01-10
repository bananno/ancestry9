$(document).ready(() => {
  createPersonDropdownFilters();
});

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

/*
  createQuickFilter({
    input: '#select_input_box',
    items: '.select_items_to_toggle',
    getItemText: $item => $item.text(), or
    getItemText: $item => $item.attr('some_attr'),
    startFocus: boolean, // whether to focus on input on page load
    then: (searchWords) => callback, // run every time after filtering is done
  });
*/
function createQuickFilter(options) {
  const $filter = $(options.input);

  if (options.startFocus) {
    $filter.focus();
  }

  $filter.keyup(() => {
    const searchWords = $filter.val().trim().toLowerCase().split(' ').filter(Boolean);

    $(options.items).each((i, item) => {
      const itemText = options.getItemText($(item)).toLowerCase();
      const isMatch = !searchWords.some(word => !itemText.match(word));
      $(item).toggle(isMatch);
    });

    if (options.then) {
      options.then(searchWords);
    }
  });
}

function createPersonDropdownFilters() {
  const $allFilters = $('.person-dropdown-filter');

  $allFilters.each(setupFilter);

  function setupFilter(i, input) {
    const $input = $(input);
    const $groupBox = $input.closest('.person-dropdown-group');
    const $options = $groupBox.find('select option');
    const $showResults = $groupBox.find('.person-dropdown-show-results');

    $input.keyup(() => {
      const searchWords = $input.val().trim().toLowerCase().split(' ').filter(Boolean);
      let count = 0;
      $options.each((i, item) => {
        const itemText = $(item).text().toLowerCase();
        const isMatch = !searchWords.some(word => !itemText.match(word));
        $(item).toggle(isMatch);
        count += isMatch ? 1 : 0;
      });
      $showResults.text(searchWords.length ? (count + ' result(s)') : '');
    });
  }
}
