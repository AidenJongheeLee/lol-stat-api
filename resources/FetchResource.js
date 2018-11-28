const axios = require('axios');
const config = require('../config');

const headers = { 'X-Riot-Token': config.SECRET_KEY };

module.exports.get = async (url) => {
  try {
    const results = await axios.get(url, { headers });
    return results.data;
  } catch (error) {
    return error;
  }
};
