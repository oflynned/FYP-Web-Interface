/**
 * Created by ed on 02/02/2017.
 */
"use strict";
let fs = require("fs");

function readJSON(filename, callback){
    let fileDir = "/Users/ed/Desktop/FYP/" + filename + ".json";
    fs.readFile(fileDir, "utf8", function (err, res){
        if(err) throw err;
        callback(JSON.parse(res))
    });
}

function readJSONSelf(filename, callback){
    let fileDir = "/Users/ed/Desktop/FYP-Web-Interface/" + filename;
    fs.readFile(fileDir, "utf8", function (err, res){
        if(err) throw err;
        callback(JSON.parse(res))
    });
}

function groomAvgComplexity(dataItems, data, callback) {
    for (let item in data) {
        let graphPoint = {};
        graphPoint["x"] = data[item][0]["time"];
        //graphPoint["committer"] = data[item][0]["author"];
        graphPoint["y"] = data[item][1]["avg_complexity"];

        dataItems.push(graphPoint);
    }

    callback();
}

function writeJSON(filename, data, callback) {
    fs.writeFile(filename + ".json", data, "utf8", callback)
}

module.exports = {
    readJSON: readJSON,
    readJSONSelf: readJSONSelf,
    writeJSON: writeJSON,
    groomAvgComplexity: groomAvgComplexity
};