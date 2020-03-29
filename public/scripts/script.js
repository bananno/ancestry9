
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
