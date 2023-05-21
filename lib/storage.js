const fs = require('node:fs');
const path = require('node:path');
const appRoot = require('app-root-path').toString();

const storePath = path.join(appRoot, 'data');

if (!fs.existsSync(storePath))
    fs.mkdirSync(storePath);

module.exports.write = (fileName, data) => {
    fs.writeFileSync(path.join(storePath, fileName), JSON.stringify(data,null, 2));
}

module.exports.writeRaw = (fileName, data) => {
    const filePath = path.join(storePath, fileName);
    fs.writeFileSync(filePath, data);
    return filePath;
}

module.exports.read = (fileName) => {
    const filePath = path.join(storePath, fileName);
    const data = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;

    return data ? JSON.parse(data) : data;
}