const css = require('css');
const fs = require('fs');
const _ = require('lodash');
const { report } = require('./utils');

// 检查项目，查到存在则报错
const checkList = {
    positionFixed: {
        issues: [],
        message: '不能存在position:fixed',
    },
    exception: {
        issues: [],
        message: 'acss检查脚本异常，如果本组件能在小程序IDE上正确运行，请将此异常上报定制门户小二',
    }
};

function validateAcss(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`${filePath} 不存在`);
        return;
    }
    const code = fs.readFileSync(filePath, {
        encoding: 'UTF-8',
    });

    let ast;
    try {
        ast = css.parse(code, {});
    } catch (e) {
        recordIssue('exception');
        return;
    }
    if (ast) {
        const rules = _.get(ast, 'stylesheet.rules', []);
        _.forEach(rules, (rule) => {
            const props = _.get(rule, 'declarations');
            _.forEach(props, (prop) => {
                const value = prop.value;
                const line = prop.position.start.line;
                if (prop.property === 'position' && value === 'fixed') {
                    recordIssue('positionFixed', line);
                }
            });
        });
    }

    function recordIssue(issueType, rowNum) {
        checkList[issueType].issues.push({
            filePath, rowNum,
        });
    }
}

module.exports = {
    validateAcss,
    report: report.bind(null, 'acss', checkList),
};
