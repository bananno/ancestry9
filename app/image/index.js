const {
  Image,
  Tag,
  createModelRoutes,
} = require('../import');

const constants = require('./constants');
module.exports = createRoutes;

function createRoutes(router) {
  createModelRoutes({
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

  if (!image) {
    return res.send('Image not found.');
  }

  await image.populateParent();

  const tags = await Tag.find({});
  Tag.sortByTitle(tags);

  res.render('image/show', {
    title: 'Image',
    image,
    fields: constants.fields,
    rootPath: '/image/' + image._id,
    tags,
  });
}
