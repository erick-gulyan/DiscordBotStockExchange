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


const Discord = require("discord.js")
const { Client, Intents } = require('discord.js');
const client = new Discord.Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
require('dotenv').config();


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'server') {
		await interaction.reply('Server info.');
	} else if (commandName === 'user') {
		await interaction.reply('User info.');
	}
});

client.login(process.env.TOKEN);


//Function that is called whenever someone first tries to do any action, it will sign them up
function addUser() {
  //if userID is already present on this server, then return
  //else sign up user 
}

/*
// Fetch and get the list named 'members'
guild.members.fetch().then(members =>
{
  	// Loop through every members
	members.forEach(member =>
    {
      // Do whatever you want with the current member
      let userID = member.id;
      database.ref(`${guildId}`).set(userID);
      database.ref(`${guildId}/${userID}` + balance).set(25000);
      database.ref(`${guildId}/${userID}` + totalWealth).set(25000);

    });
});*/


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
  const guildId = message.guildId;
  const userId = message.author.id;
  const command = args[0];
  const stockSymbol = args[1];
  const amount = args[2];
  const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=sandbox_c1clrp748v6vbcpf4jt0`;
  let userBalance = 0; 

  if(command === '!checkPrice') {
      //fetch from the database, if it isn't there add a new entry and then return the value
      database.ref('stocks/' + stockSymbol).once('value')
      .then(function(snapshot) {
        data = snapshot.val();
        console.log(data);
        if(data == null) {
          https.get(url, res => {
            let data = '';
            res.on('data', chunk => {
              data += chunk;
            });
            res.on('end', () => {
              data = JSON.parse(data);
              if(data.c == 0) {
                console.log("This is not a real stock");
                message.reply("This is not a real stock");
                return;
              }
              database.ref('stocks/' + stockSymbol).set(data.c);
              message.reply(`The price of ${stockSymbol} is ${data.c}`);
            })
          }).on('error', err => {
            console.log(err.message);
          }); 
        }
        else {  
          message.reply(`The price of ${stockSymbol} is ${data}`);
        }
      });
  }

  else if(command == '!buy') {
    //check if stock is in database and if not add it in
    database.ref('stocks/' + stockSymbol).once('value')
    .then(function(snapshot) {
      let data = snapshot.val();
      console.log(data);
      if (data == null) {
        https.get(url, res => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            data = JSON.parse(data);
            if(data.c == 0) {
              console.log("This is not a real stock");
              return;
            }
            database.ref('stocks/' + stockSymbol).set(data.c);
          })
          .on('error', err => {
          console.log(err.message);
        }); 
      }); 
     }
    });

    //get the user balance
    userBalance = database.ref(`${guildId}/${userId}/balance`).once('value');
    console.log(userBalance);

    //check if their balance is enough to pay for the amount
    database.ref(`stocks/${stockSymbol}`).once('value')
    .then(function(snapshot) {
      let stockPrice = snapshot.val();
      if(stockPrice * amount > userBalance) {
        message.reply("Insufficient Funds");
        return;
      }
    });

    //check if user has stock and if not, set their amount to 0
    //Set user amount to user amount += requested amount
    database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).once('value')
    .then(function(snapshot) {
      let userAmount = snapshot.val();
      console.log(userAmount);
      if (userAmount == null) {
        database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).set(0);
      }
      database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).set(userAmount + amount);
    });

  }
});

//global variable for the number of stocks, increase when buy or checkPrice is called and it adds a new one
let totalStocks = 0; //fetched stock arraylength, need to fix this still 
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
      https.get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          data = JSON.parse(data);
          if(data.c == 0) {
            console.log("This is not a real stock");
            return;
          }
          database.ref('stocks/' + stockSymbol).set(data.c);
        })
      }).on('error', err => {
        console.log(err.message);
      });

      }
    }
  });
  currentSet = (currentSet + 1) % sets;
  ////does this every minute, since it is 60,000 in ms 
}, 60000);

//Function for fetching stock from the database
async function databaseFetch(stockSymbol) {
  return await database.ref('stocks/' + stockSymbol).once('value');
}

/*
Usage of the function: 
databaseFetch('NVDA').then(function(snapshot) {
  console.log(snapshot.val());
});
*/
