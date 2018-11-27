const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const config = require('../config');
const FetchResource = require('../resources/FetchResource');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const getChampionDetail = async (championId) => {
  try {
    const champions = await FetchResource.get(`${config.DATA_DRAGON}/champion.json`);
    const championArray = Object.values(champions.data);
    const champion = championArray.find(champ => champ.key === championId.toString());
    const {
      info, title, blurb, tags, partype, stats, version, ...cleanObj
    } = champion;

    return cleanObj;
  } catch (error) {
    throw new Error(`Failed to fetch champion ${error}`);
  }
};

const getSpellDetails = async (spellId) => {
  try {
    const spells = await FetchResource.get(`${config.DATA_DRAGON}/summoner.json`);
    const spellsArray = Object.values(spells.data);
    const spell = spellsArray.find(sp => sp.key === spellId.toString());
    const results = {
      name: spell.name,
      description: spell.description,
      image: spell.image,
    };
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch spells ${error}`);
  }
};

const getItemDetail = async (itemId, itemKey) => {
  try {
    let results = {};
    const items = await FetchResource.get(`${config.DATA_DRAGON}/item.json`);
    const item = items.data[itemId];
    if (item) {
      results = {
        name: item.name,
        description: item.description,
        image: item.image,
        location: itemKey,
      };
    }
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch items ${error}`);
  }
};

const getRuneDetails = async (runeId, keyStoneId = null) => {
  try {
    const runes = await FetchResource.get(`${config.DATA_DRAGON}/runesReforged.json`);
    const selectedRune = runes.find(rune => rune.id === runeId);
    if (keyStoneId) {
      let keyStone = '';
      selectedRune.slots.forEach((slot) => {
        slot.runes.forEach((rune) => {
          if (rune.id === keyStoneId) {
            keyStone = rune;
          }
        });
      });
      return keyStone;
    }
    const { slots, ...cleanObj } = selectedRune;
    return cleanObj;
  } catch (error) {
    throw new Error(`Failed to fetch runes ${error}`);
  }
};

const getGameDetail = async (gameId, summoner) => {
  try {
    const results = {};
    const gameDetails = await FetchResource.get(
      `${config.RIOT_API}/lol/match/v3/matches/${gameId}`,
    );
    const summonerIdentifier = gameDetails.participantIdentities.find(
      participant => participant.player.summonerId === summoner.id,
    );
    const details = gameDetails.participants.find(
      participant => participant.participantId === summonerIdentifier.participantId,
    );
    // get items detials
    const items = {};
    const itemKeys = Object.keys(details.stats).filter(key => key.includes('item'));
    const itemsArray = await Promise.all(
      itemKeys.map(key => getItemDetail(details.stats[key], key)),
    );
    itemKeys.forEach((key) => {
      itemsArray.forEach((item) => {
        if (key === item.location) {
          items[key] = item;
        }
      });
    });

    // duration is in second
    const duration = moment.duration(gameDetails.gameDuration, 'seconds');
    // game creation is time stamp
    const creation = moment(gameDetails.gameCreation).format('M/D/YYYY H:mm');

    results.player = {
      champion: await getChampionDetail(details.championId),
      spell1: await getSpellDetails(details.spell1Id),
      spell2: await getSpellDetails(details.spell2Id),
      primaryRune: await getRuneDetails(details.stats.perkPrimaryStyle, details.stats.perk0),
      secondaryRune: await getRuneDetails(details.stats.perkSubStyle),
      items,
      kills: details.stats.kills,
      deaths: details.stats.deaths,
      assists: details.stats.assists,
      champLevel: details.stats.champLevel,
      totalCS: details.stats.totalMinionsKilled + details.stats.neutralMinionsKilled,
      CSM: (
        (details.stats.totalMinionsKilled + details.stats.neutralMinionsKilled)
        / duration.asMinutes()
      ).toFixed(2),
      summonerName: summoner.name,
    };
    results.game = {
      id: gameId,
      win: details.stats.win,
      gameCreation: creation,
      gameDuration: `${duration.get('minutes')}m ${duration.get('second')}s`,
    };

    return results;
  } catch (error) {
    throw new Error(`Failed to fetch game details ${error}`);
  }
};

router.get('/:name', async (req, res) => {
  const summoner = await FetchResource.get(
    `${config.RIOT_API}/lol/summoner/v3/summoners/by-name/${req.params.name}`,
  );

  if (summoner) {
    const beginIndex = req.query.beginIndex || 0;
    const endIndex = req.query.endIndex || 5;

    const matchList = await FetchResource.get(
      `${config.RIOT_API}/lol/match/v3/matchlists/by-account/${
        summoner.accountId
      }?beginIndex=${beginIndex}&endIndex=${endIndex}`,
    ).catch(err => res.status(400).send(`Failed to fetch match ${err}`));

    const { matches } = matchList;

    if (matches) {
      const gamesDetails = await Promise.all(
        matches.map(match => getGameDetail(match.gameId, summoner)),
      ).catch(err => res.send(`Failed to get details ${err}`));
      const results = {
        totalGames: matchList.totalGames,
        matches: gamesDetails,
        summonerName: summoner.name,
      };
      return res.json(results);
    }
  }

  return res.status(404).send('Summoner doesn not exist');
});

module.exports = router;
