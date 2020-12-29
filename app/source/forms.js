const {
  Highlight,
  Person,
  Source,
} = require('../import');

const methods = {};
module.exports = methods;

methods.getNewSourceForm = (req, res) => {
  res.render('forms/census');
};

methods.getSourceForm = async (req, res) => {
  const source = await Source.findById(req.params.id).populate('people');

  const year = source.date && source.date.year ? source.date.year : '';

  const headOfHouseholder = source.title;

  const {columnNames, rows} = getMainTableRows(source.content);
  const {enumeratorName} = getEnumeratorInfo(source.content);

  await source.populateAndProcessHighlights();

  const missingLinks = [];

  if (!source.links.some(link => link.match(' Ancestry'))) {
    missingLinks.push('Ancestry');
  }
  if (!source.links.some(link => link.match(' FamilySearch'))) {
    missingLinks.push('FamilySearch');
  }

  const {allPeople} = await source.getPeopleForDropdown();

  res.render('source/_formCensus', {
    source,
    year,
    columnNames,
    rows,
    headOfHouseholder,
    enumerator: enumeratorName || '',
    missingLinks,
    peopleDropdownList: allPeople,
  });
};

methods.saveSourceForm = async (req, res) => {
  const sourceId = req.params.id;
  const step = req.body.step;

  const source = await Source.findById(sourceId);

  if (step === 'people') {
    const rows = req.body.values.split('\n')
      .map(s => '| ' + s.trim());

    const newContent = ['|| Name', ...rows].join('\n');

    if (!source.content) {
      await Source.updateOne({_id: sourceId}, {content: newContent});
    }
  } else if (step === 'newcolumn') {
    const columnName = req.body.column;
    const values = req.body.values.split('\n').map(s => s.trim());

    const existingRows = source.content.split('\n');

    const newRows = [];

    newRows.push(existingRows[0].trim() + ' || ' + columnName);

    existingRows.slice(1).forEach((personRow, i) => {
      newRows.push(personRow.trim() + ' | ' + (values[i] || ''));
    });

    const newContent = newRows.join('\n');

    await Source.updateOne({_id: sourceId}, {content: newContent});
  } else if (step === 'enumerator') {
    const {enumeratorLineNumber} = getEnumeratorInfo(source.content);

    if (enumeratorLineNumber === undefined) {
      return res.send('no enumerator');
    }

    const rows = source.content.split('\n');
    rows[enumeratorLineNumber] = '|| Enumerator | ' + req.body.newValue;

    const newContent = rows.join('\n');

    await Source.updateOne({_id: sourceId}, {content: newContent});
  } else if (step === 'links') {
    const links = source.links;
    links.push(req.body.url + ' ' + req.body.link);
    await Source.updateOne({_id: sourceId}, {links});
  } else if (step === 'highlightPerson' || step === 'highlightEmpty') {
    const {
      rowsAsObj,
      startLineNumber,
      contentLines,
    } = getMainTableRows(source.content);

    // The row number of the person table, with head of household being 0.
    const rowNumber = parseInt(req.body.rowNumber);

    const personName = rowsAsObj[rowNumber].name;

    // Count the number of times this person's name appears in the table BEFORE
    // their row; usually only when two people have the same name.
    const numberOfInstancesToSkip = getHighlightInstance({
      contentLines,
      personName,
      startLineNumber,
      rowNumber,
    });

    const newHighlight = {
      source: sourceId,
      text: personName,
      instance: numberOfInstancesToSkip,
    };

    if (step === 'highlightPerson') {
      newHighlight.linkPerson = req.body.person;
    }

    await Highlight.create(newHighlight);
  }

  res.redirect(`/source/${sourceId}/form`);
};

function getEnumeratorInfo(content) {
  if (!content) {
    return {};
  }

  const rows = content.split('\n');
  const rowIndex = rows.map((row, i) => i).find(i => rows[i].match(/enumerator/i));

  const enumeratorName = rowIndex !== undefined
    ? rows[rowIndex]
      .replace(/enumerator/gi, '')
      .replace(/\|/g, '')
      .trim()
    : undefined;

  return {
    enumeratorName,
    enumeratorLineNumber: rowIndex,
  }
}

function getMainTableRows(content) {
  if (!content) {
    return {columnNames: [], rows: []};
  }

  const contentLines = content.split('\n').map(s => s.trim());

  let lastEmptyLine = -1;
  let enumeratorRow;

  contentLines.forEach((line, i) => {
    if (line.trim() === '') {
      lastEmptyLine = i;
      return;
    }
  });

  const headerRow = contentLines[lastEmptyLine + 1];

  const columnNames = headerRow.split('||').map(s => s.trim()).filter(Boolean);

  const rows = [];
  const rowsAsObj = [];
  const linesBeforeTable = [];

  const startLineNumber = lastEmptyLine + 2;

  contentLines.slice(startLineNumber).map((textLine, i) => {
    const personRow = textLine.split('|').slice(1).map(s => s.trim());
    const obj = {};
    columnNames.forEach((col, i) => obj[col.toLowerCase()] = personRow[i]);
    rows.push(personRow);
    rowsAsObj.push(obj);
  });

  return {
    columnNames,
    rows,
    rowsAsObj,
    startLineNumber,
    contentLines,
  };
}

function getHighlightInstance({contentLines, personName, startLineNumber, rowNumber}) {
  // Within the total content, realLineNumber = the actual line number where this person
  // appears: where the person table starts + this person's line number in that table.
  const realLineNumber = startLineNumber + rowNumber;
  const contentBeforePersonRow = contentLines.slice(0, realLineNumber).join('\n');
  const personNameRegex = new RegExp(personName, 'gi');
  const previousMatches = contentBeforePersonRow.match(personNameRegex);
  if (previousMatches === null) {
    return 0;
  }
  return previousMatches.length;
}
