//npm install discord.js
//npm install dotenv
//npm install firebase-admin


//Firebase Stuff
var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

const https = require('https');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://discordbotstockexchange-default-rtdb.firebaseio.com"
});

var firebase = require("firebase-admin");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD30obxZYjyDc4qon9DQL3z_5d0v4P8Fl0",
  authDomain: "discordbotstockexchange.firebaseapp.com",
  projectId: "discordbotstockexchange",
  storageBucket: "discordbotstockexchange.appspot.com",
  messagingSenderId: "701966142137",
  appId: "1:701966142137:web:268a6359fb2bc7efd0e968",
  measurementId: "G-CFBE8JH2YV"
};

// Initialize Firebase Database
let database = firebase.database();




//discord client configs
const Discord = require("discord.js")
const { Client, Intents } = require('discord.js');
const client = new Discord.Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
require('dotenv').config();


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

//handling discord commands
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'server') {
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
	} else if (commandName === 'user') {
		await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
	} else if (commandName === 'stocktest') {
    stockSymbol = interaction.options.getString('input');
    console.log(stockSymbol);
    const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=sandbox_c1clrp748v6vbcpf4jt0`;
    console.log(1);
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      console.log(2);
      res.on('end', () => {
        data = JSON.parse(data);
        interaction.reply(`The current price of ${stockSymbol} is ${data.c}`);
      })
    }).on('error', err => {
      console.log(err.message);
    })
  }
});

client.login(process.env.TOKEN);

client.on("messageCreate", msg => {
  if(msg.content === "test") {
      database.ref('AAPL').once('value')
      .then(function(snapshot) {
        console.log(snapshot.val());
        msg.reply('it worked');
        msg.reply(`You have ${snapshot.val()} shares of ${msg.content}`);
    }); 
  }
});

client.on('message', message => {
  const args = message.content.split(' ');
  const command = args[0];
  console.log(args);

  /*
  if(command === '!checkPrice') {
      stockSymbol = args[1];
      const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=sandbox_c1clrp748v6vbcpf4jt0`;
      https.get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          data = JSON.parse(data);
          message.reply(`The current price of ${stockSymbol} is ${data.c}`);
        })
      }).on('error', err => {
        console.log(err.message);
      })
  }
  */
   if(command === '!checkPrice') {
      stockSymbol = args[1];
      //fetch from the database, if it isn't there add a new entry and then return the value
      database.ref('stocks/' + stockSymbol).once('value')
      .then(function(snapshot) {
        data = snapshot.val();
        console.log(data);
        message.reply(`The price of ${stockSymbol} is ${data}`)
      });
  }
});

//global variable for the number of stocks, increase when buy or checkPrice is called and it adds a new one
let totalStocks = 0; //fetched stock arraylength
let sets = totalStocks.length / 50;
let currentSet = 0; 
setInterval(function(){ 
  //fetch the list of stocks for all servers
  database.ref('stocks').once('value')
  .then(function(snapshot) {
    data = snapshot.val();
    dataJSON = snapshot.toJSON();
    let keys = Object.keys(dataJSON)
    let numKeys = keys.length;
    for(let i = (currentSet  * 50); i < (currentSet + 1 * 50); i++) {
      if(i >= numKeys) {
        return;
      }
      else {
        //update the value of keys[i] in the database by fetching from finnhub and writing to the database
        let stockSymbol = keys[i];
        const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=sandbox_c1clrp748v6vbcpf4jt0`;
      https.get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          data = JSON.parse(data);
          if(data.c == 0) {
            console.log("This is not in the database");
            return;
          }
          database.ref('stocks/' + stockSymbol).set(data.c);
          console.log('done');
        })
      }).on('error', err => {
        console.log(err.message);
      });
      }
    }
  });
  currentSet = (currentSet + 1) % sets;
  //does this every minute, since it is 60,000 in ms 
}, 60000);
