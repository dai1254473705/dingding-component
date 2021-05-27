const fs = require('fs');
const nodePath = require('path');
const babylon = require('babylon');
const traverse = require('babel-traverse');
const _ = require('lodash');
const shelljs = require('shelljs');
const babelType = require('babel-types');
const { report } = require('./utils');

// 检查项目，查到存在则报错
const checkList = {
    dd: {
        issues: [],
        message: '定制门户自定义组件中不能使用dd开头的jsapi',
    },
    setInterval: {
        issues: [],
        message: '定制门户自定义组件中不能使用setInterval定时，如果想做数据刷新，请参照开发者文档中的"刷新组件数据"章节。如果要实现轮播组件，请用基础组件swiper实现',
    },
    setTimeout: {
        issues: [],
        message: '请确认setTimeout是否必须，警惕存在嵌套的setTimeout',
        type: 'WARNING',
    },
    // getApp: {
    //     issues: [],
    //     message: '不能使用getApp',
    // },
    debugger: {
        issues: [],
        message: '代码中不能存在debugger',
    },
    didUnmountListenCb: {
        issues: [],
        message: 'listenCustomEvent中存在匿名函数，这种写法会导致该函数在组件didUnmount时不能被removeCustomEvent清理，请修改写法',
    },
    didUnmountLackRemove: {
        issues: [],
        message: '检查到存在listenCustomEvent，请在didUnmount里调用removeCustomEvent进行清理',
    },
    listenRemoveBindCb: {
        issues: [],
        message: 'listenCustomEvent，或removeCustomEvent的第二个参数不能是bind的方法对象，bind的方法会导致 didUnmount时removeCustomEvent无效',
    },
    changePrototype: {
        issues: [],
        message: '不允许修改原生对象的prototype，也不建议使用prototype的写法来定义class，可以使用es6的class语法',
    }
};

// 记录已访问过的文件路径，防止循环依赖
const visitedPaths = [];

function validateJs(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`${filePath} 不存在`);
        return;
    }
    if (visitedPaths.indexOf(filePath) !== -1) {
        // 已访问过该文件，跳过
        return;
    }

    visitedPaths.push(filePath);
    const code = fs.readFileSync(filePath, {
        encoding: 'UTF-8',
    });

    let ast = null;
    try {
        ast = babylon.parse(code, {
            sourceType: 'module',
            plugins: [
                'objectRestSpread',
                'classProperties',
                'exportExtensions',
                'asyncGenerators',
                'functionBind',
                'functionSent',
            ],
        });
    } catch (e) {
        console.log(filePath);
        console.error(e);
    }

    if (!ast) return;

    // 依赖的相对地址的js文件
    const dependFilePaths = [];
    let hasListenEvent = false;
    let hasRemoveEvent = false;
    try {
        traverse.default(ast, {
            MemberExpression(path) {
                // 检查dd
                if (_.get(path, 'node.object.name', '') === 'dd') {
                    recordIssue('dd', path.node.loc.start.line);
                }
                // 检查是否修改了prototype
                if (_.get(path, 'node.property.name', '') === 'prototype') {
                    recordIssue('changePrototype', _.get(path, 'node.property.loc.start.line'));
                }
            },
            CallExpression(path) {
                const calleeName = _.get(path, 'node.callee.property.name', '')
                  || _.get(path, 'node.callee.name', '');
                if (calleeName === 'setInterval') {
                    recordIssue('setInterval', path.node.callee.start.line);
                }
                if (calleeName === 'setTimeout') {
                    recordIssue('setTimeout', path.node.callee.loc.start.line);
                }
                if (calleeName === 'listenCustomEvent' || calleeName === 'removeCustomEvent') {
                    if (calleeName === 'listenCustomEvent') {
                        // 标记存在listenCustomEvent，检查是否存在相应的remove
                        hasListenEvent = true;
                    } else {
                        // 标记存在removeCustomEvent
                        hasRemoveEvent = true;
                    }
                    // 检查回调是不是函数，是函数，则在didUnmount时不能被remove掉
                    const listenCb = _.get(path, 'node.arguments[1]');
                    if (
                      babelType.isArrowFunctionExpression(listenCb) ||
                      babelType.isFunctionExpression(listenCb)
                    ) {
                        recordIssue('didUnmountListenCb', path.node.callee.loc.start.line);
                    } else if (babelType.isCallExpression(listenCb)) {
                        // 检测是不是有bind(this)
                        const hasBind = _.get(listenCb, 'callee.property.name') === 'bind';
                        if (hasBind) {
                            recordIssue('listenRemoveBindCb', path.node.callee.loc.start.line);
                        }
                    }
                }
                // if (_.get(path, 'node.callee.name', '') === 'getApp') {
                //     recordIssue('getApp', path.node.callee.loc.start.line);
                // }
            },
            DebuggerStatement(path) {
                recordIssue('debugger', path.node.loc.start.line);
            },
            ImportDeclaration(path) {
                if (babelType.isStringLiteral(path.node.source)) {
                    let dependFilePath = path.node.source.value;
                    if (/^\./.test(dependFilePath)) {
                        // 如果是相对路径
                        dependFilePath = nodePath.resolve(filePath, `../${dependFilePath}`);
                        if (shelljs.test('-f', `${dependFilePath}.js`)) {
                            // 如果追加了后缀后，是已存在的文件，则追加后缀
                            dependFilePath = `${dependFilePath}.js`;
                        }
                        if (shelljs.test('-d', dependFilePath)) {
                            // 如果是文件夹，追加index.js
                            dependFilePath = `${dependFilePath}/index.js`;
                        }
                        dependFilePaths.push(dependFilePath);
                    }
                }
            },
            Program: {
                exit() {
                    if (hasListenEvent && !hasRemoveEvent) {
                        // 在js文件中listenCustomEvent，却没有removeCustomEvent，则报错
                        recordIssue('didUnmountLackRemove');
                    }
                }
            },
        });
    } catch (e) {
        console.error(e);
    }
    // 遍历依赖的文件
    _.forEach(dependFilePaths, (dependPath) => {
        validateJs(dependPath);
    });
    // console.log(JSON.stringify(ast, 2));
    // console.log(JSON.stringify(checkList, 2));

    function recordIssue(issueType, rowNum) {
        checkList[issueType].issues.push({
            filePath, rowNum,
        });
    }
}

module.exports = {
    validateJs,
    report: report.bind(null, 'js', checkList),
};
