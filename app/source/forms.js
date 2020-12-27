const {
  Source,
} = require('../import');

const methods = {};
module.exports = methods;

methods.getNewSourceForm = (req, res) => {
  res.render('forms/census');
};

methods.getSourceForm = async (req, res) => {
  const source = await Source.findById(req.params.id);

  const year = source.date && source.date.year ? source.date.year : '';

  const headOfHouseholder = source.title;

  let columns = [];
  const rows = [];

  if (source.content) {
    const contentLines = source.content.split('\n');

    columns = contentLines[0].split('||').map(s => s.trim()).filter(Boolean);

    contentLines.slice(1).forEach((textLine, i) => {
      const cells = textLine.split('|').slice(1);
      rows.push(cells);
    });
  }

  await source.populateAndProcessHighlights();

  res.render('source/_formCensus', {
    source,
    year,
    headOfHouseholder,
    columns,
    rows,
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
  }

  res.redirect(`/source/${sourceId}/form`);
};
