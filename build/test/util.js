"use strict";
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const util_1 = require("../src/util");
mocha_1.describe('isPlainObject()', () => {
    mocha_1.it('allows Object.create()', () => {
        chai_1.expect(util_1.isPlainObject(Object.create({}))).to.be.true;
        chai_1.expect(util_1.isPlainObject(Object.create(Object.prototype))).to.be.true;
        chai_1.expect(util_1.isPlainObject(Object.create(null))).to.be.true;
    });
    mocha_1.it(' allows plain types', () => {
        chai_1.expect(util_1.isPlainObject({ foo: 'bar' })).to.be.true;
        chai_1.expect(util_1.isPlainObject({})).to.be.true;
    });
    mocha_1.it('rejects custom types', () => {
        class Foo {
        }
        chai_1.expect(util_1.isPlainObject(new Foo())).to.be.false;
        chai_1.expect(util_1.isPlainObject(Object.create(new Foo()))).to.be.false;
    });
});
//# sourceMappingURL=util.js.map