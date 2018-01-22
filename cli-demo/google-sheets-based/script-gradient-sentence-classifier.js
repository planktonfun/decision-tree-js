var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var desobj = require('./decision-tree.js');
var util = require('util')
var basepath = '../json_files/';

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_id.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Sheets API.
  authorize(JSON.parse(content), listMajors);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}


var tokenizeSentences = function(payload) {

  this.tokenization = function(sentence) {
      sentence = String(sentence);
      sentence = sentence.replace(/[!"#\$%&\(\)\*\+,\-\.\/\:;<=>\?@\[\\\]\^_`{\|}~\t\n]/gm,"");
      sentence = sentence.toLowerCase();
      sentence = sentence.split(" ");

      return sentence;
  }

  this.getVowels = function(str) {
    var m = str.match(/[aeiou]/gi);
    return m === null ? 0 : m.length;
  }

  this.getConsonants = function(str) {
    var m = str.match(/[^aeiou]/gi);
    return m === null ? 0 : m.length;
  }

  this.getSpaces = function(str) {
    var m = str.match(/[\s]/gi);
    return m === null ? 0 : m.length;
  }

  var dataHolder = [];

  for (var i = 0; i < payload.length; i++) {
      var summary = this.tokenization(payload[i]['Pattern']);
      var points = payload[i]['action'];
      
      var currentRow = {
        'num-of-spaces': this.getSpaces(payload[i]['Pattern']),
        'num-of-words': summary.length,
        'num-of-vowel': this.getVowels(payload[i]['Pattern']),
        'num-of-consonants': this.getConsonants(payload[i]['Pattern']),
        'action':points
      };

      for (var e = 0; e < summary.length; e++) {
          if(currentRow[summary[e]] == undefined) {
              currentRow[summary[e]] = 1;
          } else {
              currentRow[summary[e]]++;
          }
      }

      dataHolder.push(currentRow);
  }

  return dataHolder;
};

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
var complete = 2;
var sheet_columns;
var sheet_rows;

function getConfigValues(auth, spreadsheetId,spreadsheetTab,callback) {
  var sheets = google.sheets('v4');

  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetId,
    range: spreadsheetTab + '!B1:B2'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var rows = response.values;

    if (rows.length == 0) {
      console.log('No data found.');
    }

    callback({
      columns: response.values[0],
      rows: response.values[1]
    });
  });

  return ;
}

function listMajors(auth) {
  var sheets = google.sheets('v4');
  var spreadsheetId = '1fFKVReyCA-6fiMh-zgfXUPloEFohkVV2qEbgQob6wZM';
  // var spreadsheetTab = 'MarioAStar';
  // var spreadsheetTab = 'Shopping';
  // var spreadsheetTab = 'Lab';
  // var spreadsheetTab = 'Iris';
  // var spreadsheetTab = 'Wine';
  // var spreadsheetTab = 'Youtube';
  // var spreadsheetTab = 'xor';
  var spreadsheetTab = process.argv[2];

  getConfigValues(auth, spreadsheetId,spreadsheetTab, function(config){
    console.log(config);
    sheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: spreadsheetId,
      range: spreadsheetTab + '!' + config.columns
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var rows = response.values;
      if (rows.length == 0) {
        console.log('No data found.');
      } else {
         complete--;
         sheet_columns = rows[0];
         start();
      }
    });

    sheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: spreadsheetId,
      range: spreadsheetTab + '!' + config.rows
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var rows = response.values;
      if (rows.length == 0) {
        console.log('No data found.');
      } else {
         complete--;
         sheet_rows = rows;
         start();
      }
    });
  });

}

function isNumeric(num){
  return !isNaN(num)
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var start = function() {
    if(complete > 0) return;

    var dt = desobj.dt;

    // Training set
    var data = [];

    for (var i = 0; i < sheet_rows.length; i++) {
      var row = sheet_rows[i];
      // Print columns A and E, which correspond to indices 0 and 4.

      var obj = {};
      for (var e = 0; e < sheet_columns.length; e++) {
        var numeric = isNumeric(row[e]);
        if(numeric) {
            obj[sheet_columns[e].trim()] = parseFloat(row[e]);
        } else {
            obj[sheet_columns[e].trim()] = row[e];
        }
      }
      data.push(obj);
    }

    fs.writeFile(basepath + "data.json", JSON.stringify(obj), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    var minimumTrainingRows = 3;
    var errorRate = 0;
    var errorTotalRate = 100;
    var configThatWorked = 'none';
    var configThatLowestPercent = 'none';
    var exception = [];

    data = tokenizeSentences(data);

    while(errorRate == 0) {
      data = shuffle(data);
	    var tr = [];

	    for (var i = 0; i < minimumTrainingRows; i++) {
        if(exception.indexOf(i) > -1 ) {
          continue;
        }

	    	tr.push(data[i]);
	    }

	    // Configuration
	    var config = {
	        trainingSet: tr,
	        categoryAttr: 'action',
	        ignoredAttributes: [],
          maxTreeDepth: 10
	    };

	    // Building Decision Tree
	    try {
	    	var decisionTree = new dt.DecisionTree(config);

	    	// Display error rating
		    var errors = 0;

		    for (var i = config.trainingSet.length - 1; i >= 0; i--) {
		    	if(config.trainingSet[i].action == undefined) {
		    		continue;
		    	}
		      	var actionToPredict = config.trainingSet[i].action;
		      	var sample = config.trainingSet[i];

		      if(decisionTree.predict(sample) != actionToPredict) {
		        errors++;
		      }
		    }

		    errorRate = ((errors/tr.length)*100);

        // Display error rating
        var errors = 0;
        data = shuffle(data);
        var tokenized = data;
        for (var i = tokenized.length - 1; i >= 0; i--) {
          if(tokenized[i].action == undefined) {
            continue;
          }
            var actionToPredict = tokenized[i].action;
            var sample = tokenized[i];

          if(decisionTree.predict(sample) != actionToPredict) {
            errors++;
          }
        }

        if(((errors/tokenized.length)*100) <= errorTotalRate) {
            errorTotalRate = ((errors/tokenized.length)*100);
            configThatLowestPercent = config;
            fs.writeFileSync(basepath + "config.json", JSON.stringify(config));
            console.log("The file was saved!");
        }

		    if(errorRate == 0) {
		    	configThatWorked = config;
		    } else {
          console.log('skipping: ' + (minimumTrainingRows-1));
          exception.push((minimumTrainingRows-1));

          console.log('total: ' + ((errors/tokenized.length)*100) + '%');

          errorRate = 0;
        }

        console.log('Lowest total: ' + errorTotalRate + '%');

		  } catch(e) {
	    	console.log('an error occured', e, config);
	    }

	    console.log('Error Rate:' + errorRate + '%', minimumTrainingRows);

	    if(minimumTrainingRows > data.length) {
	    	errorRate = 100;
	    }

	    minimumTrainingRows++;
    }

    var config = configThatLowestPercent;
    var decisionTree = new dt.DecisionTree(config);

    // Displaying predictions
    // console.log(JSON.stringify(comic, null, 0));
    // console.log(JSON.stringify(decisionTreePrediction, null, 0));
    // console.log(JSON.stringify(randomForestPrediction, null, 0));

    var tree = treeToHtml(decisionTree.root);

    // Displaying Decision Tree
    console.log(util.inspect(tree, false, null));

    fs.writeFile(basepath + "config.json", JSON.stringify(config), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    fs.writeFile(basepath + "tree.json", JSON.stringify(tree), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    fs.writeFile(basepath + "tree.html", '<head><link rel="stylesheet" href="../base.css"></head><body><div class="weee" style="    width: 100%;    height: 100%;    overflow-x: scroll;    overflow-y: scroll;"><div class="tree" id="displayTree" style="    width: 9000px;    height: 9000px;"><div class="tree" id="displayTree">' + htmlCss(decisionTree.root) + '</div></div>', function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    // Display error rating
    var errors = 0;
    var tokenized = data;
    for (var i = tokenized.length - 1; i >= 0; i--) {
    	if(tokenized[i].action == undefined) {
    		continue;
    	}
      	var actionToPredict = tokenized[i].action;
      	var sample = tokenized[i];

      if(decisionTree.predict(sample) != actionToPredict) {
        errors++;
      }
    }

    errorRate = ((errors/tokenized.length)*100);

    console.log('Final Error Rate:' + errorRate + '%');

    // Recursive (DFS) function for displaying inner structure of decision tree
    function treeToHtml(tree) {
        // only leafs containing category
        if (tree.category) {
            return  [' "', tree.category, '"'].join('');
        }

        var myBranch = {};
        var branchName = ['"',tree.attribute,' ',tree.predicateName,' ',tree.pivot,' ?"'].join('');

        myBranch[branchName] = {
            'yes': treeToHtml(tree.match),
            'no':  treeToHtml(tree.notMatch)
        };

        return myBranch;
    }

    // Recursive (DFS) function for displaying inner structure of decision tree
    function htmlCss(tree) {
        // only leafs containing category
        if (tree.category) {
            return  ['<ul>',
                        '<li>',
                            '<a href="#">',
                                '<b>', tree.category, '</b>',
                            '</a>',
                        '</li>',
                     '</ul>'].join('');
        }

        return  ['<ul>',
                    '<li>',
                        '<a href="#">',
                            '<b>', tree.attribute, ' ', tree.predicateName, ' ', tree.pivot, ' ?</b>',
                        '</a>',
                        '<ul>',
                            '<li>',
                                '<a href="#">yes</a>',
                                htmlCss(tree.match),
                            '</li>',
                            '<li>', 
                                '<a href="#">no</a>',
                                htmlCss(tree.notMatch),
                            '</li>',
                        '</ul>',
                    '</li>',
                 '</ul>'].join('');
    }

}