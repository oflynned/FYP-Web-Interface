"use strict";

let express = require('express');
let router = express.Router();
let assert = require("assert");
let mongo = require('mongodb').MongoClient;

let cmd = require('node-cmd');

router.get('/metrics/:repo/:collection', function (req, res) {
    console.log(req.body);

    let repo = req.body["repo"];
    let metricsCollection = req.body["collection"];

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
            db.close();
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
            db.close();
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
            db.close();
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
            {
                $lookup: {
                    from: "commits",
                    localField: "commit",
                    foreignField: "head",
                    as: "commit_details"
                }
            }], function (err, result) {
            res.json(result);
            db.close();
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
            db.close();
        });
    });
});

router.get("/committers-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("commits").find().toArray(function (err, result) {
            res.json(result);
            db.close();
        });
    });
});

router.get("/repo-data/:repo", function (req, res) {
    mongo.connect('mongodb://localhost:27017/' + req.params["repo"], function (err, db) {
        db.collection("commits").find().toArray(function (err, result) {
            res.json(result);
            db.close();
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

router.get("/avg-graph-v-contributors/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("avg-complexity-v-contributors", {
        repo: repo,
        collection: collection
    });
});

router.get("/cumulative-contributors/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("contributor-join", {
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

router.get("/", function (req, res) {
    res.render("index", {title: "Code Analysis FYP"})
});

router.get("/about", function (req, res) {
    res.render("about", {title: "About"})
});

router.post("/submit-job", function (req, res) {
    let url = req.body["url"];
    url = url.split(".com/").pop();
    url = url.split("/");
    let account = url[0];
    let repo = url[1];

    cmd.get(
        'cd ../FYP; ./main.py ' + account + " " + repo,
        function (output) {
            console.log(output)
        }
    );

    res.json({status: "submitted job"});
});

router.get("/get-jobs", function (req, res) {
    let status = req.query["status"];

    mongo.connect('mongodb://localhost:27017/jobs', function (err, db_repo) {
        if (status === "pipeline") {
            db_repo.collection("repos").find().toArray(function (err, data) {
                let inProgress = [];
                for (let repo in data)
                    if (data[repo]["iteration"] < data[repo]["max_iterations"])
                        inProgress.push(data[repo]);

                res.json(inProgress);
                db_repo.close();
            });
        } else if (status === "harvested") {
            db_repo.collection("repos").find().toArray(function (err, data) {
                let inProgress = [];
                for (let repo in data)
                    if (data[repo]["iteration"] >= data[repo]["max_iterations"])
                        inProgress.push(data[repo]);

                res.json(inProgress);
                db_repo.close();
            });
        } else if (status === "raw-data") {
            db_repo.collection("repos").find().toArray(function (err, data) {
                res.json(data);
                db_repo.close();
            });
        }
    });
});

router.get('/:account/:repo', function (req, res) {
    console.log(req.params);
    res.render('graphs', {
        title: req.params["account"] + '/' + req.params["repo"],
        repo: req.params["repo"],
        account: req.params["account"]
    });
});

module.exports = router;