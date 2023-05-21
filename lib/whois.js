const whois = require('whois');

const regexT0 = /Creation Date:\s((\d{4}-[01]\d-[0-3]\d)T[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?)/gm;
const regexT1 = /Created:\s+((\d{4}-[01]\d-[0-3]\d)\s[0-2]\d:[0-5]\d:[0-5]\d)/gm;
const regexT2 = /Registered\son:(\s)([0-3]\d-\w{3}-\d{4})/gm;


module.exports.getCreationDays = domain => new Promise((resolve, reject) => {

    whois.lookup(domain, function(err, data) {

        if(err)
            resolve(null);

        if(!data || typeof data !== 'string')
            resolve(null);

        //console.log(data);

        try {

            const regex = regexT0.test(data) ? regexT0 : regexT1.test(data) ? regexT1 :regexT2;

            const rawDate = Array.from(data.matchAll(regex), m => m[2])[0];

            if(!rawDate)
                return null;

            const creationDate = new Date(rawDate);
            resolve( Math.round(((new Date()) - creationDate) / 86400000));
        } catch (e) {
            resolve(null);
        }

    })


});