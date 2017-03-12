/**
 * Created by ed on 09/03/2017.
 */

let visualisation_area = $(".visualisation-area");
let currentTab = ".pipeline-btn";
let shouldSync = true;
let timerId = 0;

function Job(job_id, account, repo, iteration, maxIterations) {
    this.job_id = job_id;
    this.account = account;
    this.repo = repo;
    this.iteration = iteration;
    this.maxIterations = maxIterations;
}

function generateJob(job) {
    let percentage = getPercentage(job["iteration"], job["maxIterations"]);
    let url = "/" + job["account"] + "/" + job["repo"];

    return '<div id="' + job["job_id"] + '" class="container" style="margin-top: 2vh; margin-bottom: 2vh;">' +
        '<h1 class="title is-4">&lt;' +
        '<a href="' + url + '">' + job["account"] + '/' + job["repo"] + '</a>&gt;' +
        '</h1>' +
        '<h2 class="subtitle is-6">' + percentage + '% ' +
        '(Commit: ' + job["iteration"] + '/' + job["maxIterations"] + ')' +
        '</h2>' +
        '<progress id="#progression-bar" class="progress is-primary" ' +
        'value="' + parseInt(percentage) + '" max="100"></progress>' +
        '</div>';
}

function generateNoJobs(id) {
    return '<div class="container pipeline-empty" style="margin-top: 2vh; margin-bottom: 2vh;">' +
        '<h1 class="title is-4">' +
        'No jobs in the pipeline' +
        '</h1>' +
        '<h2 class="subtitle is-6">' +
        'Add a job above in order to aggregate metrics' +
        '</h2>' +
        '<progress id="#progression-bar" class="progress is-primary" value="0" max="100"></progress>' +
        '</div>'
}

function generateCheck(id) {
    return '<div class="container pipeline-empty" style="margin-top: 2vh; margin-bottom: 2vh;">' +
        '<h1 class="title is-4">' +
        'Checking pipeline...' +
        '</h1>' +
        '<h2 class="subtitle is-6">' +
        'Checking if there are any jobs in the pipeline for digestion' +
        '</h2>' +
        '<progress id="#progression-bar" class="progress is-primary" value="0" max="100"></progress>' +
        '</div>'
}

function getPercentage(iteration, maxIterations) {
    return parseFloat(Math.round((iteration / maxIterations) * 100)).toFixed(2);
}

function addItemToVisArea(item) {
    visualisation_area.append(item);
}

function setContent(data) {
    let jobs = [];
    for (let item in data)
        jobs.push(new Job(data[item]["id"], data[item]["account"],
            data[item]["repo_name"], data[item]["iteration"], data[item]["max_iterations"]));

    if (jobs.length == 0) {
        // no jobs in the pipeline -- notify user accordingly
        visualisation_area.empty();
        addItemToVisArea(generateNoJobs())
    } else {
        // else add the appropriate jobs and leave it alone
        visualisation_area.empty();
        for (let job in jobs) {
            let jobDOM = generateJob(jobs[job]);
            addItemToVisArea(jobDOM)
        }
    }
}

function generateTab() {
    let tabs = "";

    if (currentTab == ".pipeline-btn") {
        tabs = '<li class="is-active pipeline-btn"><a href="#pipeline">Pipeline</li>' +
            '<li class="harvested-btn"><a href="#harvested">Harvested</a></li>' +
            '<li class="raw-data-btn"><a href="#raw-data">Raw Data</a></li>'
    } else if (currentTab == ".harvested-btn") {
        tabs = '<li class="pipeline-btn"><a href="#pipeline">Pipeline</a></li>' +
            '<li class="is-active harvested-btn"><a href="#harvested">Harvested</a></li>' +
            '<li class="raw-data-btn"><a href="#raw-data">Raw Data</a></li>'
    } else if (currentTab == ".raw-data-btn") {
        tabs = '<li class="pipeline-btn"><a href="#pipeline">Pipeline</a></li>' +
            '<li class="harvested-btn"><a href="#harvested">Harvested</a></li>' +
            '<li class="is-active raw-data-btn"><a href="#raw-data">Raw Data</a></li>'
    }

    return '<nav class="tabs is-boxed is-fullwidth">' +
        '<div class="container">' +
        '<ul>' + tabs + '</ul>' +
        '</div>' +
        '</nav>'
}

function setTab() {
    let element = $(".hero-foot");
    element.empty();
    element.append(generateTab());
}

$(function () {
    $(document).ready(function () {
        addItemToVisArea(generateCheck());

        timerId = window.setInterval(function () {
            console.log(shouldSync);

            // if pipeline tab is set, update active jobs
            if (currentTab == ".pipeline-btn") {
                $.get("/get-jobs?status=pipeline", function (data) {
                    setContent(data);
                    if (data.length == 0) {
                    }
                });
            } else if (currentTab == ".harvested-btn") {
                $.get("/get-jobs?status=harvested", function (data) {
                    setContent(data);
                });
            } else if (currentTab == ".raw-data-btn") {
                $.get("/get-jobs?status=raw-data", function (data) {
                    setContent(data);
                });
            }
        }, 1000);
    });

    $("body").off().on("click", function (e) {
        e.preventDefault();
        $(".submit-job").off().on("click", function (e) {
            e.preventDefault();
            $.post("/submit-job", {url: $(".job-input").val()});
        });

        $(".pipeline-btn").off().on("click", function (e) {
            e.preventDefault();

            // get all jobs in progress from DB
            currentTab = ".pipeline-btn";
            setTab();
        });

        $(".harvested-btn").off().on("click", function (e) {
            e.preventDefault();

            // get all jobs finished processing from DB
            currentTab = ".harvested-btn";
            =
                setTab();
        });

        $(".raw-data-btn").off().on("click", function (e) {
            e.preventDefault();

            // allow json to be rendered to div?
            currentTab = ".raw-data-btn";
            setTab();
        });
    });
});