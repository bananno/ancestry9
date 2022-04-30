const {
  Event,
} = require('../import');

module.exports = getChecklistPlacesInfo;

// To Do: add other models that have locations to this checklist

async function getChecklistPlacesInfo() {
  const allEvents = await Event.find();

  // create a map of city/state => county => number of items in county
  // e.g. cityAndStateToCountiesMap[FloweryBranch-GA] = {Hall County: 6}
  const cityAndStateToCountiesMap = {};
  allEvents.forEach(event => {
    const {country, region1: state, region2: county, city} = event.location;
    if (!country || country !== 'United States' || !state || !county || !city) {
      return;
    }
    const cityAndState = city + ', ' + state;
    cityAndStateToCountiesMap[cityAndState] = cityAndStateToCountiesMap[cityAndState] || [];
    cityAndStateToCountiesMap[cityAndState][county] =
      cityAndStateToCountiesMap[cityAndState][county] || 0;
    cityAndStateToCountiesMap[cityAndState][county] += 1;
  });

  // For each city/state combo, check if there is more than one county
  const citiesWithMultipleCounties = [];
  Object.keys(cityAndStateToCountiesMap).forEach(cityAndState => {
    const counties = Object.keys(cityAndStateToCountiesMap[cityAndState]);
    if (counties.length > 1) {
      const countyList = counties.map(county => {
        const itemsWithThisLocation = cityAndStateToCountiesMap[cityAndState][county];
        return `${county} - ${itemsWithThisLocation} item(s)`;
      });
      citiesWithMultipleCounties.push({cityAndState, countyList});
    }
  });

  return {citiesWithMultipleCounties};
}
