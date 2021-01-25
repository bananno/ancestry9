
function initializeEditForm(currentlyEditingByRoute) {
  $('.link-start').show();
  setupExternalLinkFields();
}

function startEdit(item, val) {
  $('.link-start').hide();
  $('.link-cancel').hide();
  $('.button-submit').hide();
  $('.button-delete').hide();
  $('.button-reorder').hide();

  $('.value-show').filter('[item="' + item + '"]').hide();
  $('.value-edit, .value-new').filter('[item="' + item + '"]').show();
  $('.link-cancel').filter('[item="' + item + '"]').show();
  $('.button-submit').filter('[item="' + item + '"]').show();

  const originalValue = $('.value-original').filter('[item="' + item + '"]').val();
  $('.value-edit').filter('[item="' + item + '"]').val(originalValue);

  if (item == 'citation') {
    $('.citation-row-show[data-citation-id="' + val + '"]').hide();
    $('.citation-row-edit[data-citation-id="' + val + '"]').show();
  }
}

function cancelEdit(item) {
  $('.value-show').show();
  $('.value-edit').hide();
  $('.value-new').hide();
  $('.link-cancel').hide();
  $('.link-start').show();
  $('.button-submit').hide();
  $('.button-delete').show();
  $('.button-reorder').show();
  $('.citation-row-show').show();
  $('.citation-row-edit').hide();
}

function setupExternalLinkFields() {
  $('.external-link-form-new').each((i, box) => {
    const $linkUrlBox = $(box).find('.external-link-form-url');
    const $linkTextBox = $(box).find('.external-link-form-text');
    $linkUrlBox.change(() => {
      const newValue = $linkUrlBox.val();
      const linkText = (() => {
        if (newValue.match(/ancestry.com/i)) {
          return 'Ancestry';
        }
        if (newValue.match(/familysearch.org/i)) {
          return 'FamilySearch';
        }
        if (newValue.match(/wikitree.com/i)) {
          return 'FamilySearch';
        }
        if (newValue.match(/facebook.com/i)) {
          return 'Facebook profile';
        }
        if (newValue.match(/findagrave.com/i)) {
          return 'FindAGrave';
        }
        if (newValue.match(/newspapers.com/i)) {
          return 'Newspapers.com';
        }
      })();
      if (linkText) {
        $linkTextBox.val(linkText);
      }
    });
  });
}
