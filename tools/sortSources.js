
const compareDate = require('./compareDate');

function sortSources(sourceList, sortBy) {
  if (sortBy == 'date') {
    sourceList.sort((sourceB, sourceA) => {
      return compareDate(sourceA.date, sourceB.date) ? -1 : 1;
    });
  }

  if (sortBy == 'group') {
    sourceList.sort((sourceB, sourceA) => {
      let sortA = ((sourceA.type || '') + ' ' + (sourceA.group || '')).toLowerCase();
      let sortB = ((sourceB.type || '') + ' ' + (sourceB.group || '')).toLowerCase();
      return sortA > sortB ? -1 : 1;
    });
  }

  if (sortBy == 'story') {
    sourceList.sort((sourceB, sourceA) => {
      let sortA = sourceA.type || '';
      let sortB = sourceB.type || '';

      if (sourceA.story && sourceA.story.title) {
        sortA += sourceA.story.title;
      }
      if (sourceB.story && sourceB.story.title) {
        sortB += sourceB.story.title;
      }

      sortA = (sortA + (sourceA.group || '')).toLowerCase();
      sortB = (sortB + (sourceB.group || '')).toLowerCase();

      return sortA > sortB ? -1 : 1;
    });
  }

  return sourceList;
}

module.exports = sortSources;
