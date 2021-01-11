
function initializeEditForm(currentlyEditingByRoute) {
  $('.link-start').show();
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
