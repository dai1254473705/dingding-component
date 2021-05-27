const _ = require('lodash');
const path = require('path');

let basePath = '';

function setBasePath(bPath) {
    basePath = bPath;
}

function getBasePath() {
    return basePath;
}

function getRelativePath(dir) {
    return path.relative(basePath, dir);
}

function report(type, checkList) {
    console.log(`${type}代码检查报告:`);
    let isPassed = true;
    _.forIn(checkList, (checkItem) => {
        if (_.size(checkItem.issues) > 0) {
            isPassed = false;
            const type = checkItem.type;
            console.log(`${type || 'ERROR'}: ${checkItem.message}`);
            _.forEach(checkItem.issues, (issue) => {
                if (!_.isUndefined(issue.rowNum)) {
                    console.error(`${getRelativePath(issue.filePath)} 第${issue.rowNum}行`);
                } else {
                    console.error(`${getRelativePath(issue.filePath)}`);
                }
            });
        }
    });
    if (isPassed) {
        console.log(`SUCCESS: ${type}代码检查结束，没有发现问题`);
    } else {
        console.log(`ERROR: ${type}代码检查未通过`);
    }
    return isPassed;
}

module.exports = {
    setBasePath,
    getBasePath,
    getRelativePath,
    report,
};

