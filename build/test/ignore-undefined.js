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
const query_1 = require("./query");
const helpers_1 = require("./util/helpers");
const FOO_MAP = {
    mapValue: {
        fields: {
            bar: {
                stringValue: 'bar',
            },
        },
    },
};
mocha_1.describe('ignores undefined values', () => {
    mocha_1.it('in set()', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'foo', 'foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides, { ignoreUndefinedProperties: true }).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                foo: 'foo',
                bar: undefined,
            });
        });
    });
    mocha_1.it('in create()', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.create({
                    document: helpers_1.document('documentId', 'foo', 'foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides, { ignoreUndefinedProperties: true }).then(firestore => {
            return firestore.doc('collectionId/documentId').create({
                foo: 'foo',
                bar: undefined,
            });
        });
    });
    mocha_1.it('in update()', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', FOO_MAP),
                    mask: helpers_1.updateMask('foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides, { ignoreUndefinedProperties: true }).then(async (firestore) => {
            await firestore.doc('collectionId/documentId').update('foo', {
                bar: 'bar',
                baz: undefined,
            });
            await firestore
                .doc('collectionId/documentId')
                .update({ foo: { bar: 'bar', baz: undefined } });
        });
    });
    mocha_1.it('in query filters', () => {
        const overrides = {
            runQuery: request => {
                query_1.queryEquals(request, query_1.fieldFilters('foo', 'EQUAL', FOO_MAP));
                return helpers_1.stream();
            },
        };
        return helpers_1.createInstance(overrides, { ignoreUndefinedProperties: true }).then(firestore => {
            return firestore
                .collection('collectionId')
                .where('foo', '==', { bar: 'bar', baz: undefined })
                .get();
        });
    });
    mocha_1.it('in query cursors', () => {
        const overrides = {
            runQuery: request => {
                query_1.queryEquals(request, query_1.orderBy('foo', 'ASCENDING'), query_1.startAt(true, FOO_MAP));
                return helpers_1.stream();
            },
        };
        return helpers_1.createInstance(overrides, { ignoreUndefinedProperties: true }).then(firestore => {
            return firestore
                .collection('collectionId')
                .orderBy('foo')
                .startAt({ bar: 'bar', baz: undefined })
                .get();
        });
    });
});
mocha_1.describe('rejects undefined values', () => {
    mocha_1.describe('in top-level call', () => {
        mocha_1.it('to set()', () => {
            return helpers_1.createInstance({}, { ignoreUndefinedProperties: true }).then(firestore => {
                chai_1.expect(() => {
                    firestore
                        .doc('collectionId/documentId')
                        .set(undefined);
                }).to.throw('Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
            });
        });
        mocha_1.it('to create()', () => {
            return helpers_1.createInstance({}, { ignoreUndefinedProperties: true }).then(firestore => {
                chai_1.expect(() => {
                    firestore
                        .doc('collectionId/documentId')
                        .create(undefined);
                }).to.throw('Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
            });
        });
        mocha_1.it('to update()', () => {
            return helpers_1.createInstance({}, { ignoreUndefinedProperties: true }).then(firestore => {
                chai_1.expect(() => {
                    firestore.doc('collectionId/documentId').update('foo', undefined);
                }).to.throw('"undefined" values are only ignored in object properties.');
            });
        });
        mocha_1.it('to Query.where()', () => {
            return helpers_1.createInstance({}, { ignoreUndefinedProperties: true }).then(firestore => {
                chai_1.expect(() => {
                    firestore
                        .doc('collectionId/documentId')
                        .collection('collectionId')
                        .where('foo', '==', undefined);
                }).to.throw('"undefined" values are only ignored in object properties.');
            });
        });
        mocha_1.it('to Query.startAt()', () => {
            return helpers_1.createInstance({}, { ignoreUndefinedProperties: true }).then(firestore => {
                chai_1.expect(() => {
                    firestore
                        .doc('collectionId/documentId')
                        .collection('collectionId')
                        .orderBy('foo')
                        .startAt(undefined);
                }).to.throw('"undefined" values are only ignored in object properties.');
            });
        });
    });
    mocha_1.describe('when setting is disabled', () => {
        mocha_1.it('in set()', () => {
            return helpers_1.createInstance({}).then(firestore => {
                chai_1.expect(() => {
                    firestore.doc('collectionId/documentId').set({
                        foo: 'foo',
                        bar: undefined,
                    });
                }).to.throw('Cannot use "undefined" as a Firestore value (found in field "bar"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.');
            });
        });
        mocha_1.it('in create()', () => {
            return helpers_1.createInstance({}).then(firestore => {
                chai_1.expect(() => {
                    firestore.doc('collectionId/documentId').create({
                        foo: 'foo',
                        bar: undefined,
                    });
                }).to.throw('Cannot use "undefined" as a Firestore value (found in field "bar"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.');
            });
        });
        mocha_1.it('in update()', () => {
            return helpers_1.createInstance({}).then(firestore => {
                chai_1.expect(() => {
                    firestore.doc('collectionId/documentId').update('foo', {
                        foo: 'foo',
                        bar: undefined,
                    });
                }).to.throw('Cannot use "undefined" as a Firestore value (found in field "foo.bar"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.');
            });
        });
        mocha_1.it('in query filters', () => {
            return helpers_1.createInstance({}).then(firestore => {
                chai_1.expect(() => {
                    firestore
                        .collection('collectionId')
                        .where('foo', '==', { bar: 'bar', baz: undefined });
                }).to.throw('Cannot use "undefined" as a Firestore value (found in field "baz"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.');
            });
        });
        mocha_1.it('in query cursors', () => {
            return helpers_1.createInstance({}).then(firestore => {
                chai_1.expect(() => {
                    firestore
                        .collection('collectionId')
                        .orderBy('foo')
                        .startAt({ bar: 'bar', baz: undefined });
                }).to.throw('Cannot use "undefined" as a Firestore value (found in field "baz"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.');
            });
        });
    });
});
//# sourceMappingURL=ignore-undefined.js.map