var desobj = require('./decision-tree.js');
var fs = require('fs');
var dt = desobj.dt;
var basepath = 'json_files/';

// Training set
var jsonContent = fs.readFileSync(basepath + 'config.json', 'utf8');
var config = JSON.parse(jsonContent);

// Building Decision Tree
var decisionTree = new dt.DecisionTree(config);

// Testing Decision Tree and Random Forest
var accuracy = 0;
for (var i = config.trainingSet.length - 1; i >= 0; i--) {
    var data = config.trainingSet[i];
    var correctData = data[config.categoryAttr];
    delete data[config.categoryAttr];
    var decisionTreePrediction = decisionTree.predict(data);
    console.log(decisionTreePrediction, correctData);
    if(decisionTreePrediction == correctData) {
        accuracy++;
    }
}

// Displaying predictions
console.log((accuracy/config.trainingSet.length)*100 + '% accurate');
