/**
 * Created by ed on 09/03/2017.
 */

let repos = [
    ["oflynned", "AI-Art"],
    ["samshadwell", "TrumpScript"],
    ["joke2k", "faker"],
    ["Russell91", "pythonpy"],
    ["ajalt", "fuckitpy"],
    ["nvbn", "thefuck"],
    ["binux", "pyspider"],
    ["scikit-learn", "scikit-learn"],
    ["pyca", "cryptography"],
    ["pyca", "pyopenssl"]
];

function Job(job_id, account, repo, iteration, maxIterations) {
    this.job_id = job_id;
    this.account = account;
    this.repo = repo;
    this.iteration = iteration;
    this.maxIterations = maxIterations;
}

function generateJob(job) {
    let percentage = getPercentage(job["iteration"], job["maxIterations"]);
    console.log(parseInt(percentage));

    return '<div id="' + job["job_id"] + '" class="container" style="margin-top: 2vh; margin-bottom: 2vh;">' +
        '<h1 class="title is-4">' +
        'Job &lt;' + job["account"] + '/' + job["repo"] + '&gt;:' +
        '</h1>' +
        '<h2 class="subtitle is-6">' + percentage + '% ' +
        '(Commit: ' + job["iteration"] + '/' + job["maxIterations"] + ')' +
        '</h2>' +
        '<progress id="#progression-bar" class="progress is-primary" ' +
        'value="' + parseInt(percentage)+ '" max="100"></progress>' +
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

function addItemToProgression(item) {
    $(".progression-area").append(item);
}

$(function () {
    $(document).ready(function () {
        // TODO keep track of selected tab

        let progression_area = $(".progression-area");
        addItemToProgression(generateCheck());

        window.setInterval(function () {
            // if pipeline tab is set, update active jobs
            $.get("/get-jobs?status=pipeline", function (data) {
                let jobs = [];
                for(let item in data)
                    jobs.push(new Job(data[item]["id"], data[item]["account"],
                        data[item]["repo_name"], data[item]["iteration"], data[item]["max_iterations"]));

                if (jobs.length == 0) {
                    // no jobs in the pipeline -- notify user accordingly
                    progression_area.empty();
                    addItemToProgression(generateNoJobs())
                } else {
                    // else add jobs for the first time
                    progression_area.empty();
                    for (let job in jobs) {
                        let jobDOM = generateJob(jobs[job]);
                        addItemToProgression(jobDOM)
                    }
                }
            });
        }, 1000);

        $(".submit-job").click(function (e) {
            e.preventDefault();

            $.post("/submit-job", {url: $(".job-input").val()});

        });

        $(".pipeline-btn").click(function (e) {
            e.preventDefault();

            // get all jobs in progress from DB
        });

        $(".harvested-btn").click(function (e) {
            e.preventDefault();

            // get all jobs finished processing from DB
        });

        $(".raw-data-btn").click(function (e) {
            e.preventDefault();

            // allow json to be rendered to div?
        });
    });
});