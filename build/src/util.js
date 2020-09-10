"use strict";
/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const google_gax_1 = require("google-gax");
const gapicConfig = require("./v1/firestore_client_config.json");
const serviceConfig = google_gax_1.constructSettings('google.firestore.v1.Firestore', gapicConfig, {}, google_gax_1.Status);
/**
 * A Promise implementation that supports deferred resolution.
 * @private
 */
class Deferred {
    constructor() {
        this.resolve = () => { };
        this.reject = () => { };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.Deferred = Deferred;
/**
 * Generate a unique client-side identifier.
 *
 * Used for the creation of new documents.
 *
 * @private
 * @returns {string} A unique 20-character wide identifier.
 */
function autoId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    while (autoId.length < 20) {
        const bytes = crypto_1.randomBytes(40);
        bytes.forEach(b => {
            // Length of `chars` is 62. We only take bytes between 0 and 62*4-1
            // (both inclusive). The value is then evenly mapped to indices of `char`
            // via a modulo operation.
            const maxValue = 62 * 4 - 1;
            if (autoId.length < 20 && b <= maxValue) {
                autoId += chars.charAt(b % 62);
            }
        });
    }
    return autoId;
}
exports.autoId = autoId;
/**
 * Generate a short and semi-random client-side identifier.
 *
 * Used for the creation of request tags.
 *
 * @private
 * @returns {string} A random 5-character wide identifier.
 */
function requestTag() {
    return autoId().substr(0, 5);
}
exports.requestTag = requestTag;
/**
 * Determines whether `value` is a JavaScript object.
 *
 * @private
 */
function isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
exports.isObject = isObject;
/**
 * Verifies that 'obj' is a plain JavaScript object that can be encoded as a
 * 'Map' in Firestore.
 *
 * @private
 * @param input The argument to verify.
 * @returns 'true' if the input can be a treated as a plain object.
 */
function isPlainObject(input) {
    return (isObject(input) &&
        (Object.getPrototypeOf(input) === Object.prototype ||
            Object.getPrototypeOf(input) === null ||
            input.constructor.name === 'Object'));
}
exports.isPlainObject = isPlainObject;
/**
 * Returns whether `value` has no custom properties.
 *
 * @private
 */
function isEmpty(value) {
    return Object.keys(value).length === 0;
}
exports.isEmpty = isEmpty;
/**
 * Determines whether `value` is a JavaScript function.
 *
 * @private
 */
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
/**
 * Determines whether the provided error is considered permanent for the given
 * RPC.
 *
 * @private
 */
function isPermanentRpcError(err, methodName) {
    if (err.code !== undefined) {
        const retryCodes = getRetryCodes(methodName);
        return retryCodes.indexOf(err.code) === -1;
    }
    else {
        return false;
    }
}
exports.isPermanentRpcError = isPermanentRpcError;
/**
 * Returns the list of retryable error codes specified in the service
 * configuration.
 */
function getRetryCodes(methodName) {
    var _a, _b, _c;
    return (_c = (_b = (_a = serviceConfig[methodName]) === null || _a === void 0 ? void 0 : _a.retry) === null || _b === void 0 ? void 0 : _b.retryCodes) !== null && _c !== void 0 ? _c : [];
}
exports.getRetryCodes = getRetryCodes;
/** Returns the backoff setting from the service configuration. */
function getRetryParams(methodName) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = serviceConfig[methodName]) === null || _a === void 0 ? void 0 : _a.retry) === null || _b === void 0 ? void 0 : _b.backoffSettings) !== null && _c !== void 0 ? _c : google_gax_1.createDefaultBackoffSettings());
}
exports.getRetryParams = getRetryParams;
/**
 * Wraps the provided error in a new error that includes the provided stack.
 *
 * Used to preserve stack traces across async calls.
 * @private
 */
function wrapError(err, stack) {
    err.stack += '\nCaused by: ' + stack;
    return err;
}
exports.wrapError = wrapError;
//# sourceMappingURL=util.js.map