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

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
var complete = 2;
var sheet_columns;
var sheet_rows;

function listMajors(auth) {
  var sheets = google.sheets('v4');
  var spreadsheetId = '1Hy3rmXSarcwD7E7N-bcoJzVx8yQ9CICtjtsV_rtekvk';
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1:F1'
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
    range: 'Sheet1!A2:F'
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
}

function isNumeric(num){
  return !isNaN(num)
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
            obj[sheet_columns[e].trim()] = parseInt(row[e]);
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

    // Configuration
    var config = {
        trainingSet: data,
        categoryAttr: 'action',
        ignoredAttributes: ['Time']
    };

    fs.writeFile(basepath + "config.json", JSON.stringify(config), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    // Building Decision Tree
    var decisionTree = new dt.DecisionTree(config);

    // Building Random Forest
    var numberOfTrees = 3;
    var randomForest = new dt.RandomForest(config, numberOfTrees);

    // Testing Decision Tree and Random Forest
    var comic = {Name: 'Comic guy', hitpoints: 8, cost: 290};

    fs.writeFile(basepath + "input.json", JSON.stringify(comic), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    var decisionTreePrediction = decisionTree.predict(comic);
    var randomForestPrediction = randomForest.predict(comic);

    // Displaying predictions
    console.log(JSON.stringify(comic, null, 0));
    console.log(JSON.stringify(decisionTreePrediction, null, 0));
    console.log(JSON.stringify(randomForestPrediction, null, 0));

    var tree = treeToHtml(decisionTree.root);

    // Displaying Decision Tree
    console.log(util.inspect(tree, false, null));

    fs.writeFile(basepath + "tree.json", JSON.stringify(tree), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    fs.writeFile(basepath + "tree.html", '<head><link rel="stylesheet" href="../base.css"></head><body><div class="tree" id="displayTree">' + htmlCss(decisionTree.root), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

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