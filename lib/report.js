const ejs = require('ejs');
const fs = require('fs');
const path = require('node:path');
const appRoot = require('app-root-path').toString();
const storage = require('./storage');
const csv = require('csv-stringify');

const tpl = fs.readFileSync(path.join(appRoot, 'templates', 'report.ejs'), 'utf8');

const cleanTextRegex = /[^a-zA-Z0-9"'.,\-_@ :]/gm;

module.exports.generateCSV = async (data) => new Promise((resolve, reject) => {


    csv.stringify(data.map(el => ({
        email: el.email,
        validFormat: el.validFormat ? 'YES' : 'NO',
        isDisposable: el.isDisposable ? 'YES' : 'NO',
        mxFound: el.mxFound ? 'YES' : 'NO',
        smtpCheck: el.smtpCheck && !el.smtpCheck.error ? el.smtpCheck ? 'PASS' : 'FAIL' : '',
        aiConfidence: el.ai ? el.ai.confidence : '',
        aiUsernameOpinion: el.ai ? el.ai.username : '',
        aiDomainOpinion: el.ai ? el.ai.domain_name : '',
        aiConclusion: el.ai ? el.ai.conclusion : '',
        valid: el.isValid ? 'YES' : 'NO'
    })),  { header: true, columns: ['email', 'validFormat', 'isDisposable', 'mxFound', 'smtpCheck', 'aiConfidence', 'aiUsernameOpinion', 'aiDomainOpinion', 'aiConclusion', 'valid'] }, async (err, text) => {

        if(err)
            return reject(err);

        resolve(await storage.writeRaw('report-' + '.csv', text));

    });


});

module.exports.generateHTML = async (data = {}, count, totalOK) => {


    try {
        const filepath =  await storage.writeRaw('report-' + '.html', ejs.render(tpl, {
            data: data.map(el => {
                if(!el.ai)
                    return el;

                return {
                ...el,
                ai: {
                    confidence: el.ai.confidence,
                    username: btoa(el.ai.username.replace(cleanTextRegex, '')),
                    domain_name: btoa(el.ai.domain_name.replace(cleanTextRegex, '')),
                    conclusion: btoa(el.ai.conclusion.replace(cleanTextRegex, ''))

                }}}),
            generationDatetime: new Date().toISOString(),
            count,
            totalOK,
            totalKO: count - totalOK
        }, { cache: false }));

        return Promise.resolve(filepath);

    }
     catch (error) {
        console.log("Report generation failed!", error);
        return Promise.reject();
     }
}