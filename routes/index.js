"use strict";

let express = require('express');
let router = express.Router();

let json_loader = require("./helpers/json_loader");

const AVG_COMPLEXITY = "TrumpScript_average_complexity_metrics";
const CYCLOMATIC = "TrumpScript_cyclomatic_metrics";
const MAINTAINABILITY = "TrumpScript_maintainability_metrics";
const RAW_METRICS = "TrumpScript_raw_metrics";

router.get('/avg-complexity', function (req, res) {
    json_loader.readJSON(AVG_COMPLEXITY, data => res.json(data));
});

router.get('/avg-complexity-groomed', function (req, res) {
    let dataItems = [];
    json_loader.readJSON(AVG_COMPLEXITY, data =>
        json_loader.groomAvgComplexity(dataItems, data, function () {
            res.json(dataItems)
        })
    );
});

router.get('/graph', function (req, res) {
    let dataItems = [];

    json_loader.readJSON(AVG_COMPLEXITY, data =>
        json_loader.groomAvgComplexity(dataItems, data, function () {
            json_loader.writeJSON(AVG_COMPLEXITY, JSON.stringify(dataItems, null, 4), res.render("index", {
                name: AVG_COMPLEXITY
            }));
        })
    );
});

router.get("/:file", function (req, res) {
    json_loader.readJSONSelf(req.params["file"], function (data) {
        res.json(data)
    });
});

module.exports = router;