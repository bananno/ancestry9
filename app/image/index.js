const {
  Image,
  Tag,
  createController,
  getEditTableRows,
} = require('../import');

const constants = require('./constants');
module.exports = createRoutes;

function createRoutes(router) {
  createController({
    Model: Image,
    modelName: 'image',
    router: router,
    show: showImage,
    editView: false,
    fields: constants.fields,
  });
}

async function showImage(req, res) {
  const imageId = req.params.id;
  const image = await Image.findById(imageId).populate('tags');
  req.rootPath = '/image/' + image._id;

  if (!image) {
    return res.send('Image not found.');
  }

  await image.populateParent();

  const tags = await Tag.find();
  Tag.sortByTitle(tags);

  const tableRows = getEditTableRows({
    item: image,
    rootPath: req.rootPath,
    fields: constants.fields,
    tags,
  });

  res.render('image/show', {
    title: 'Image',
    image,
    rootPath: req.rootPath,
    itemName: 'image',
    tableRows,
  });
}
