const dns = require('dns').promises;
const emailFormat = require('./email-format');
const smtp = require('./smtp');
const domains = new Set(require('disposable-email-domains'));

module.exports = async function validate(email, mode = 'full') {

    const isFormatValid = emailFormat(email);

    if(!isFormatValid)
        return { email, isValid: false, reason: 'Invalid email format' };

    const domain = email.split('@')[1];


    if(domains.has(domain))
        return { email, isValid: false, reason: 'Disposable domain' };

    let bestMXRecord;
    try {
        const res = await dns.resolveMx(domain);
        bestMXRecord = res.reduce(function(prev, current) {
            return (prev.y > current.y) ? prev : current
        });
    }
    catch (error) {
        return { email, isValid: false, reason: 'Bad/Missing MX record' };
    }


    try {
        await smtp.validate(email, email, bestMXRecord.exchange);
    }
    catch (error) {
        return { email, isValid: false, reason: 'SMTP server error or sender not found' };
    }
}