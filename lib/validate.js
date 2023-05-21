const dns = require('dns').promises;
const emailFormat = require('./email-format');
const smtp = require('./smtp');
const whois = require('./whois');
const ai = require('./ai');
const disposableDomains = new Set(require('disposable-email-domains'));
const storage = require('./storage');

const mxFounds = storage.read('mx-founds.json') || {};
const smtpFails = new Set(storage.read('smtp-fails.json') || []);
const aiResults = storage.read('ai-results.json') || {};
const domainsAge = {};

const results = [];
let count = 0;
let totalOk = 0;
let aiCacheHits = 0;

module.exports.getSessionCache = () => {
    return { mxFounds, smtpFails: Array.from(smtpFails), count, totalOk, aiResults, aiCacheHits, results };
}

module.exports.process = async function validate(email, useAI = false) {

    count++;

    const result = {
        email,
        validFormat: null,
        isDisposable: null,
        mxFound: null,
        smtpCheck: { status: null, error: null },
        domainAge: null,
        ai: null,
        isValid: null
    };

    const isFormatValid = emailFormat(email);

    if(!isFormatValid) {
        result.validFormat = false;
        results.push(result);
        return result;
    }

    result.validFormat = true;

    const domain = email.split('@')[1];

    if(disposableDomains.has(domain)) {
        result.isDisposable = true;
        results.push(result);
        return result;
    }

    result.isDisposable = false;


    let bestMXRecord;
    try {
        if (!mxFounds[domain]) {


            const res = await dns.resolveMx(domain);

            bestMXRecord = res.reduce(function (prev, current) {
                return (prev.y > current.y) ? prev : current
            });

            mxFounds[domain] = bestMXRecord;
        } else {
            bestMXRecord = mxFounds[domain];
        }
    }
    catch (error) {
        result.mxFound = false;
        result.isValid = false;
        results.push(result);
        return result;
    }

    //DEACTIVATED, too SLOW, needs refactory
    /*if(!domainsAge[domain])
        domainsAge[domain] = await whois.getCreationDays(domain);

    result.domainAge = domainsAge[domain];*/

    result.mxFound = true;

    if(!smtpFails.has(domain)) {

        try {
            await smtp.validate('info@email.com', email, bestMXRecord.exchange);
            result.smtpCheck = {error: false, status: true};
        } catch (error) {

            if (error.code === 101)
                result.smtpCheck = {status: null, error: 'Block by antispam checks (Spamhaus)'};
            else if (error.code === 102)
                result.smtpCheck = {status: false, error: null};

            result.smtpCheck = {status: null, error};

            smtpFails.add(domain);

        }

    }

    if(useAI) {

        if(!aiResults[email]) {

            try {
                result.ai = await ai.check(email);
            } catch (error) {
                //Do nothing
            }

        }
        else {
            result.ai = aiResults[email];
            aiCacheHits++;
        }

        result.isValid = result.ai ? result.ai.confidence >= 50 : true;
        aiResults[email] = result.ai;

    } else
        result.isValid = true;

    result.isValid && totalOk++;
    results.push(result);

    return { email, result };

}