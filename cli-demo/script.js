var desobj = require('./decision-tree.js');
var fs = require('fs');
var dt = desobj.dt;

// Training set
var jsonContent = fs.readFileSync('json_files/config.json', 'utf8');
var config = JSON.parse(jsonContent);

// Building Decision Tree
var decisionTree = new dt.DecisionTree(config);

// Building Random Forest
var numberOfTrees = 3;
var randomForest = new dt.RandomForest(config, numberOfTrees);

// Testing Decision Tree and Random Forest
var jsonContent = fs.readFileSync('json_files/input.json', 'utf8');
var comic = JSON.parse(jsonContent);

var decisionTreePrediction = decisionTree.predict(comic);
var randomForestPrediction = randomForest.predict(comic);

// Displaying predictions
console.log(JSON.stringify(comic, null, 0));
console.log(JSON.stringify(decisionTreePrediction, null, 0));
console.log(JSON.stringify(randomForestPrediction, null, 0));

// Displaying Decision Tree
console.log(treeToHtml(decisionTree.root));


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

