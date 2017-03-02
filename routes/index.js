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
                localField: "commit",
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


router.get("/raw-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("raw_metrics").aggregate([

            {
                $lookup: {
                    from: "average_complexity",
                    localField: "commit",
                    foreignField: "commit_head",
                    as: "average_complexity"
                }
            },
            /*
            {
                $lookup: {
                    from: "maintainability",
                    localField: "commit",
                    foreignField: "commit",
                    as: "maintainability"
                }
            },
            {
                $lookup: {
                    from: "cyclomatic_complexity",
                    localField: "commit",
                    foreignField: "commit",
                    as: "complexity"
                }
            },*/
            {
                $lookup: {
                    from: "commits",
                    localField: "commit",
                    foreignField: "head",
                    as: "commit_details"
                }
            }], function (err, result) {
            res.json(result);
        });
    });
});

router.get("/raw-data/:repo/:commit", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("raw_metrics").aggregate([
            {
                $match: {
                    'commit': req.params["commit"]
                }
            },
            {
                $lookup: {
                    from: "maintainability",
                    localField: "commit",
                    foreignField: "commit",
                    as: "maintainability"
                }
            },
            {
                $lookup: {
                    from: "average_complexity",
                    localField: "commit",
                    foreignField: "commit_head",
                    as: "average_complexity"
                }
            },
            {
                $lookup: {
                    from: "cyclomatic_complexity",
                    localField: "commit",
                    foreignField: "commit",
                    as: "cyclomatic_complexity"
                }
            },
            {
                $lookup: {
                    from: "commits",
                    localField: "commit",
                    foreignField: "head",
                    as: "commit_details"
                }
            }], function (err, result) {
            res.json(result);
        });
    });
});

router.get("/committers-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("commits").find().toArray(function (err, result) {
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

router.get("/loc-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("loc", {
        repo: repo,
        collection: collection
    });
});

router.get("/complexity-loc-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("loc_v_complexity", {
        repo: repo,
        collection: collection
    });
});

router.get("/complexity-loc-change-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("loc_change_v_complexity", {
        repo: repo,
        collection: collection
    });
});


router.get("/complexity-loc-bubble-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("loc_complexity_user_bubble", {
        repo: repo,
        collection: collection
    });
});

router.get("/complexity-loc-scatter-graph/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("loc_complexity_user_scatter", {
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

router.get("/commit-frequency-graph/:repo/:epoch", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];
    let epoch = req.params["epoch"];

    res.render("commit-frequency", {
        repo: repo,
        collection: collection,
        epoch: epoch
    });
});

module.exports = router;