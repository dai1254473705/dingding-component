const _ = require('lodash');
const fs = require('fs');
const babylon = require('babylon');
const traverse = require('babel-traverse');
const babelType = require('babel-types');
const { Transformer } = require('rml');
const { report } = require('./utils');

// 检查项目，查到存在则报错
const checkList = {
    'swiper-item': {
        issues: [],
        message: 'swiper-item下只能存在一个子元素',
    },
    'swiper-block': {
        issues: [],
        message: '定制门户采用的是小程序新引擎，swiper-item不能写在block元素内，请将block中的a:for写到swiper-item元素上',
    },
    exception: {
        issues: [],
        message: 'axml检查脚本异常，如果本组件能在小程序IDE上正确运行，请将此异常上报定制门户小二',
    }
};

const ITERATE_IDENTIFY_NAME = '$iterate';

function validateAxml(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`${filePath} 不存在`);
        return;
    }
    const content = fs.readFileSync(filePath, { encoding: 'UTF-8' });

    const replaceRules = [{
        regex: /a:/g,
        replace: 'r:',
    }, {
        // 如果{{}}是前后没有双引号的情况，将其中的双引号变成单引号，便于下一步前后加双引号处理
        regex: /={{(.+?)}}/g,
        replace: (str) => {
            return str.replace(/"/g, '\'');
        },
    }, {
        // 为{{}}加上前后双引号
        regex: /={{(.+?)}}/g,
        replace: '="{{$1}}"',
    }];
    try {
        const newContent = replaceRules.reduce((res, rule) => {
            return res.replace(rule.regex, rule.replace);
        }, content);
        new Transformer(newContent, {}).transform((error, code) => {
            if (error) {
                recordIssue('exception');
            } else {
                const ast = babylon.parse(code, {
                    sourceType: 'module', // default: "script"
                    plugins: [
                        'jsx',
                        'objectRestSpread',
                        'classProperties',
                        'exportExtensions',
                        'asyncGenerators',
                        'functionBind',
                        'functionSent',
                    ], // default: []
                });
                // fs.writeFileSync(__dirname + '/test.js', code, { encoding: 'UTF8' });
                // fs.writeFileSync(__dirname + '/test.json', JSON.stringify(ast, '', 2), { encoding: 'UTF8' });
                traverse.default(ast, {
                    JSXElement(path) {
                        if (_.get(path, 'node.openingElement.name.name') === 'swiper-item') {
                            // swiper-item下只能有一个子元素
                            // 先检查是否显示定义了多个子元素
                            const children = path.node.children;
                            const elementCount = _.size(_.filter(children, (child) => {
                                return babelType.isJSXElement(child);
                            }));
                            if (elementCount > 1) {
                                recordIssue('swiper-item');
                            }
                            // 再检查其子元素是否有循环的写法a:for这种
                            const childExpression = _.find(children, (child) => {
                                return babelType.isJSXExpressionContainer(child);
                            });
                            if (childExpression && _.get(childExpression, 'expression.callee.name') === ITERATE_IDENTIFY_NAME) {
                                recordIssue('swiper-item');
                            }
                        }
                    },
                    // swiper-item不能在block元素内
                    // 如果有循环，且内部是swiper-item元素，则swiper-item必须要有r:item属性，不然就是在block内了
                    JSXExpressionContainer(path) {
                        if (_.get(path, 'node.expression.callee.name') === ITERATE_IDENTIFY_NAME) {
                            // 存在循环
                            const openingElement = _.get(path, 'node.expression.arguments[1].body.body[0].argument.openingElement');
                            if (_.get(openingElement, 'name.name') !== 'swiper-item') {
                                return;
                            }
                            const swiperItemAttrs = _.get(openingElement, 'attributes', []);
                            // 检查是否存在r:item属性
                            const hasRItem = _.some(swiperItemAttrs, (attr) => {
                                const attrName = _.get(attr, 'name', {});
                                const namespaceName = _.get(attrName, 'namespace.name', '');
                                const itemName = _.get(attrName, 'name.name', '');
                                return namespaceName === 'r' && itemName === 'item';
                            });
                            if (!hasRItem) {
                                // 循环是写在block里的，报错
                                recordIssue('swiper-block');
                            }
                        }
                    }
                });
            }
        });
    } catch(e) {
        recordIssue('exception');
        console.log(filePath);
        console.error(e);
    }
    function recordIssue(issueType) {
        checkList[issueType].issues.push({
            filePath,
        });
    }
}

module.exports = {
    validateAxml,
    report: report.bind(null, 'axml', checkList),
};
