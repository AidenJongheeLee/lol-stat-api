require('dotenv').config();

const config = {
  RIOT_API: 'https://na1.api.riotgames.com',
  DATA_DRAGON: 'http://ddragon.leagueoflegends.com/cdn/8.20.1/data/en_US',
  SECRET_KEY: process.env.SECRET_KEY,
};

module.exports = config;
