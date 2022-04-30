const locationPieces = ['city', 'region2', 'region1', 'country'];

const locationStructure = {
  country: String,
  region1: String, // province or state
  region2: String, // county
  city: String,
  notes: String,
};

module.exports = {
  locationStructure,
};
