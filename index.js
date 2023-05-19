const os = require('os');
const fs = require('fs');

const systemCpuCores = os.cpus().length;


const validate = require('./lib/validate');

const optionDefinitions = [
    { name: 'input', alias: 'i', type: String },
    { name: 'email', alias: 'e', type: String },
    { name: 'method', alias: 'm', type: String }
]

const commandLineArgs = require('command-line-args');

let options;

try {
    options = commandLineArgs(optionDefinitions);
}
catch (error) {
    console.log(error.message) && process.exit();
}

if(options.input && options.email)
    console.log('Either email or file should be pass, not both!') && process.exit();

(async function process() {

    if (options.email)
        console.log(await validate(options.email));

    else if(options.input) {

        const data = fs.readFileSync(options.input).toString().split("\n");
        const cleanData = [];
        data.forEach(line => {
            cleanData.push(line.split(",")[0].trim());
        });

        cleanData.forEach(async email => console.log(await validate(email)));

    }


})();

//console.log(options);