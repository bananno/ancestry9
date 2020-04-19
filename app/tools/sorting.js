module.exports = {
  getDateSortStr,
  sortBy,
  sortByDate,
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
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

function sortBy(list, callback) {
  list.forEach(item => {
    item.sortBy = callback(item);
  });

  list.sort((a, b) => {
    return a.sortBy === b.sortBy ? 0 : a.sortBy < b.sortBy ? -1 : 1;
  });
}

function sortByDate(list) {
  sortBy(list, getDateSortStr);
}
