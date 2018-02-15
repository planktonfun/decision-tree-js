const csv=require('csvtojson');

var jsonArray = [];
var fs = require('fs');

csv()
.fromFile('./Pokemon.csv')
.on('json', (jsonObj) => {
    jsonArray.push(jsonObj);
})
.on('done', (error) => {
    fs.writeFile("./pokemon-normalized.json", JSON.stringify(jsonArray), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
});