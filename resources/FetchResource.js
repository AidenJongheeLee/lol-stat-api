const axios = require('axios');
const secretKey = require('../secret.js');

const headers = { 'X-Riot-Token': secretKey };

module.exports.get = async (url) => {
  try {
    const results = await axios.get(url, { headers });
    return results.data;
  } catch (error) {
    return error;
  }
};
