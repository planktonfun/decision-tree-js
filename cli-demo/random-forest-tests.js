var desobj = require('./decision-tree.js');
var dt = desobj.dt;

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
            } else {
                featureColumns[key][data[i][key]]++;
            }
        }
    }

    for (var key in featureColumns) {
        if(giniIndex[key] == undefined) {
            giniIndex[key] = 1;
        }

        for (var i in featureColumns[key]) {
            giniIndex[key] = giniIndex[key] * (featureColumns[key][i]/data.length);
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
    {reco: 'irrelevantColumns', x: 0, y: 0, xor: 0},
    {reco: 'irrelevantColumns', x: 0, y: 1, xor: 1},
    {reco: 'irrelevantColumns', x: 1, y: 0, xor: 1},
    {reco: 'irrelevantColumns', x: 1, y: 1, xor: 0}
];

var fs = require('fs');
var jsonContent = fs.readFileSync('./normalized.json', 'utf8');
var data = JSON.parse(jsonContent);

// Building Decision Tree
// var data = shuffle(data);
var trainingSet = data.slice(0, Math.round(data.length*0.75));
var testingSet = data.slice(Math.round(data.length*0.75));
var numberOfTrees = 50;
var target = 'Type 1';
var randomForest = new dt.RandomForest({
        trainingSet: trainingSet,
        categoryAttr: target,
        ignoredAttributes: ["#", "Name"]
    }, numberOfTrees);


for (var i = randomForest.trees.length - 1; i >= 0; i--) {
    findFeatures(randomForest.trees[i].root);
}
sortFeatures();

console.log('Most Easily Classified Features:');
var easyFeatures = findEasyFeatures(data);
console.log(easyFeatures);

console.log('Most Important features to classify (' + target + '):');
console.log(features);

console.log('Test Accuracy:');
var accCount = 0;

for (var e = testingSet.length - 1; e >= 0; e--) {
    var vote = randomForest.predict(testingSet[e]);

    // console.log(testingSet[e][target], vote);
    if(testingSet[e][target]==vote) {
        accCount++;
    }

    // console.log(accCount,(testingSet.length-e),accCount/(testingSet.length-e)*100+'%');

}

console.log(accCount,testingSet.length,accCount/testingSet.length*100+'%');


var accCount = 0;

for (var e = data.length - 1; e >= 0; e--) {
    var vote = randomForest.predict(data[e]);

    // console.log(data[e][target], vote);
    if(data[e][target]==vote) {
        accCount++;
    }

}

console.log(accCount,data.length,accCount/data.length*100+'%');

console.log('Investigations:');
console.log('- Determine Which features to remove/add to increase accuracy: (decision trees or random forest)');
console.log('- Cluster Data By generation First?');
console.log('- Make every feature a number/percent?');
console.log('- Determine why total can\'t be classified when its just the summation of all the stats?');
console.log('Findings:');
console.log('- more tree depth = slower train time = higher accuracy');
console.log('- more trees = faster train time = less tree depth');
console.log('- column numbers < column percent');
console.log('- lesser column uniqueness = higher accuracy');