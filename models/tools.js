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
  list.sort((a, b) => {
    const sortA = callback(a);
    const sortB = callback(b);
    if (sortA === sortB) {
      return 0;
    }
    return sortA < sortB ? -1 : 1;
  });
}

function sortByDate(list) {
  sortBy(list, getDateSortStr);
}
