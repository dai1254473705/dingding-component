/**
 * 验证组件
 */
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const _ = require('lodash');
const validateConfig = require('./validateConfig');
const { validateJs, report: reportJsResult } = require('./validateJs');
const { validateAxml, report: reportAxmlResult } = require('./validateAxml');
const { validateAcss, report: reportAcssResult } = require('./validateAcss');
const { getRelativePath, setBasePath, getBasePath } = require('./utils');

module.exports = validate;
/**
 * 校验组件文件夹完整性，以及 config.json 是否正确
 */
function validateJsonAndFiles() {
    let isPass = true;

    const publicComponents = getPublicComponents();
    if(!publicComponents) {
        isPass = false;
    } else {
        const componentDirs = shelljs.ls(getBasePath());

        // 在文件夹中是否存在至少一个config.json文件
        let hasConfigJsonInDirs = false;
        console.log('组件文件完整性，config.json和plugin.json校验报告:');
        _.forEach(componentDirs, (dir) => {
            const baseDir = path.resolve(getBasePath(), dir);
            if (!shelljs.test('-d', baseDir)) {
                return;
            }
            // 文件夹下有config.json，才认为是定制门户组件
            const hasConfigJson = fs.existsSync(`${baseDir}/config.json`);
            if (hasConfigJson) {
                hasConfigJsonInDirs = true;
                // 检验组件内文件是否齐全，名称是否正确
                const isFilesValid = validateDir(baseDir);
                if (!isFilesValid) {
                    isPass = false;
                    return;
                }
                // 校验config.json
                if (!validateConfigJson(baseDir, publicComponents)) {
                    isPass = false;
                }
                // 校验js，同时会递归校验其依赖的js文件
                validateJs(`${baseDir}/index.js`);
            }
        });

        if (!hasConfigJsonInDirs) {
            console.error('FAIL：请为门户组件配置config.json');
            process.exit(0);
        }
    }

    if (isPass) {
        console.log('SUCCESS：组件文件完整性，config.json和plugin.json校验通过');
    } else {
        console.error('FAIL：组件文件完整性，config.json和plugin.json校验不通过');
    }
    return isPass;
}

function validate(basePath) {
    setBasePath(basePath);
    // 报告的分割线
    const SEPERATE_LINE = '----------------';

    let errCount = 0;

    // 增加版本号，以便判断是哪个版本的检查器在运作
    console.log('检查器V1.2 开始检查组件');

    console.log(SEPERATE_LINE);

    if (!validateJsonAndFiles()) {
        errCount += 1;
    }

    console.log(SEPERATE_LINE);

    if (!reportJsResult()) {
        errCount += 1;
    }

    console.log(SEPERATE_LINE);

    // 检查axml
    const axmlFiles = shelljs.find(getBasePath()).filter((file) => /.axml$/.test(file));
    axmlFiles.forEach((filePath) => validateAxml(filePath));
    if (!reportAxmlResult()) {
        errCount += 1;
    }

    console.log(SEPERATE_LINE);

    // 检查acss
    const acssFiles = shelljs.find(getBasePath()).filter((file) => /.acss$/.test(file));
    acssFiles.forEach((filePath) => validateAcss(filePath));
    if (!reportAcssResult()) {
        errCount += 1;
    }

    return errCount === 0;
}

function validateConfigJson(baseDir, publicComponents) {
    const configPath = `${baseDir}/config.json`;
    const configFile = fs.readFileSync(configPath, { encoding: 'UTF-8' });
    // 验证pluginComponentName是否在publicComponents中定义
    const configJson = getConfigJson(configFile);
    if (!configJson) {
        console.error(`${getRelativePath(baseDir)}/config.json解析出错`);
        return false;
    }
    const pluginComponentName = _.get(configJson, 'pluginComponentName', '');
    if (!publicComponents[pluginComponentName]) {
        console.error(`${getRelativePath(baseDir)}/config.json解析出错，"${pluginComponentName}"在 plugin.json 的 publicComponents 中不存在`);
        return false;
    }
    // 验证config.json内容是否正确
    const validateReport = validateConfig(configFile);
    if(validateReport.pass) {
        console.log(`${getRelativePath(baseDir)}/config.json校验通过`);
    } else {
        console.error(`${getRelativePath(baseDir)}/config.json 校验未通过`);
        consoleConfigReport(validateReport);
    }
    return validateReport.pass;
}

function getConfigJson(configFile) {
    try {
        return JSON.parse(configFile);
    } catch(e) {
        return null;
    }
}

// 检查组件内文件是否齐全
function validateDir(path) {
    const files = shelljs.ls(path);
    return _.every(['index.js', 'index.json', 'index.acss', 'index.axml'], (file) => {
        const isExisted = files.indexOf(file) !== -1;
        if (!isExisted) {
            console.error(`${getRelativePath(path)}文件夹 缺少文件 ${file}`);
        }
        return isExisted;
    });
}

/**
 * 打印console.json的校验报告
 * @param report
 */
function consoleConfigReport(report) {
    _.forEach(report.data, (errors, scopeName) => {
        if (errors.length) {
            console.log(scopeName);
            _.forEach(errors, err => {
                console.error(err.info);
            });
        }
    });
}

function getPublicComponents() {
    const pluginJsonPath = path.resolve(getBasePath(), '../plugin.json');;
    try {
        const pluginJson = fs.readFileSync(pluginJsonPath, { encoding: 'UTF-8' });
        const pluginObj = JSON.parse(pluginJson);
        return _.get(pluginObj, 'publicComponents', {});
    } catch (e) {
        console.error('plugin.json 文件解析错误');
        return null;
    }
}
