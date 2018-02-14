var desobj = require('./decision-tree.js');
var fs = require('fs');
var dt = desobj.dt;
var basepath = 'json_files/';
var data = [
    {x: 0, y: 0, xor: 0},
    {x: 0, y: 1, xor: 1},
    {x: 1, y: 0, xor: 1},
    {x: 1, y: 1, xor: 0}
];

// Training set
var config = {
    trainingSet: data,
    categoryAttr: 'xor',
    ignoredAttributes: []
};

// Building Decision Tree
var decisionTree = new dt.DecisionTree(config);

// Building Random Forest
var numberOfTrees = 3;
var randomForest = new dt.RandomForest(config, numberOfTrees);

// // Testing Decision Tree and Random Forest
// var jsonContent = fs.readFileSync(basepath + 'input.json', 'utf8');
// var comic = JSON.parse(jsonContent);

var decisionTreePrediction = decisionTree.predict(config.trainingSet[1]);
var randomForestPrediction = randomForest.predict(config.trainingSet[1]);

// // Displaying predictions
console.log(JSON.stringify(decisionTreePrediction, null, 0));
console.log(JSON.stringify(randomForestPrediction, null, 0));

// Displaying Decision Tree
console.log(treeToHtml(decisionTree.root));

fs.writeFile(basepath + "tree.html", '<head><link rel="stylesheet" href="../base.css"></head><body><div class="weee" style="    width: 100%;    height: 100%;    overflow-x: scroll;    overflow-y: scroll;"><div class="tree" id="displayTree" style="    width: 9000px;    height: 9000px;"><div class="tree" id="displayTree">' + htmlCss(decisionTree.root) + '</div></div>', function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved! " + basepath + "tree.html");
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