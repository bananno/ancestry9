const $originalBox = $('.text-content');
const originalContent = $originalBox.html();
const $newBox = $('<div class="text-content">');
$originalBox.after($newBox);

let previousText = null;

const $newHightlightText = $('#new-highlight-text');
const $newHightlightType = $('#new-highlight-type');
const $linkPersonId = $('#new-highlight-select-person select');

$newHightlightType.change(toggleMentionType);
$('#new-highlight-click-preview').click(previewNextInstance);

$newHightlightText.change(guardSubmitButton);
$newHightlightType.change(guardSubmitButton);
$linkPersonId.change(guardSubmitButton);

function toggleMentionType() {
  const newType = $newHightlightType.val();
  $('#new-highlight-select-person').toggle(newType === 'person');
}

function previewNextInstance(event) {
  event.preventDefault();

  const newText = $newHightlightText.val();

  if (newText === previousText) {
    const $highlights = $('.new-potential-highlight');
    const $current = $highlights.filter('.highlight-focus');
    const currentNum = parseInt($current.attr('instance'));
    let newNumber = currentNum + 1;
    if (newNumber >= $highlights.length) {
      newNumber = 0;
    }
    focusOnHighlightNumber(newNumber);
    return;
  }

  previousText = newText;

  if (newText.length < 3) {
    return;
  }

  const newContent = getNewPreviewInfo(newText);

  $originalBox.hide();
  $newBox.html(newContent);

  focusOnHighlightNumber(0);
}

function focusOnHighlightNumber(number) {
  const $highlights = $('.new-potential-highlight');
  $highlights.removeClass('highlight-focus');
  $highlights.filter('[instance="' + number + '"]').addClass('highlight-focus');
}

function getNewPreviewInfo(replaceText) {
  const regex = new RegExp(replaceText, 'gi');

  // Find each instance of the text, non-case sensitive, but
  // keep each instance of the text in its original case.
  const inBetweens = originalContent.split(regex);
  const matches = originalContent.match(regex);

  let newContent = inBetweens[0];

  for (let i = 0; i < matches.length; i++) {
    newContent += '<span class="new-potential-highlight" instance="' + i + '">'
      + matches[i] + '</span>';
    newContent += inBetweens[i + 1];
  }

  return newContent;
}

function guardSubmitButton() {
  const valid = (() => {
    if (!$newHightlightText.val()) {
      return false;
    }
    if ($newHightlightType.val() === 'person') {
      if ($linkPersonId.val() === '0') {
        return false;
      }
    }
    return true;
  })();
  if (valid) {
    $('#new-highlight-submit').removeAttr('disabled');
  } else {
    $('#new-highlight-submit').prop('disabled', true);
  }
}