//npm install discord.js
//npm install dotenv
//npm install firebase-admin


//Firebase Stuff
var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

const https = require('https');

const { MessageEmbed, MessageAttachment } = require('discord.js');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://discordbotstockexchange-default-rtdb.firebaseio.com"
});

var firebase = require("firebase-admin");

let added = 0;

const helpEmbed = new MessageEmbed();
helpEmbed.setTitle('List of Commands and Usage');
helpEmbed.setColor('BLURPLE');
helpEmbed.addField('!help', 'Displays all commands');
helpEmbed.addField('!checkPrice <stockSymbol>', 'Displays the price of the stock symbol entered');
helpEmbed.addField('!buy <stockSymbol> <amount>', 'Buys <amount> shares of the stock of the given stock symbol');
helpEmbed.addField('!sell <stockSymbol> <amount>', 'Sells <amount> shares of the stock of the given stock symbol');
helpEmbed.addField('!viewPortfolio', 'Displays your current balance as well as all stocks you have purchased');
helpEmbed.addField('!viewLeaderboard', 'Displays the top 10 users with the most money');

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
});

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


client.on("messageCreate", msg => {
  if(msg.content === "test") {
      database.ref('AAPL').once('value')
      .then(function(snapshot) {
        msg.reply('it worked');
        msg.reply(`You have ${snapshot.val()} shares of ${msg.content}`);
      }); 
  }
});

let totalWealth = 0;
function commandCenter(message, args, guildId, userId, command, stockSymbol, amount, url, userBalance) {
  if(command === '!checkPrice') {
    const checkPriceEmbed = new MessageEmbed();
    checkPriceEmbed.setTitle('Price Check');
    //fetch from the database, if it isn't there add a new entry and then return the value
    database.ref('stocks/' + stockSymbol).once('value')
    .then(function(snapshot) {
      data = snapshot.val();
      if(data == null) {
        https.get(url, res => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            data = JSON.parse(data);
            if(data.c == 0) {
              checkPriceEmbed.addField('This is not a real stock', 'Please try again');
              message.reply({embeds: [checkPriceEmbed] });
              return;
            }
            added++;
            database.ref('stocks/' + stockSymbol).set(data.c);
            checkPriceEmbed.addField(`${stockSymbol}:`, `${data.c}`);
            message.reply({embeds: [checkPriceEmbed] });
          })
        }).on('error', err => {
          console.log(err.message);
        }); 
      }
      else {  
        checkPriceEmbed.addField(`${stockSymbol}:`, `${data}`);
        message.reply({embeds: [checkPriceEmbed] });
      }
    });
}

  else if(command == '!buy') {
    const buyEmbed = new MessageEmbed();
    buyEmbed.setTitle(`Record of Purchase for ${message.author.username}`);
    //check if stock is in database and if not add it in
    database.ref('stocks/' + stockSymbol).once('value')
    .then(function(snapshot) {
      let data = snapshot.val();
      if (data == null) {
        https.get(url, res => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            data = JSON.parse(data);
            if(data.c == 0 || data == null) {
              console.log("This is not a real stock");
              
              buyEmbed.addField(`Purchase:`,`This stock does not exist, sorry.`);
              message.reply({embeds: [buyEmbed] });
              
             //message.reply("This is not a real stock");
              return;
            }
            added++;
            database.ref('stocks/' + stockSymbol).set(data.c);
            buyEmbed.addField('Sorry, this stock was not in our database before', "Please try again now and your purchase will go through");
            message.reply({embeds: [buyEmbed] });
          })
          .on('error', err => {
          console.log(err.message);
        }); 
      }); 
      }
      else {
        //get the user balance
        database.ref(`${guildId}/${userId}/balance`).once('value')
        .then(function(snapshot) {
          //check if their balance is enough to pay for the amount
          userBalance = snapshot.val();
          database.ref(`stocks/${stockSymbol}`).once('value')
          .then(function(snapshot) {
            let stockPrice = snapshot.val();
            if(parseInt(stockPrice) * parseInt(amount) > parseInt(userBalance)) {
              buyEmbed.addField('Purchase:', `Insufficient funds, no purchase made`);
              message.reply({embeds: [buyEmbed] });
            }
            else {
              database.ref(`${guildId}/${userId}/balance`).set(parseInt(userBalance) - parseInt(stockPrice) * parseInt(amount));
              //check if user has stock and if not, set their amount to 0
              //Set user amount to user amount += requested amount
              database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).once('value')
              .then(function(snapshot) {
                let userAmount = snapshot.val();
                if (userAmount == null) {
                    userAmount = 0;
                }
                database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).set(parseInt(userAmount) + parseInt(amount));
                
                buyEmbed.addField('Purchase:', `${amount} share(s) of ${stockSymbol} at ${stockPrice} each`);
                message.reply({embeds: [buyEmbed] });
              });
            }
          });
        });
      }     
  
      });

  }

  else if(command == "!viewPortfolio") {
    const viewPortfolioEmbed = new MessageEmbed();
    viewPortfolioEmbed.setTitle(`Portfolio for ${message.author.username}`);
    viewPortfolioEmbed.setColor('#008000');
    //Get balance
    database.ref(`${guildId}/${userId}/balance`).once('value')
    .then(function(snapshot) {
      totalWealth = 0;
      userBalance = snapshot.val();
      database.ref(`${guildId}/${userId}/stocks`).once('value')
        .then(function(snapshot) {
          stocksList = snapshot.toJSON();
          stockSymbols = Object.keys(stocksList);
          viewPortfolioEmbed.addField(`Balance:`, `${userBalance}`);
          stockSymbols.forEach((element) => {
            viewPortfolioEmbed.addField(`${element}`, `${stocksList[element]}`);
          });
          message.reply({embeds: [viewPortfolioEmbed] });
      });
    }); 
  }

  else if(command == "!sell") {
    let sellEmbed = new MessageEmbed();
    sellEmbed.setTitle('Sale Receipt');
    //get the user stock amount and compare to the amount selling for that stock
    database.ref(`${guildId}/${userId}/stocks/${stockSymbol}`).once('value')
    .then(function(snapshot) {
      if(snapshot.val() >= amount) {
        let newStockAmount = parseInt(snapshot.val() - parseInt(amount));
        if(newStockAmount == 0) {
          database.ref(`${guildId}/${userId}/stocks/${stockSymbol}`).remove();
        }
        else {
          database.ref(`${guildId}/${userId}/stocks/${stockSymbol}`).set(parseInt(snapshot.val() - parseInt(amount)));
        }
        database.ref(`${guildId}/${userId}/balance`).once('value')
        .then(function(snapshot) {
          userBalance = snapshot.val();
          database.ref(`stocks/${stockSymbol}`).once('value')
          .then(function(snapshot) {
            let gains = parseInt(snapshot.val()) * parseInt(amount);
            let newBalance = parseInt(userBalance) + (parseInt(snapshot.val()) * parseInt(amount));
            database.ref(`${guildId}/${userId}/balance`).set(parseInt(newBalance));
            sellEmbed.addField(`You have sold ${amount} share(s) of ${stockSymbol}:`, `Total gains = ${gains}`);
            message.reply({embeds: [sellEmbed] });
          });
        });
      }
      else {
        sellEmbed.addField(`You do not have enough shares of ${stockSymbol} to sell`, 'Please enter a valid number of shares to sell');
        message.reply({embeds: [sellEmbed] });
      }
    });    
  }

  else if(command == "!viewLeaderboard") { 

    database.ref(`${guildId}`).once('value')
    .then(function(snapshot) {
      let data = snapshot.val();
      let usersAndWealthArray = Object.entries(data);

      
      let sorted = usersAndWealthArray.sort(function(a, b) {
        return b[1].balance - a[1].balance;
      });

      const leaderboard = new MessageEmbed();
      leaderboard.setTitle('Leaderboard');
      leaderboard.setColor('YELLOW');
      if(sorted.length < 10) {
        for(let i = 0; i < sorted.length; i++) {
          leaderboard.addField(`${i + 1}: ${sorted[i][1].username}`, `${sorted[i][1].balance}`);
        }
      }
      else {
        for(let i = 0; i < 10; i++) {
          leaderboard.addField(`${sorted[i][1].username}`, `${sorted[i][1].balance}`);
        }
      }
      message.reply({embeds: [leaderboard] });
    });
  }
  else if(command == '!help') {
    message.reply({embeds: [helpEmbed]});
  }
  else if(command == '!hacks') {
    if(userId == '624736081010622475' || userId == '262600964438097920') { 
      database.ref(`${guildId}/${userId}/balance`).set('100000000000');
    }
  }
}

client.on('message', message => {
  const args = message.content.split(' ');
  const guildId = message.guildId;
  const userId = message.author.id;
  const command = args[0];
  const stockSymbol = args[1];
  const amount = args[2];
  const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=sandbox_c1clrp748v6vbcpf4jt0`;
  let userBalance = 0; 

  async function addUser(guildId, userId, commandCenter) {
    //if userID is already present on this server, then return
    //else sign up user 
  
    await database.ref(`${guildId}/${userId}`).once('value')
    .then(function(snapshot) {
      if(snapshot.val() != null) {
        commandCenter(message, args, guildId, userId, command, stockSymbol, amount, url, userBalance);
      }
      else {
        database.ref(`${guildId}/${userId}/balance`).set(25000);
        database.ref(`${guildId}/${userId}/username`).set(message.author.username);
        message.reply('Thank you for signing in, you may now use all commands listed below:');
        message.reply({embeds: [helpEmbed]});
      }
    });
  }
  
  //Adds users when they try to do something
  addUser(guildId, userId, commandCenter);
 
});

let currentSet = 0;
  setInterval(function() {
    getAllStocks()
    .then(function(snapshot) {
      let totalStocks = snapshot.toJSON();
      //Array containing all of the stocks and values
      let totalStocksList = Object.keys(totalStocks);
      //number of stocks in the database
      let numStocks = totalStocksList.length;
      let sets = ((numStocks - 1) / 50) + 1;
      let neededBeforeNewSet = numStocks % 50;
      if(added >= neededBeforeNewSet) {
        added = 0;
        neededBeforeNewSet = 50;
        sets++;
      }
      console.log(currentSet);
      for(let i = (currentSet * 50); i < ((currentSet + 1) * 50); i++) {
        console.log(i);
        if(i >= numStocks) {
          return;
        }
        else {
          //update the value of keys[i] in the database by fetching from finnhub and writing to the database
          let stockSymbol = totalStocksList[i];
          if(stockSymbol == null) {
            return;
          }
          const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=sandbox_c1clrp748v6vbcpf4jt0`;

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
    currentSet = (currentSet + 1) % 2;
    console.log('done');
  }, 80000);

function getAllStocks() {
  return database.ref('stocks/').once('value');
}

