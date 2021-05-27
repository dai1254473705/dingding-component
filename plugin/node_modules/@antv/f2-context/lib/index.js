"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var wx_1 = require("./context/wx");
exports.wx = wx_1.default;
var my_1 = require("./context/my");
exports.my = my_1.default;
var util_1 = require("./util");
var auto = function (ctx) {
    if (util_1.isWx) {
        return wx_1.default(ctx);
    }
    if (util_1.isMy) {
        return my_1.default(ctx);
    }
    return ctx;
};
exports.auto = auto;
