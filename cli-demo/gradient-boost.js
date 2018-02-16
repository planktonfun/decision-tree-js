var desobj = require('./decision-tree.js');
var dt = desobj.dt;

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
    {x: 0, y: 0, xor: 0},
    {x: 0, y: 1, xor: 1},
    {x: 1, y: 0, xor: 1},
    {x: 1, y: 1, xor: 0}
];

// Building Decision Tree
var decisionTree = [];
var combinationsK = k_combinations([0,1,2,3], 3);
console.log(combinationsK);
for (var i = combinationsK.length - 1; i >= 0; i--) {
    decisionTree.push(new dt.DecisionTree({
        trainingSet: getDataIndex(combinationsK[i]),
        categoryAttr: 'xor',
        ignoredAttributes: []
    }));
}

// Test Accuracy
for (var e = data.length - 1; e >= 0; e--) {

    var classVotes = {};

    for (var i = decisionTree.length - 1; i >= 0; i--) {
        var vote = decisionTree[i].predict(data[e]);

        if(classVotes[vote] != undefined) {
            classVotes[vote]++;
        } else {
            classVotes[vote] = 1;
        }
    }

    console.log(classVotes, data[e]['xor']);
}

// Conclusions:
// combinations to used as a test data
// XOR Test Data
// accuracy 100% combination 75%  k_combinations([0,1,2,3], 3)
// accuracy 50% combination 50%   k_combinations([0,1,2,3], 2)
// accuracy 50% combination 25%   k_combinations([0,1,2,3], 1)
// accuracy 50% combination 100%  k_combinations([0,1,2,3], 4)
//
// OR Test Data
// accuracy 100% combination 75%  k_combinations([0,1,2,3], 3)
// accuracy 75% combination 50%   k_combinations([0,1,2,3], 2)
// accuracy 75% combination 25%   k_combinations([0,1,2,3], 1)
// accuracy 100% combination 100% k_combinations([0,1,2,3], 4)
//
// AND Test Data
// accuracy 100% combination 75%  k_combinations([0,1,2,3], 3)
// accuracy 75% combination 50%   k_combinations([0,1,2,3], 2)
// accuracy 75% combination 25%   k_combinations([0,1,2,3], 1)
// accuracy 100% combination 100% k_combinations([0,1,2,3], 4)