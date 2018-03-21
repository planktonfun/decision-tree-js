var BanditManager = require('./bandit-manager.js');
var Bandit = require('./bandit.js');
var desobj = require('./decision-tree.js');
var dt = desobj.dt;

var measureAccuracy = function(name, decisionTreePayload, data, display) {
    var score = 0;
    var i =0;
    for (var i = 0; i < data.length; i++) {

        if(data[i][target].toString() == decisionTreePayload.predict(data[i])) {
            score++;
        }
    }

    if(display==undefined) {
        console.log(score/data.length, name);
    }

    return score/data.length;
}

var measureAccuracywithTarget = function(name, decisionTreePayload, data, toward) {
    var score = 0;
    var i =0;
    for (var i = 0; i < data.length; i++) {

        if(data[i][toward].toString() == decisionTreePayload.predict(data[i])) {
            score++;
        }
    }

    console.log(score/data.length, name);

    return score/data.length;
}

var trackAccuracy = function(name, decisionTreePayload, data) {

    console.log(name);

    var predictors = {};

    var i =0;
    var scene = 0;
    var trainingSet = [];

    for (var i = 0; i < data.length; i++) {
        if(predictors[scene] == undefined) {
            predictors[scene] = {
                tree: '',
                trainingData: [],
                train: function() {
                    this.tree = new dt.RandomForest({
                        trainingSet: this.trainingData,
                        categoryAttr: target,
                        ignoredAttributes: ["#", "Name"],
                        maxTreeDepth: 10
                    }, 1)
                }
            }
        }

        predictors[scene].trainingData.push(data[i]);
        predictors[scene].train();

        var score = 0;

        for (var b = predictors[scene].trainingData.length - 1; b >= 0; b--) {
            if(
                predictors[scene].trainingData[b][target].toString()
                == predictors[scene].tree.predict(predictors[scene].trainingData[b])
            ) {
                data[i]['scene'] = scene;
                score++;
            }
        }

        if(score != predictors[scene].trainingData.length) {
            console.log('scene '+scene+' : ' + score);
            scene++;
        }
    }

    console.log('scene '+scene+' : ' + score);

    return {
        sceneTree: new dt.RandomForest({
            trainingSet: data,
            categoryAttr: "scene",
            ignoredAttributes: ["#", "Name", target],
            maxTreeDepth: 200
        }, 1),
        wholeTree: new dt.RandomForest({
            trainingSet: data,
            categoryAttr: target,
            ignoredAttributes: ["#", "Name"],
            maxTreeDepth: 200
        }, 1)
    };

}

var measureSize = function(name, decisionTreePayload) {
    console.log(JSON.stringify(decisionTreePayload).length, name);
}

var features = {};

function findFeatures(tree) {
    // only leafs containing category
    if (tree.category) {
        return  [' "', tree.category, '"'].join('');
    }

    var myBranch = {};
    var branchName = ['"',tree.attribute,' ',tree.predicateName,' ',tree.pivot,' ?"'].join('');

    if(features[tree.attribute] != undefined) {
        features[tree.attribute]++;
    } else {
        features[tree.attribute] = 1;
    }

    myBranch[branchName] = {
        'yes': findFeatures(tree.match),
        'no':  findFeatures(tree.notMatch)
    };

    return myBranch;
}

function sortFeatures() {
    var sortable = [];

    for (var key in features) {
        sortable.push([key, features[key]]);
    }

    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    features = sortable;
}

function findEasyFeatures(data) {
    // Count columns
    var featureColumns = {};
    var columnCounts = {};
    var giniIndex = {};

    for (var i = data.length - 1; i >= 0; i--) {
        for(key in data[i]) {
            if(featureColumns[key] == undefined) {
                featureColumns[key] = {};
                columnCounts[key] = 0;
            }

            if(featureColumns[key][data[i][key]] == undefined) {
                featureColumns[key][data[i][key]] = 0;
                columnCounts[key]++;
            }
                featureColumns[key][data[i][key]]++;
            
        }
    }

    for (var key in featureColumns) {
        if(giniIndex[key] == undefined) {
            giniIndex[key] = 1;
        }

        for (var i in featureColumns[key]) {
            var computed = (featureColumns[key][i]/data.length);
        computed*=computed;
        giniIndex[key]-=computed;
        }
    }

    var results = [];

    var sortable = [];

    for (var key in columnCounts) {
        sortable.push([key, columnCounts[key]]);
    }

    sortable.sort(function(a, b) {
        return a[1] - b[1];
    });

    results.push(sortable);

    var sortable = [];

    for (var key in giniIndex) {
        sortable.push([key, giniIndex[key]]);
    }

    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    results.push(sortable);

    return results;
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

function k_combinations(set, k) {
    var i, j, combs, head, tailcombs;

    // There is no way to take e.g. sets of 5 elements from
    // a set of 4.
    if (k > set.length || k <= 0) {
        return [];
    }

    // K-sized set has only one K-sized subset.
    if (k == set.length) {
        return [set];
    }

    // There is N 1-sized subsets in a N-sized set.
    if (k == 1) {
        combs = [];
        for (i = 0; i < set.length; i++) {
            combs.push([set[i]]);
        }
        return combs;
    }

    combs = [];
    for (i = 0; i < set.length - k + 1; i++) {
        // head is a list that includes only our current element.
        head = set.slice(i, i + 1);
        // We take smaller combinations from the subsequent elements
        tailcombs = k_combinations(set.slice(i + 1), k - 1);
        // For each (k-1)-combination we join it with the current
        // and store it to the set of k-combinations.
        for (j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]));
        }
    }
    return combs;
}

function combinations(set) {
    var k, i, combs, k_combs;
    combs = [];

    // Calculate all non-empty k-combinations
    for (k = 1; k <= set.length; k++) {
        k_combs = k_combinations(set, k);
        for (i = 0; i < k_combs.length; i++) {
            combs.push(k_combs[i]);
        }
    }
    return combs;
}

// Accuracy Function
var testCapabilities = function(estimator, trainingSet, targetCol) {

    var correct = 0;
    var failed  = 0;
    var total   = trainingSet.length;
    var failedSet = [];

    for (var i = trainingSet.length - 1; i >= 0; i--) {
        if(estimator.predict(trainingSet[i]) == trainingSet[i][targetCol]) {
            correct++;
        } else {
            failed++;
            failedSet.push(trainingSet[i]);
        }
    }

    return [
        correct,
        failed,
        total,
        failedSet
    ];
};

// Get Data row easily
var getDataIndex = function(indecies) {
    var temp = [];

    for (var i = indecies.length - 1; i >= 0; i--) {
        temp.push(data[indecies[i]]);
    }

    return temp;
};

var data = [
    {reco: 'irrelevantColumns', x: 0, y: 0, xor: 0, diff: 0, sum: 0, product: 0},
    {reco: 'irrelevantColumns', x: 0, y: 1, xor: 1, diff: -1, sum: 1, product: 0},
    {reco: 'irrelevantColumns', x: 1, y: 0, xor: 1, diff: 1, sum: 1, product: 0},
    {reco: 'irrelevantColumns', x: 1, y: 1, xor: 0, diff: 0, sum: 2, product: 1}
];

var fs = require('fs');
var jsonContent = fs.readFileSync('./normalized.json', 'utf8');
var data = JSON.parse(jsonContent);


var addMeasurements = function(col1, col2) {
    // Add quotient, product and sum
    for (var i = 0; i < data.length; i++) {
        var x = data[i][col1];
        var y = data[i][col2];

        data[i]['product-' + col1 + '-' + col2] = x*y;
        data[i]['sum-' + col1 + '-' + col2] = x+y;
        data[i]['difference-' + col1 + '-' + col2] = x-y;
    }
}

function k_combinations(set, k) {
    var i, j, combs, head, tailcombs;

    // There is no way to take e.g. sets of 5 elements from
    // a set of 4.
    if (k > set.length || k <= 0) {
        return [];
    }

    // K-sized set has only one K-sized subset.
    if (k == set.length) {
        return [set];
    }

    // There is N 1-sized subsets in a N-sized set.
    if (k == 1) {
        combs = [];
        for (i = 0; i < set.length; i++) {
            combs.push([set[i]]);
        }
        return combs;
    }

    combs = [];
    for (i = 0; i < set.length - k + 1; i++) {
        // head is a list that includes only our current element.
        head = set.slice(i, i + 1);
        // We take smaller combinations from the subsequent elements
        tailcombs = k_combinations(set.slice(i + 1), k - 1);
        // For each (k-1)-combination we join it with the current
        // and store it to the set of k-combinations.
        for (j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]));
        }
    }
    return combs;
}



// add combination of all please
var combination = k_combinations([
    'HP', 'Attack', 'Defense', 'Sp-Atk', 'Sp-Def', 'Speed'
], 2);

for (var i = combination.length - 1; i >= 0; i--) {
    var x = combination[i][0];
    var y = combination[i][1];

    addMeasurements(x,y);
}

// Building Decision Tree
// var data = shuffle(data);
var trainingSet = data.slice(0, Math.round(data.length*0.75));
var testingSet = data.slice(Math.round(data.length*0.75));
var numberOfTrees = 1; //Math.floor(data.length*0.05);
var target = 'Type 1';
var randomForest = new dt.RandomForest({
    trainingSet: data,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, numberOfTrees);

function percentFunction(tries, objectParam) {

    var accCount = 0;

    for (var e = tries; e >= 0; e--) {
        var vote = objectParam.randomForest.predict(objectParam.testingSet[e]);

        if(objectParam.testingSet[e][target]==vote) {
            accCount++;
        }
    }

    return accCount;
}

var manager = new BanditManager({
    'numberOfGroupTest': 20,
    'testCountForEachStep': 100,
    'sum': 100
});

manager.addArm(new Bandit(percentFunction, {
    randomForest: new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, 1),
    testingSet: trainingSet
}));

manager.addArm(new Bandit(percentFunction, {
    randomForest: new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, 10),
    testingSet: trainingSet
}));

manager.addArm(new Bandit(percentFunction, {
    randomForest: new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, 20),
    testingSet: trainingSet
}));

manager.addArm(new Bandit(percentFunction, {
    randomForest: new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, 30),
    testingSet: trainingSet
}));

manager.addArm(new Bandit(percentFunction, {
    randomForest: new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, 40),
    testingSet: trainingSet
}));

manager.addArm(new Bandit(percentFunction, {
    randomForest: new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"],
        maxTreeDepth: 200
    }, 50),
    testingSet: trainingSet
}));

manager.execute();

console.log('Easily classiable class if there where the target gini (low number = better):');
var easyFeatures = findEasyFeatures(data);
console.log(easyFeatures[1]);

console.log('Easily classiable class if there where the target uniqueness (low number = better):');
console.log(easyFeatures[0]);

console.log('Test Accuracy:');

measureAccuracy('Using Test Samples:', randomForest, testingSet);
measureAccuracy('Using Whole set:', randomForest, data);
measureSize('randomForest Size:', randomForest);

console.log('Most Percise tree: ');
var rf = randomForest;
var mostPercise = 0;
var index = 0;

for (var i = rf.trees.length - 1; i >= 0; i--) {

    var measurement = measureAccuracy('randomForest', rf.trees[i], data, false);

    if(measurement > mostPercise) {
        mostPercise = measurement;
        index = i;
    }
}

measureSize('randomForest Size:', rf.trees[index]);
measureAccuracy('randomForest', rf.trees[index], data);

findFeatures(rf.trees[index].root);
sortFeatures();

console.log('Most Important columns to classify the target :' + target);
console.log(features);

var sceneTreeSamples = trackAccuracy('Adding Scenarios', rf.trees[index], data);
measureAccuracywithTarget('sceneTree', sceneTreeSamples.sceneTree, data, 'scene');
measureSize('sceneTree Size:', sceneTreeSamples.sceneTree.trees[0]);
measureAccuracy('wholeTree', sceneTreeSamples.wholeTree, data);
measureSize('wholeTree Size:', sceneTreeSamples.wholeTree.trees[0]);

fs.writeFile("./json_files/scene-tree.html", '<head><link rel="stylesheet" href="../base.css"></head><body><div class="weee" style="    width: 100%;    height: 100%;    overflow-x: scroll;    overflow-y: scroll;"><div class="tree" id="displayTree" style="    width: 9000px;    height: 9000px;"><div class="tree" id="displayTree">' + htmlCss(sceneTreeSamples.sceneTree.trees[0].root) + '</div></div>', function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

fs.writeFile("./json_files/whole-tree.html", '<head><link rel="stylesheet" href="../base.css"></head><body><div class="weee" style="    width: 100%;    height: 100%;    overflow-x: scroll;    overflow-y: scroll;"><div class="tree" id="displayTree" style="    width: 9000px;    height: 9000px;"><div class="tree" id="displayTree">' + htmlCss(sceneTreeSamples.wholeTree.trees[0].root) + '</div></div>', function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

console.log('Investigations:');
console.log('- Determine if crossvalidation by predicting scenes then predicting outcome feature to improve size of tree and accuracy');
console.log('- Determine if genetic algorithm with bayesian optimization will workout');
console.log('- Determine Which features to remove/add to increase accuracy: (decision trees or random forest)');
console.log('- Cluster Data By generation First?');
console.log('- Make every feature a number/percent?');
console.log('- Determine why total can\'t be classified when its just the summation of all the stats?');
console.log('Findings:');
console.log('- Determine if adding scenes feature to improve size of tree and accuracy - it works!');
console.log('- Transform features then discard low gini impurities >< WRONG! randomForest size should be observed, the tree should be the same size no matter how many data');
console.log('- Use Bayesian optimization(multi-arm bandit) to get best hyperparameter works');
console.log('- more tree depth = slower train time = higher accuracy');
console.log('- more trees = faster train time = less tree depth');
console.log('- column numbers < column percent');
console.log('- lesser column uniqueness = higher accuracy');

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
                            '<a href="#">yes', '(', tree.matchedCount, ')', '</a>',
                            htmlCss(tree.match),
                        '</li>',
                        '<li>',
                            '<a href="#">no', '(', tree.notMatchedCount, ')', '</a>',
                            htmlCss(tree.notMatch),
                        '</li>',
                    '</ul>',
                '</li>',
             '</ul>'].join('');
}

fs.writeFile("./json_files/tree.html", '<head><link rel="stylesheet" href="../base.css"></head><body><div class="weee" style="    width: 100%;    height: 100%;    overflow-x: scroll;    overflow-y: scroll;"><div class="tree" id="displayTree" style="    width: 9000px;    height: 9000px;"><div class="tree" id="displayTree">' + htmlCss(rf.trees[index].root) + '</div></div>', function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});