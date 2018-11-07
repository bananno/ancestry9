
function compareDate(date1, date2, putEmptyDatesOnTop) {
  var date1IsEmpty = date1 == null || (date1.year || 0) == 0;
  var date2IsEmpty = date2 == null || (date2.year || 0) == 0;

  if (putEmptyDatesOnTop) {
    if (date1IsEmpty) {
      return false;
    }

    if (date2IsEmpty) {
      return true;
    }
  } else {
    if (date2IsEmpty) {
      return false;
    }

    if (date1IsEmpty) {
      return true;
    }
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
