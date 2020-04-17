const mongoose = require('mongoose');
const Image = mongoose.model('Image');
const Source = mongoose.model('Source');
const Story = mongoose.model('Story');
const createModelRoutes = require('../../tools/createModelRoutes');

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

function showImage(req, res, next) {
  const imageId = req.params.id;
  Image.findById(imageId)
  .exec((err, image) => {
    if (!image) {
      return res.send('Image not found.');
    }
    Story.find({ images: image }).exec((err, stories) => {
      Source.find({ images: image }).populate('story').exec((err, sources) => {
        res.render('layout', {
          view: 'images/show',
          title: 'Image',
          image,
          story: stories[0],
          source: sources[0],
        });
      });
    });
  });
}
