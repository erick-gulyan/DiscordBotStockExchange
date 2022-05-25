//npm install discord.js
//npm install dotenv
//npm install firebase-admin


//Firebase Stuff
var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

const https = require('https');

const { MessageEmbed } = require('discord.js');

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

/*
//Function that is called whenever someone first tries to do any action, it will sign them up (if they don't come up properly)
function addUser(guildId, userId) {
  //if userID is already present on this server, then return
  //else sign up user 

  database.ref(`${guildId}/${userId}`).once('value')
  .then(function(snapshot) {
    if(snapshot.val() != null) {
      console.log("User already exists");
    }
    else {
      database.ref(`${guildId}/${userId}/balance`).set(25000);
      console.log("Set the new user balance");
    }
  });
  commandCenter();
}
*/

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


function commandCenter(message, args, guildId, userId, command, stockSymbol, amount, url, userBalance) {
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
    const buyEmbed = new MessageEmbed();
    buyEmbed.setTitle()
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
    database.ref(`${guildId}/${userId}/balance`).once('value')
    .then(function(snapshot) {
      //check if their balance is enough to pay for the amount
      userBalance = snapshot.val();
      database.ref(`stocks/${stockSymbol}`).once('value')
      .then(function(snapshot) {
        let stockPrice = snapshot.val();
        if(parseInt(stockPrice) * parseInt(amount) > parseInt(userBalance)) {
          message.reply("Insufficient Funds");
        }
        else {
          database.ref(`${guildId}/${userId}/balance`).set(parseInt(userBalance) - parseInt(stockPrice) * parseInt(amount));
          //check if user has stock and if not, set their amount to 0
          //Set user amount to user amount += requested amount
          database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).once('value')
          .then(function(snapshot) {
            let userAmount = snapshot.val();
            console.log(userAmount);
            if (userAmount == null) {
                userAmount = 0;
            }
            database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).set(parseInt(userAmount) + parseInt(amount));
            
            successful
            message.reply(`You have successfully purchased ${amount} shares of ${stockSymbol}`);
          });
        }
      });
    });

  }

  else if(command == "!viewPortfolio") {
    const viewPortfolioEmbed = new MessageEmbed();
    viewPortfolioEmbed.setTitle(`Portfolio for ${message.author.username}`);
    viewPortfolioEmbed.setColor('#008000');
    viewPortfolioEmbed.setImage('https://imgur.com/r/doge/pLChpFa');
    //Get balance
    database.ref(`${guildId}/${userId}/balance`).once('value')
    .then(function(snapshot) {
      userBalance = snapshot.val();
      database.ref(`${guildId}/${userId}/stocks`).once('value')
        .then(function(snapshot) {
          stocksList = snapshot.toJSON();
          stockSymbols = Object.keys(stocksList);
          viewPortfolioEmbed.addField(`Balance:`, `${userBalance}`);
          stockSymbols.forEach((element) => {
            viewPortfolioEmbed.addField(`${element}`, `${stocksList[element]}`);
            //messageReply += `${element}: ${stocksList[element]}\n`;
          });
          message.reply({embeds: [viewPortfolioEmbed] });
      });
    }); 
  }

  else if(command == "!sell") {
    //get the user stock amount and compare to the amount selling for that stock
    database.ref(`${guildId}/${userId}/stocks/${stockSymbol}`).once('value')
    .then(function(snapshot) {
      if(snapshot.val() >= amount) {
        database.ref(`${guildId}/${userId}/stocks/${stockSymbol}`).set(parseInt(snapshot.val() - parseInt(amount)));
        database.ref(`${guildId}/${userId}/balance`).once('value')
        .then(function(snapshot) {
          userBalance = snapshot.val();
          database.ref(`stocks/${stockSymbol}`).once('value')
          .then(function(snapshot) {
            let newBalance = parseInt(userBalance) + (parseInt(snapshot.val()) * parseInt(amount));
            database.ref(`${guildId}/${userId}/balance`).set(parseInt(newBalance));
            message.reply(`You have successfully sold ${amount} share(s) of ${stockSymbol}`);
          });
        });
      }
      else {
        message.reply(`You don't have enough shares of ${stockSymbol} to sell.`)
      }
    });    
  }

  else if(command == "!viewLeaderboard") { 

    database.ref(`${guildId}`).once('value')
    .then(function(snapshot) {
      let data = snapshot.val();
      let usersAndWealthArray = Object.entries(data);

      //loop through all users in the server

        //go through and add up all users stocks and balances

        //create an array of username, totalWealth tuples

        //sort based on the totalWealth portion of the tuple

        //display the leaderboard based on these results

      console.log(usersAndWealthArray[1][1].balance); //gives the user balance of the 2nd person 
      
    });
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
        console.log("User already exists");
        commandCenter(message, args, guildId, userId, command, stockSymbol, amount, url, userBalance);
      }
      else {
        database.ref(`${guildId}/${userId}/balance`).set(25000);
        database.ref(`${guildId}/${userId}/username`).set(message.author.username);
        message.reply('Thank you for signing in, you may now use all commands');
      }
    });
  }
  
  //Adds users when they try to do something
  addUser(guildId, userId, commandCenter);

  
  //setTimeout(function() {
  /*  
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
    database.ref(`${guildId}/${userId}/balance`).once('value')
    .then(function(snapshot) {
      //check if their balance is enough to pay for the amount
      userBalance = snapshot.val();
      database.ref(`stocks/${stockSymbol}`).once('value')
      .then(function(snapshot) {
        let stockPrice = snapshot.val();
        if(parseInt(stockPrice) * parseInt(amount) > parseInt(userBalance)) {
          message.reply("Insufficient Funds");
        }
        else {
          database.ref(`${guildId}/${userId}/balance`).set(parseInt(userBalance) - parseInt(stockPrice) * parseInt(amount));
          //check if user has stock and if not, set their amount to 0
          //Set user amount to user amount += requested amount
          database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).once('value')
          .then(function(snapshot) {
            let userAmount = snapshot.val();
            console.log(userAmount);
            if (userAmount == null) {
                userAmount = 0;
            }
            database.ref(`${guildId}/${userId}/stocks/` + stockSymbol).set(parseInt(userAmount) + parseInt(amount));
            message.reply(`You have successfully purchased ${amount} shares of ${stockSymbol}`);
          });
        }
      });
    });

  }

  else if(command == "!viewPortfolio") {
    //Get balance
    database.ref(`${guildId}/${userId}/balance`).once('value')
    .then(function(snapshot) {
      userBalance = snapshot.val();
      database.ref(`${guildId}/${userId}/stocks`).once('value')
        .then(function(snapshot) {
          stocksList = snapshot.toJSON();
          stockSymbols = Object.keys(stocksList);
          messageReply = `Balance: ${userBalance}\n`;
          stockSymbols.forEach((element) => {
            messageReply += `${element}: ${stocksList[element]}\n`;
          });
          message.reply(messageReply);
      });
    }); 
  }


  //}, 2000);
*/

});



//global variable for the number of stocks, increase when buy or checkPrice is called and it adds a new one
let totalStocks = 0; //fetched stock arraylength, need to fix this still 
let sets = ((totalStocks.length - 1) / 50) + 1;
let currentSet = 0; 
setInterval(function(){ 
  console.log("started");
  //fetch the list of stocks for all servers
  database.ref('stocks').once('value')
  .then(function(snapshot) {
    data = snapshot.val();
    dataJSON = snapshot.toJSON();
    let keys = Object.keys(dataJSON);
    let numKeys = keys.length;
    for(let i = (currentSet * 50); i < ((currentSet + 1) * 50); i++) {
      if(i >= numKeys) {
        return;
      }
      else {
        //update the value of keys[i] in the database by fetching from finnhub and writing to the database
        let stockSymbol = keys[i];
        console.log("updated");
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

//Function for getting a stock from finnhub
function finnhubFetch(stockSymbol) {

}

