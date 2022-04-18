module.exports = {
  getDateSortStr,
  padZero,
  sortBy,
  sortByDate,
  sortByTitle,
};

function getDateSortStr(date) {
  const dateObj = date ? (date.date || date) : {};

  const dateParts = [
    padZero(dateObj.year || 'zzzz', 4),
    padZero(dateObj.month || 'zz', 2),
    padZero(dateObj.day || 'zz', 2)
  ];

  return dateParts.join('-');
}

function padZero(str, length) {
  str = '' + str;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

// sortingTool = a function or a string
function sortBy(list, sortingTool) {
  if (typeof sortingTool === 'string') {
    list.forEach(item => item.sortBy = item[sortingTool]);
  } else {
    list.forEach(item => item.sortBy = sortingTool(item));
  }
  list.sort((a, b) => a.sortBy === b.sortBy ? 0 : a.sortBy < b.sortBy ? -1 : 1);
  list.forEach(item => delete item.sortBy);
}

function sortByDate(list) {
  sortBy(list, getDateSortStr);
}

function sortByTitle(list) {
  sortBy(list, item => item.title.toLowerCase());
}
