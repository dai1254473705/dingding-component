"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// weixin miniprogram
// @ts-ignore
var isWx = (typeof wx === 'object') && (typeof wx.getSystemInfoSync === 'function');
exports.isWx = isWx;
// ant miniprogram
// @ts-ignore
var isMy = (typeof my === 'object') && (typeof my.getSystemInfoSync === 'function');
exports.isMy = isMy;
