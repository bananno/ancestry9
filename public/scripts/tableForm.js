
function initializeEditForm(currentlyEditingByRoute) {
  if (!currentlyEditingByRoute) {
    $('.link-start').show();
  }
}

function startEdit(item) {
  $('.link-start').hide();
  $('.link-cancel').hide();
  $('.button-submit').hide();
  $('.button-delete').hide();
  $('.button-reorder').hide();

  $('.value-show').filter('[item="' + item + '"]').hide();
  $('.value-edit, .value-new').filter('[item="' + item + '"]').show();
  $('.link-cancel').filter('[item="' + item + '"]').show();
  $('.button-submit').filter('[item="' + item + '"]').show();

  var originalValue = $('.value-original').filter('[item="' + item + '"]').val();
  $('.value-edit').filter('[item="' + item + '"]').val(originalValue);
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
}
