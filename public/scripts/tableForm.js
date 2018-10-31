
function initializeEditForm() {
  $('.value-edit').hide();
  $('.value-original').hide();
  $('.link-cancel').hide();
  $('.button-submit').hide();
}

function startEdit(item) {
  $('.link-start').hide();
  $('.link-cancel').hide();
  $('.button-submit').hide();

  $('.value-show').filter('[item="' + item + '"]').hide();
  $('.value-edit').filter('[item="' + item + '"]').show();
  $('.link-cancel').filter('[item="' + item + '"]').show();
  $('.button-submit').filter('[item="' + item + '"]').show();

  var originalValue = $('.value-original').filter('[item="' + item + '"]').val();
  $('.value-edit').filter('[item="' + item + '"]').val(originalValue);
}

function cancelEdit(item) {
  $('.value-show').show();
  $('.value-edit').hide();
  $('.link-cancel').hide();
  $('.link-start').show();
  $('.button-submit').hide();
}
