const {
  Image,
  createModelRoutes,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  createModelRoutes({
    Model: Image,
    modelName: 'image',
    router: router,
    show: showImage,
    editView: false,
    singleAttributes: ['url'],
    listAttributes: ['tags'],
  });
}

async function showImage(req, res) {
  const imageId = req.params.id;
  const image = await Image.findById(imageId);

  if (!image) {
    return res.send('Image not found.');
  }

  await image.populateParent();

  res.render('layout', {view: 'image/show', title: 'Image', image});
}
