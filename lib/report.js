const ejs = require('ejs');
const fs = require('fs');
const path = require('node:path');
const appRoot = require('app-root-path').toString();
const storage = require('./storage');

const tpl = fs.readFileSync(path.join(appRoot, 'templates', 'report.ejs'), 'utf8');

const cleanTextRegex = /[^a-zA-Z0-9"'.,\-_@ :]/gm;

module.exports.generate = async (data = {}, count, totalOK) => {


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