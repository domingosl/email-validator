require('dotenv').config();
const killProcess = require('./lib/kill-process');
const storage = require('./lib/storage');
const report = require('./lib/report');

if(!process.env.OPENAI_ORGANIZATION_ID || !process.env.OPENAI_SECRET_KEY)
    killProcess("OPENAI_ORGANIZATION_ID and OPENAI_SECRET_KEY env variables should be set in .env");

const fs = require('fs');

const validate = require('./lib/validate');

const optionDefinitions = [
    { name: 'input', alias: 'i', type: String },
    { name: 'email', alias: 'e', type: String },
    { name: 'method', alias: 'm', type: String },
    { name: 'useAI', alias: 'a', type: Boolean }
]

const commandLineArgs = require('command-line-args');

let options;

try {
    options = commandLineArgs(optionDefinitions);
}
catch (error) {
    killProcess(error.message);
}

if(options.input && options.email)
    killProcess('Either email or file should be pass, not both!');

(async function process() {

    const startDatetime = new Date().getTime();
    let promises, statusTimer;

    if (options.email)
        promises = [await validate.process(options.email, options.useAI)];

    else if(options.input) {

        console.log("Loading file into memory and cleaning it up!");

        const data = fs.readFileSync(options.input).toString().split("\n");

        statusTimer = setInterval(()=>console.log("Batch validation process running..."), 1000);

        promises = data.map(async (line, index) => {
            //Ignoring duplicates
            if(data.indexOf(line) !== index)
                return;

            await validate.process(line.split(",")[0].trim(), options.useAI);
        });

    }

    Promise.all(promises).then(async ()=>{

        const { mxFounds, smtpFails, count, totalOk, aiResults, aiCacheHits, results } = validate.getSessionCache();
        const processTime = (new Date().getTime() - startDatetime);
        clearInterval(statusTimer);

        console.log("DONE. Emails checked:", count, "Time[ms]:", processTime, "Total valid:", totalOk);

        if(options.useAI)
            console.log("AI Cache hits:", aiCacheHits);

        if(options.email)
            console.log(results[0]);

        storage.write('mx-founds.json', mxFounds);
        storage.write('smtp-fails.json', smtpFails);
        storage.write('ai-results.json', aiResults);

        console.log("Generating report...");

        const file = await report.generate(results, count, totalOk);

        console.log("Report available at: ", file);
    });


})();

//console.log(options);