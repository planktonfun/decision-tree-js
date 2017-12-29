$(document).on('click','#submit-button',function(){
    var inputArea = $('#input-area').val().trim();
    var inputArea2 = $('#input-area-2').val().trim();
    var data = JSON.parse('[' + inputArea.replace(/[\s]/g,"").replace(/([\w]+):/g,"\"$1\":").replace(/:'([\w]+)'/g,":\"$1\"") + ']');
    var config = JSON.parse(inputArea2.replace(/[\s]/g,"").replace(/([\w]+):/g,"\"$1\":").replace(/:'([\w]+)'/g,":\"$1\""));
    config.trainingSet = data;

    // Building Decision Tree
    var decisionTree = new dt.DecisionTree(config);

    $('#displayTree').html(treeToHtml(decisionTree.root));

});



// Recursive (DFS) function for displaying inner structure of decision tree
function treeToHtml(tree) {
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
                            treeToHtml(tree.match),
                        '</li>',
                        '<li>', 
                            '<a href="#">no</a>',
                            treeToHtml(tree.notMatch),
                        '</li>',
                    '</ul>',
                '</li>',
             '</ul>'].join('');
}
