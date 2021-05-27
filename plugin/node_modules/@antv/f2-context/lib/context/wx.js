"use strict";
// 微信程序的context适配
Object.defineProperty(exports, "__esModule", { value: true });
var CAPITALIZED_ATTRS_MAP = {
    fontSize: 'FontSize',
    opacity: 'GlobalAlpha',
    lineDash: 'LineDash',
    textAlign: 'TextAlign',
};
/**
 * wxapp textAlign align 可选值为 left|center|right
 * 标准canvas textAlign align 可选值为 left|center|right|start|end
 */
var TEXT_ALIGN_MAP = {
    start: 'left',
    end: 'right',
};
exports.default = (function (ctx) {
    Object.keys(CAPITALIZED_ATTRS_MAP).map(function (style) {
        Object.defineProperty(ctx, style, {
            set: function (value) {
                if (style === 'textAlign') {
                    value = TEXT_ALIGN_MAP[value] ? TEXT_ALIGN_MAP[value] : value;
                }
                var name = 'set' + CAPITALIZED_ATTRS_MAP[style];
                ctx[name](value);
            }
        });
        return style;
    });
});
