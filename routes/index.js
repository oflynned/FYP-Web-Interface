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

router.get("/loc/:repo/", function (req, res) {
    let repo = req.params["repo"];

    mongo.connect('mongodb://localhost:27017/' + repo, function (err, db) {
        let collection = db.collection("commits");
        let groomedResults = [];
        collection.find().toArray(function (err, results) {
            // synchronous for-loop ... not the best idea but sure
            let processLOC = function (i) {
                if (i < results.length) {
                    let collection = db.collection("raw_metrics");
                    let head = results[i]["head"];

                    collection.find({commit: head}).toArray(function (err, locResults) {
                        if (err) db.close();

                        let totLOC = 0;
                        let items = locResults[0]["files"];
                        for (let item in items) {
                            let loc = items[item]["loc"];
                            if (!isNaN(loc)) {
                                totLOC += loc;
                            }
                        }
                        results[i]["loc"] = totLOC;

                        let collection = db.collection("average_complexity");
                        collection.find({commit_head: head}).toArray(function (err, complexityResults) {
                            if (err) db.close();

                            results[i]["average_complexity"] = complexityResults[0]["avg_complexity"];
                            groomedResults.push(results[i]);
                            processLOC(i + 1);
                        });
                    });
                } else {
                    res.json(groomedResults);
                    db.close();
                }
            };

            processLOC(0);
        });
    });
});

function debugGroom(result, maxTime) {
    if (i === 2 || i === 6 || i === 7) {
        let maxComplexity = getMaxComplexity(result);
        for (let j = 0; j < result.length; j++) {
            let complexity = result[j]["avg_complexity"];
            result[j]["avg_complexity"] = (maxComplexity - complexity) + 2;
        }
    } else if (i === 5 || i === 8) {
        let isFirstTriggered = false;
        let triggerIndex = undefined;

        for (let j = 0; j < result.length; j++) {
            if(i === 5) {
                let year = new Date(result[j]["commit_details"][0]["time"]).getFullYear();
                if (year >= 2013 && !isFirstTriggered) {
                    triggerIndex = j;
                    isFirstTriggered = true;
                    maxTime = new Date(result[j]["commit_details"][0]["time"]);
                }
            } else if(i === 8) {
                let year = new Date(result[j]["commit_details"][0]["time"]).getFullYear();
                let month = new Date(result[j]["commit_details"][0]["time"]).getMonth();
                if (year >= 2016 && month > 3 && !isFirstTriggered) {
                    triggerIndex = j;
                    isFirstTriggered = true;
                    maxTime = new Date(result[j]["commit_details"][0]["time"]);
                }
            }
        }

        result = result.slice(0, triggerIndex);
    }
}

router.post("/overall-avg-complexity-data", function (req, res) {
    let repos = req.body["repos"];

    // interval, repo complexity
    let groomed = [["Interval (% max time)"]];

    function getInterval(time, minTime, maxTime) {
        let maxInterval = (maxTime - minTime) / maxTime;
        return Math.abs((((time - minTime) / maxTime) / maxInterval) * 100);
    }

    function insertAt(array, index) {
        let arrayToInsert = Array.prototype.splice.apply(arguments, [2]);
        return insertArrayAt(array, index, arrayToInsert);
    }

    function insertArrayAt(array, index, arrayToInsert) {
        Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
        return array;
    }

    function getMaxComplexity(array) {
        let max = 0;
        for (let i = 0; i < array.length; i++) {
            if (array[i]["avg_complexity"] > max) max = array[i]["avg_complexity"];
        }

        return max;
    }

    let processRepo = function (i) {
        if (i < repos.length) {
            mongo.connect('mongodb://localhost:27017/' + repos[i], function (err, db) {
                db.collection("average_complexity").aggregate({
                    $lookup: {
                        from: "commits",
                        localField: "commit_head",
                        foreignField: "head",
                        as: "commit_details"
                    }
                }, function (err, result) {
                    let min = result[0];
                    let max = result[result.length - 1];

                    let minTime = new Date(min["commit_details"][0]["time"]).getTime();
                    let maxTime = new Date(max["commit_details"][0]["time"]).getTime();

                    groomed[0].push(repos[i]);

                    //debugGroom();

                    for (let item in result) {
                        let complexity = parseFloat(result[item]["avg_complexity"]);
                        let time = parseInt(new Date(result[item]["commit_details"][0]["time"]).getTime());
                        let interval = parseFloat(getInterval(time, minTime, maxTime));

                        if (i === 0) {
                            groomed.push([interval, complexity])
                        } else {
                            // else find the slot to insert the new value and append to new row in groomed
                            // holes in other cols should be filled with the nearest value for consistency
                            for (let j = 1; j < groomed.length; j++) {
                                if (interval === groomed[j][0]) {
                                    // j is the correct key, no insertion needed, just append
                                    // 100 is always max -- shouldn't have to worry about overflow?
                                    groomed[j].push(complexity);
                                } else if (interval > groomed[j][0] && interval < groomed[j + 1][0]) {
                                    // add a new row, interval doesn't exist
                                    // every other row has previous value from row - 1 to fill holes

                                    let insertion = [];
                                    insertion.push(interval);
                                    for (let tempBlank = 0; tempBlank < i; tempBlank++) {
                                        insertion.push(-1);
                                    }

                                    insertion.push(complexity);
                                    insertArrayAt(groomed, j, [insertion]);

                                    // only 1 insertion ever per iteration -- done with this loop
                                    break;
                                }
                            }


                            // fill in all the gaps with -1 for previous iterations NOT changed in last update
                            for (let j = 0; j < groomed.length; j++) {
                                if (groomed[j].length < i + 2) {
                                    groomed[j].push(-1);
                                }
                            }
                        }
                    }

                    groomed.sort(function (a, b) {
                        return a[0] > b[0] ? 1 : -1;
                    });

                    // now fill in gaps of -1 with previous row value
                    for (let r = 1; r < groomed.length; r++) {
                        let row = groomed[r];
                        for (let c = 1; c < row.length; c++) {
                            // indicates a gap -- get previous row and copy as value
                            if (row[c] === -1) {
                                // set this (row, col) to be that value
                                row[c] = groomed[r - 1][c];
                            }
                        }
                    }

                    for (let r in groomed) {
                        while (groomed[r].length > i + 2)
                            groomed[r].pop();

                        // console.log(groomed[r])
                    }

                    db.close();
                    processRepo(i + 1)
                });
            });

        } else {
            res.json(groomed);
        }
    };

    processRepo(0);
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

router.get("/cumulative-contributors-normalised/:repo", function (req, res) {
    let repo = req.params["repo"];
    let collection = req.params["collection"];

    res.render("committers-normalised", {
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

router.get("/aggregate-complexity-graph", function (req, res) {
    res.render("overall_complexity");
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