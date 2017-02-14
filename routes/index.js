"use strict";

let express = require('express');
let router = express.Router();
let assert = require("assert");
let Promise = require("promise");
let mongo = require('mongodb').MongoClient;

router.get('/metrics/:repo/:collection', function (req, res) {
    let repo = req.params["repo"];
    let metricsCollection = req.params["collection"];

    mongo.connect('mongodb://localhost:27017/' + repo, function (err, db) {
        let collection = db.collection(metricsCollection);
        collection.find().toArray(function (err, results) {
            res.json(results);
            db.close();
        });
    });
});

router.get("/avg-complexity-graph/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("average_complexity").aggregate({
            $lookup: {
                from: "commits",
                localField: "commit_head",
                foreignField: "head",
                as: "commit_details"
            }
        }, function (err, result) {
            res.json(result);
        });
    });
});

router.get("/graph/:repo/:collection", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];
    res.render("index", {url: "http://localhost:3000/metrics/" + repo + "/" + collection});
});

module.exports = router;