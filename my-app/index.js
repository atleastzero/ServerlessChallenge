const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');

const CHARACTERS_TABLE = process.env.CHARACTERS_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.json({ strict: false }));

app.get('/', function(req, res) {
  res.redirect('/characters');
});

// Get Character endpoint
app.get('/characters/:characterId', function (req, res) {
  const params = {
    TableName: CHARACTERS_TABLE,
    Key: {
      characterId: req.params.characterId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get character' });
    }
    if (result.Item) {
      const {characterId, name, hp} = result.Item;
      res.json({ characterId, name, hp });
    } else {
      res.status(404).json({ error: "Character not found" });
    }
  });
})

// Get Character list endpoint
app.get('/characters', function (req, res) {
  const params = {
    TableName: CHARACTERS_TABLE,
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get characters' });
    }
    if (result) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "Characters not found" });
    }
  });
})

// Create Character endpoint
app.post('/characters', function (req, res) {
  const { characterId, name, hp } = req.body;
  if (typeof characterId !== 'string') {
    res.status(400).json({ error: '"characterId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  } else if (typeof hp !== 'number') {
    res.status(400).json({ error: '"hp" must be a number' });
  }

  const params = {
    TableName: CHARACTERS_TABLE,
    Item: {
      characterId: characterId,
      name: name,
      hp: hp,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create characters' });
    }
    res.json({ characterId, name, hp });
  });
})

module.exports.handler = serverless(app);