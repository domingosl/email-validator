require('dotenv').config();

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    organization: process.env.OPENAU_ORGANIZATION_ID,
    apiKey: process.env.OPENAI_SECRET_KEY,
});

const openai = new OpenAIApi(configuration);

const wait = time => new Promise(resolve => setTimeout(resolve, time));
let delta = 0;

module.exports.check = async (email) => {

    try {

        const messages = [
            {
                role: "system", content: "Your purpose is to give an opinion about how likely is " +
                    "for an email address to be fake by proving insights about the username and domain name." +
                    "Your answer should be given as JSON, with a key named 'username' in which  you comment on " +
                    "username part of the email, another key named 'domain_name' in which  you comment on " +
                    "the domain name part of the email, another key name 'conclusion' with your final conclusions," +
                    "and finally a key name 'confidence' in which you score from 0 to 100 how likely is the for the email to be valid," +
                    " zero meaning likely fake, 100 meaning likely real."
            }
        ];

        messages.push({ role: "user", content: email });

        await wait(delta);
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages
        });

        delta += 5;

        if(delta > 100)
            delta = 0;

        const rawData = completion.data.choices[0].message.content.replaceAll("\n", "");

        const data = JSON.parse(rawData);

        return Promise.resolve(data);
    }
    catch (error) {
        return Promise.reject();
    }

}