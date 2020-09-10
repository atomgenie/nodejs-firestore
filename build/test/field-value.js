"use strict";
// Copyright 2018 Google LLC
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
const src_1 = require("../src");
const helpers_1 = require("./util/helpers");
function genericFieldValueTests(methodName, sentinel) {
    mocha_1.it("can't be used inside arrays", () => {
        return helpers_1.createInstance().then(firestore => {
            const docRef = firestore.doc('coll/doc');
            const expectedErr = new RegExp(`${methodName}\\(\\) cannot be used inside of an array`);
            chai_1.expect(() => docRef.set({ a: [sentinel] })).to.throw(expectedErr);
            chai_1.expect(() => docRef.set({ a: { b: [sentinel] } })).to.throw(expectedErr);
            chai_1.expect(() => docRef.set({
                a: [{ b: sentinel }],
            })).to.throw(expectedErr);
            chai_1.expect(() => docRef.set({ a: { b: { c: [sentinel] } } })).to.throw(expectedErr);
        });
    });
    mocha_1.it("can't be used inside arrayUnion()", () => {
        return helpers_1.createInstance().then(firestore => {
            const docRef = firestore.doc('collectionId/documentId');
            chai_1.expect(() => docRef.set({ foo: src_1.FieldValue.arrayUnion(sentinel) })).to.throw(`Element at index 0 is not a valid array element. ${methodName}() cannot be used inside of an array.`);
        });
    });
    mocha_1.it("can't be used inside arrayRemove()", () => {
        return helpers_1.createInstance().then(firestore => {
            const docRef = firestore.doc('collectionId/documentId');
            chai_1.expect(() => docRef.set({ foo: src_1.FieldValue.arrayRemove(sentinel) })).to.throw(`Element at index 0 is not a valid array element. ${methodName}() cannot be used inside of an array.`);
        });
    });
    mocha_1.it("can't be used with queries", () => {
        return helpers_1.createInstance().then(firestore => {
            const collRef = firestore.collection('coll');
            chai_1.expect(() => collRef.where('a', '==', sentinel)).to.throw(`Value for argument "value" is not a valid query constraint. ${methodName}() can only be used in set(), create() or update().`);
            chai_1.expect(() => collRef.orderBy('a').startAt(sentinel)).to.throw(`Element at index 0 is not a valid query constraint. ${methodName}() can only be used in set(), create() or update().`);
        });
    });
}
mocha_1.describe('FieldValue.arrayUnion()', () => {
    mocha_1.it('requires one argument', () => {
        chai_1.expect(() => src_1.FieldValue.arrayUnion()).to.throw('Function "FieldValue.arrayUnion()" requires at least 1 argument.');
    });
    mocha_1.it('supports isEqual()', () => {
        const arrayUnionFoo1 = src_1.FieldValue.arrayUnion('foo');
        const arrayUnionFoo2 = src_1.FieldValue.arrayUnion('foo');
        const arrayUnionBar = src_1.FieldValue.arrayUnion('bar');
        chai_1.expect(arrayUnionFoo1.isEqual(arrayUnionFoo2)).to.be.true;
        chai_1.expect(arrayUnionFoo1.isEqual(arrayUnionBar)).to.be.false;
    });
    mocha_1.it('can be used with set()', () => {
        const overrides = {
            commit: request => {
                const expectedRequest = helpers_1.set({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    transforms: [
                        helpers_1.arrayTransform('field', 'appendMissingElements', 'foo', 'bar'),
                        helpers_1.arrayTransform('map.field', 'appendMissingElements', 'foo', 'bar'),
                    ],
                });
                helpers_1.requestEquals(request, expectedRequest);
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                foo: 'bar',
                field: src_1.FieldValue.arrayUnion('foo', 'bar'),
                map: { field: src_1.FieldValue.arrayUnion('foo', 'bar') },
            });
        });
    });
    mocha_1.it('must not contain directly nested arrays', () => {
        return helpers_1.createInstance().then(firestore => {
            const docRef = firestore.doc('collectionId/documentId');
            chai_1.expect(() => docRef.set({ foo: src_1.FieldValue.arrayUnion([]) })).to.throw('Element at index 0 is not a valid array element. Nested arrays are ' +
                'not supported.');
        });
    });
    genericFieldValueTests('FieldValue.arrayUnion', src_1.FieldValue.arrayUnion('foo'));
});
mocha_1.describe('FieldValue.increment()', () => {
    mocha_1.it('requires one argument', () => {
        chai_1.expect(() => src_1.FieldValue.increment()).to.throw('Function "FieldValue.increment()" requires at least 1 argument.');
    });
    mocha_1.it('validates that operand is number', () => {
        return helpers_1.createInstance().then(firestore => {
            chai_1.expect(() => {
                return firestore.doc('collectionId/documentId').set({
                    foo: src_1.FieldValue.increment('foo'),
                });
            }).to.throw('Value for argument "FieldValue.increment()" is not a valid number');
        });
    });
    mocha_1.it('supports isEqual()', () => {
        const arrayUnionA = src_1.FieldValue.increment(13.37);
        const arrayUnionB = src_1.FieldValue.increment(13.37);
        const arrayUnionC = src_1.FieldValue.increment(42);
        chai_1.expect(arrayUnionA.isEqual(arrayUnionB)).to.be.true;
        chai_1.expect(arrayUnionC.isEqual(arrayUnionB)).to.be.false;
    });
    mocha_1.it('can be used with set()', () => {
        const overrides = {
            commit: request => {
                const expectedRequest = helpers_1.set({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    transforms: [
                        helpers_1.incrementTransform('field', 42),
                        helpers_1.incrementTransform('map.field', 13.37),
                    ],
                });
                helpers_1.requestEquals(request, expectedRequest);
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                foo: 'bar',
                field: src_1.FieldValue.increment(42),
                map: { field: src_1.FieldValue.increment(13.37) },
            });
        });
    });
    genericFieldValueTests('FieldValue.increment', src_1.FieldValue.increment(42));
});
mocha_1.describe('FieldValue.arrayRemove()', () => {
    mocha_1.it('requires one argument', () => {
        chai_1.expect(() => src_1.FieldValue.arrayRemove()).to.throw('Function "FieldValue.arrayRemove()" requires at least 1 argument.');
    });
    mocha_1.it('supports isEqual()', () => {
        const arrayRemoveFoo1 = src_1.FieldValue.arrayUnion('foo');
        const arrayRemoveFoo2 = src_1.FieldValue.arrayUnion('foo');
        const arrayRemoveBar = src_1.FieldValue.arrayUnion('bar');
        chai_1.expect(arrayRemoveFoo1.isEqual(arrayRemoveFoo2)).to.be.true;
        chai_1.expect(arrayRemoveFoo1.isEqual(arrayRemoveBar)).to.be.false;
    });
    mocha_1.it('can be used with set()', () => {
        const overrides = {
            commit: request => {
                const expectedRequest = helpers_1.set({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    transforms: [
                        helpers_1.arrayTransform('field', 'removeAllFromArray', 'foo', 'bar'),
                        helpers_1.arrayTransform('map.field', 'removeAllFromArray', 'foo', 'bar'),
                    ],
                });
                helpers_1.requestEquals(request, expectedRequest);
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                foo: 'bar',
                field: src_1.FieldValue.arrayRemove('foo', 'bar'),
                map: { field: src_1.FieldValue.arrayRemove('foo', 'bar') },
            });
        });
    });
    mocha_1.it('must not contain directly nested arrays', () => {
        return helpers_1.createInstance().then(firestore => {
            const docRef = firestore.doc('collectionId/documentId');
            chai_1.expect(() => docRef.set({ foo: src_1.FieldValue.arrayRemove([]) })).to.throw('Element at index 0 is not a valid array element. Nested arrays are ' +
                'not supported.');
        });
    });
    genericFieldValueTests('FieldValue.arrayRemove', src_1.FieldValue.arrayRemove('foo'));
});
mocha_1.describe('FieldValue.serverTimestamp()', () => {
    mocha_1.it('supports isEqual()', () => {
        const firstTimestamp = src_1.FieldValue.serverTimestamp();
        const secondTimestamp = src_1.FieldValue.serverTimestamp();
        chai_1.expect(firstTimestamp.isEqual(secondTimestamp)).to.be.true;
    });
    mocha_1.it('can be used with set()', () => {
        const overrides = {
            commit: request => {
                const expectedRequest = helpers_1.set({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    transforms: [helpers_1.serverTimestamp('field'), helpers_1.serverTimestamp('map.field')],
                });
                helpers_1.requestEquals(request, expectedRequest);
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                foo: 'bar',
                field: src_1.FieldValue.serverTimestamp(),
                map: { field: src_1.FieldValue.serverTimestamp() },
            });
        });
    });
    genericFieldValueTests('FieldValue.serverTimestamp', src_1.FieldValue.serverTimestamp());
});
//# sourceMappingURL=field-value.js.map