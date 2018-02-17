const csvFilePath='./Pokemon.csv';
const csv=require('csvtojson');
var fs = require('fs');

// Remove blank columns
var removeBlankColumns = function(objectCollection) {
    for (var i = objectCollection.length - 1; i >= 0; i--) {

        for(var key in objectCollection[i]) {
            if(objectCollection[i][key] == "") {
                objectCollection.splice(i,1);
            }
        }
    }

    return objectCollection;
}

// Normalize a column
var convertColumnToPercent = function(objectCollection, columnName) {
    var max = 0;

    for (var i = objectCollection.length - 1; i >= 0; i--) {
        var value = objectCollection[i][columnName];

        if(value > max) {
            max = value;
        }
    }

    for (var i = objectCollection.length - 1; i >= 0; i--) {
        var value = objectCollection[i][columnName];

        objectCollection[i][columnName] = value/max;

    }

    return objectCollection;
}

// Filter column
var filterColumn = function(objectCollection, columnName, filterColumn) {
    var filteredObject = [];

    for (var i = objectCollection.length - 1; i >= 0; i--) {
        var value = objectCollection[i][columnName];

        if(value == filterColumn) {
            filteredObject.push(objectCollection[i]);
        }
    }

    return filteredObject;
}

// Convert integer
var convertColumnInteger = function(objectCollection, columnName) {
    var filteredObject = [];

    for (var i = objectCollection.length - 1; i >= 0; i--) {
        var value = objectCollection[i][columnName];

        if(value == filterColumn) {
            filteredObject.push(objectCollection[i]);
        }
    }

    return filteredObject;
}

var objectData = [];

csv()
.fromFile(csvFilePath)
.on('json',(jsonObj)=>{
    objectData.push(jsonObj);
})
.on('done',(error)=>{
    // objectData = removeBlankColumns(objectData);
    // objectData = convertColumnToPercent(objectData, 'Total');
    objectData = convertColumnToPercent(objectData, 'HP');
    objectData = convertColumnToPercent(objectData, 'Sp-Def');
    objectData = convertColumnToPercent(objectData, 'Sp-Atk');
    objectData = convertColumnToPercent(objectData, 'Speed');
    objectData = convertColumnToPercent(objectData, 'Attack');
    objectData = convertColumnToPercent(objectData, 'Defense');

    // filtered = filterColumn(objectData, 'Generation', 1); // 3 6
    // filtered = filtered.concat(filterColumn(objectData, 'Generation', 2)); // 3 6
    // filtered = filtered.concat(filterColumn(objectData, 'Generation', 4)); // 3 6
    // filtered = filtered.concat(filterColumn(objectData, 'Generation', 5)); // 3 6
    // filtered = filtered.concat(filterColumn(objectData, 'Generation', 3)); // 3 6
    // filtered = filtered.concat(filterColumn(objectData, 'Generation', 6)); // 3 6

    // objectData = filtered;

    fs.writeFile('./normalized.json', JSON.stringify(objectData), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

});