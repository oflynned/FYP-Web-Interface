"use strict";

let express = require('express');
let router = express.Router();
let assert = require("assert");
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

router.get("/avg-complexity-data/:repo", function (req, res) {
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

router.get("/cyclomatic-complexity-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("cyclomatic_complexity").aggregate({
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

router.get("/maintainability-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("maintainability").aggregate({
            $lookup: {
                from: "commits",
                localField: "commit",
                foreignField: "head",
                as: "commit_details"
            }
        }, function (err, result) {
            res.json(result);
        });
    });
});

router.get("/committers-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("commits").find({}).toArray(function (err, result) {
            res.json(result);
        });
    });
});

// graph rendering

router.get("/avg-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("avg-complexity", {
        repo: repo,
        collection: collection
    });
});

router.get("/complexity-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("complexity", {
        repo: repo,
        collection: collection
    });
});

router.get("/maintainability-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("maintainability", {
        repo: repo,
        collection: collection
    });
});

router.get("/committers-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("committers", {
        repo: repo,
        collection: collection
    });
});

router.get("/commit-frequency-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("commit-frequency", {
        repo: repo,
        collection: collection
    });
});

module.exports = router;