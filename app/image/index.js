const {
  Image,
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
    routes: {
      show: showImage,
    },
    editFromMainShowView: true,
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

  const tableRows = await getEditTableRows({
    item: image,
    rootPath: req.rootPath,
  });

  res.render('image/show', {
    title: 'Image',
    image,
    rootPath: req.rootPath,
    itemName: 'image',
    tableRows,
  });
}
