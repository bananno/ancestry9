
function compareDate(date1, date2) {
  if (date1 == null) {
    return false;
  }

  if (date2 == null) {
    return true;
  }

  if (date1.year == date2.year) {

    if (date1.month == date2.month) {
      return date1.day > date2.day;
    }

    return date1.month > date2.month;
  }

  return date1.year > date2.year;
}

module.exports = compareDate;
