"use strict";
// Copyright 2017 Google LLC
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
const google_gax_1 = require("google-gax");
const through2 = require("through2");
const src_1 = require("../src");
const helpers_1 = require("./util/helpers");
const PROJECT_ID = 'test-project';
const INVALID_ARGUMENTS_TO_UPDATE = new RegExp('Update\\(\\) requires either ' +
    'a single JavaScript object or an alternating list of field/value pairs ' +
    'that can be followed by an optional precondition.');
// Change the argument to 'console.log' to enable debug output.
src_1.setLogFunction(() => { });
mocha_1.describe('DocumentReference interface', () => {
    let firestore;
    let documentRef;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
            documentRef = firestore.doc('collectionId/documentId');
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('has collection() method', () => {
        chai_1.expect(() => documentRef.collection(42)).to.throw('Value for argument "collectionPath" is not a valid resource path. Path must be a non-empty string.');
        let collection = documentRef.collection('col');
        chai_1.expect(collection.id).to.equal('col');
        chai_1.expect(() => documentRef.collection('col/doc')).to.throw('Value for argument "collectionPath" must point to a collection, but was "col/doc". Your path does not contain an odd number of components.');
        collection = documentRef.collection('col/doc/col');
        chai_1.expect(collection.id).to.equal('col');
    });
    mocha_1.it('has path property', () => {
        chai_1.expect(documentRef.path).to.equal('collectionId/documentId');
    });
    mocha_1.it('has parent property', () => {
        chai_1.expect(documentRef.parent.path).to.equal('collectionId');
    });
    mocha_1.it('has isEqual() method', () => {
        const doc1 = firestore.doc('coll/doc1');
        const doc1Equals = firestore.doc('coll/doc1');
        const doc2 = firestore.doc('coll/doc1/coll/doc1');
        chai_1.expect(doc1.isEqual(doc1Equals)).to.be.true;
        chai_1.expect(doc1.isEqual(doc2)).to.be.false;
    });
});
mocha_1.describe('serialize document', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('serializes to Protobuf JS', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'bytes', {
                        bytesValue: Buffer.from('AG=', 'base64'),
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                bytes: Buffer.from('AG=', 'base64'),
            });
        });
    });
    mocha_1.it("doesn't serialize unsupported types", () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({ foo: undefined });
        }).to.throw('Value for argument "data" is not a valid Firestore document. Cannot use "undefined" as a Firestore value (found in field "foo").');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({
                foo: src_1.FieldPath.documentId(),
            });
        }).to.throw('Value for argument "data" is not a valid Firestore document. Cannot use object of type "FieldPath" as a Firestore value (found in field "foo").');
        chai_1.expect(() => {
            class Foo {
            }
            firestore.doc('collectionId/documentId').set({ foo: new Foo() });
        }).to.throw('Value for argument "data" is not a valid Firestore document. Couldn\'t serialize object of type "Foo" (found in field "foo"). Firestore doesn\'t support JavaScript objects with custom prototypes (i.e. objects that were created via the "new" operator).');
        chai_1.expect(() => {
            class Foo {
            }
            firestore
                .doc('collectionId/documentId')
                .set(new Foo());
        }).to.throw('Value for argument "data" is not a valid Firestore document. Couldn\'t serialize object of type "Foo". Firestore doesn\'t support JavaScript objects with custom prototypes (i.e. objects that were created via the "new" operator).');
        chai_1.expect(() => {
            class Foo {
            }
            class Bar extends Foo {
            }
            firestore
                .doc('collectionId/documentId')
                .set(new Bar());
        }).to.throw('Value for argument "data" is not a valid Firestore document. Couldn\'t serialize object of type "Bar". Firestore doesn\'t support JavaScript objects with custom prototypes (i.e. objects that were created via the "new" operator).');
    });
    mocha_1.it('provides custom error for objects from different Firestore instance', () => {
        class FieldPath {
        }
        class GeoPoint {
        }
        class Timestamp {
        }
        const customClasses = [new FieldPath(), new GeoPoint(), new Timestamp()];
        for (const customClass of customClasses) {
            chai_1.expect(() => {
                firestore
                    .doc('collectionId/documentId')
                    .set(customClass);
            }).to.throw('Value for argument "data" is not a valid Firestore document. ' +
                `Detected an object of type "${customClass.constructor.name}" that doesn't match the expected instance.`);
        }
    });
    mocha_1.it('serializes large numbers into doubles', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'largeNumber', {
                        doubleValue: 18014398509481984,
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                // Set to 2^54, which should be stored as a double.
                largeNumber: 18014398509481984,
            });
        });
    });
    mocha_1.it('serializes date before 1970', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'moonLanding', {
                        timestampValue: {
                            nanos: 123000000,
                            seconds: -14182920,
                        },
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                moonLanding: new Date('Jul 20 1969 20:18:00.123 UTC'),
            });
        });
    });
    mocha_1.it('supports Moment.js', () => {
        class Moment {
            toDate() {
                return new Date('Jul 20 1969 20:18:00.123 UTC');
            }
        }
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'moonLanding', {
                        timestampValue: {
                            nanos: 123000000,
                            seconds: -14182920,
                        },
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                moonLanding: new Moment(),
            });
        });
    });
    mocha_1.it('supports BigInt', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'bigIntValue', {
                        integerValue: '9007199254740992',
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                bigIntValue: BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1),
            });
        });
    });
    mocha_1.it('serializes unicode keys', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', '😀', '😜'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                '😀': '😜',
            });
        });
    });
    mocha_1.it('accepts both blob formats', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'blob1', { bytesValue: new Uint8Array([0, 1, 2]) }, 'blob2', {
                        bytesValue: Buffer.from([0, 1, 2]),
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                blob1: new Uint8Array([0, 1, 2]),
                blob2: Buffer.from([0, 1, 2]),
            });
        });
    });
    mocha_1.it('supports NaN and Infinity', () => {
        const overrides = {
            commit: request => {
                const fields = request.writes[0].update.fields;
                chai_1.expect(fields.nanValue.doubleValue).to.be.a('number');
                chai_1.expect(fields.nanValue.doubleValue).to.be.NaN;
                chai_1.expect(fields.posInfinity.doubleValue).to.equal(Infinity);
                chai_1.expect(fields.negInfinity.doubleValue).to.equal(-Infinity);
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                nanValue: NaN,
                posInfinity: Infinity,
                negInfinity: -Infinity,
            });
        });
    });
    mocha_1.it('with invalid geopoint', () => {
        chai_1.expect(() => {
            new src_1.GeoPoint(57.2999988, 'INVALID');
        }).to.throw('Value for argument "longitude" is not a valid number');
        chai_1.expect(() => {
            new src_1.GeoPoint('INVALID', -4.4499982);
        }).to.throw('Value for argument "latitude" is not a valid number');
        chai_1.expect(() => {
            new src_1.GeoPoint();
        }).to.throw('Value for argument "latitude" is not a valid number');
        chai_1.expect(() => {
            new src_1.GeoPoint(NaN, 0);
        }).to.throw('Value for argument "latitude" is not a valid number');
        chai_1.expect(() => {
            new src_1.GeoPoint(Infinity, 0);
        }).to.throw('Value for argument "latitude" must be within [-90, 90] inclusive, but was: Infinity');
        chai_1.expect(() => {
            new src_1.GeoPoint(91, 0);
        }).to.throw('Value for argument "latitude" must be within [-90, 90] inclusive, but was: 91');
        chai_1.expect(() => {
            new src_1.GeoPoint(90, 181);
        }).to.throw('Value for argument "longitude" must be within [-180, 180] inclusive, but was: 181');
    });
    mocha_1.it('resolves infinite nesting', () => {
        const obj = {};
        obj.foo = obj;
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update(obj);
        }).to.throw('Value for argument "dataOrField" is not a valid Firestore value. Input object is deeper than 20 levels or contains a cycle.');
    });
    mocha_1.it('is able to write a document reference with cycles', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'ref', {
                        referenceValue: `projects/${PROJECT_ID}/databases/(default)/documents/collectionId/documentId`,
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            // The Firestore Admin SDK adds a cyclic reference to the 'Firestore'
            // member of 'DocumentReference'. We emulate this behavior in this
            // test to verify that we can properly serialize DocumentReference
            // instances, even if they have cyclic references (we shouldn't try to
            // validate them beyond the instanceof check).
            const ref = firestore.doc('collectionId/documentId');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref.firestore.firestore = firestore;
            return ref.set({ ref });
        });
    });
});
mocha_1.describe('deserialize document', () => {
    mocha_1.it('deserializes Protobuf JS', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'foo', {
                    bytesValue: Buffer.from('AG=', 'base64'),
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(res => {
                chai_1.expect(res.data()).to.deep.eq({ foo: Buffer.from('AG=', 'base64') });
            });
        });
    });
    mocha_1.it('deserializes date before 1970', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'moonLanding', {
                    timestampValue: {
                        nanos: 123000000,
                        seconds: -14182920,
                    },
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(res => {
                chai_1.expect(res.get('moonLanding').toMillis()).to.equal(new Date('Jul 20 1969 20:18:00.123 UTC').getTime());
            });
        });
    });
    mocha_1.it('returns undefined for unknown fields', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId')));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(res => {
                chai_1.expect(res.get('bar')).to.not.exist;
                chai_1.expect(res.get('bar.foo')).to.not.exist;
            });
        });
    });
    mocha_1.it('supports NaN and Infinity', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'nanValue', { doubleValue: NaN }, 'posInfinity', { doubleValue: Infinity }, 'negInfinity', { doubleValue: -Infinity })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(res => {
                chai_1.expect(res.get('nanValue')).to.be.a('number');
                chai_1.expect(res.get('nanValue')).to.be.NaN;
                chai_1.expect(res.get('posInfinity')).to.equal(Infinity);
                chai_1.expect(res.get('negInfinity')).to.equal(-Infinity);
            });
        });
    });
    mocha_1.it('deserializes BigInt', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'bigIntValue', {
                    integerValue: '9007199254740992',
                })));
            },
        };
        return helpers_1.createInstance(overrides, { useBigInt: true }).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(res => {
                chai_1.expect(res.get('bigIntValue')).to.be.a('bigint');
                chai_1.expect(res.get('bigIntValue')).to.equal(BigInt('9007199254740992'));
            });
        });
    });
    mocha_1.it("doesn't deserialize unsupported types", () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'moonLanding', {
                    valueType: 'foo',
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(doc => {
                chai_1.expect(() => {
                    doc.data();
                }).to.throw('Cannot decode type from Firestore Value: {"valueType":"foo"}');
            });
        });
    });
    mocha_1.it("doesn't deserialize invalid latitude", () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'geoPointValue', {
                    geoPointValue: {
                        latitude: 'foo',
                        longitude: -122.947778,
                    },
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(doc => {
                chai_1.expect(() => doc.data()).to.throw('Value for argument "latitude" is not a valid number.');
            });
        });
    });
    mocha_1.it("doesn't deserialize invalid longitude", () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'geoPointValue', {
                    geoPointValue: {
                        latitude: 50.1430847,
                        longitude: 'foo',
                    },
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(doc => {
                chai_1.expect(() => doc.data()).to.throw('Value for argument "longitude" is not a valid number.');
            });
        });
    });
});
mocha_1.describe('get document', () => {
    mocha_1.it('returns document', () => {
        const overrides = {
            batchGetDocuments: request => {
                helpers_1.requestEquals(request, helpers_1.retrieve('documentId'));
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'foo', {
                    mapValue: {
                        fields: {
                            bar: {
                                stringValue: 'foobar',
                            },
                        },
                    },
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(result => {
                chai_1.expect(result.data()).to.deep.eq({ foo: { bar: 'foobar' } });
                chai_1.expect(result.get('foo')).to.deep.eq({ bar: 'foobar' });
                chai_1.expect(result.get('foo.bar')).to.equal('foobar');
                chai_1.expect(result.get(new src_1.FieldPath('foo', 'bar'))).to.equal('foobar');
                chai_1.expect(result.ref.id).to.equal('documentId');
            });
        });
    });
    mocha_1.it('returns read, update and create times', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId')));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(result => {
                chai_1.expect(result.createTime.isEqual(new src_1.Timestamp(1, 2))).to.be.true;
                chai_1.expect(result.updateTime.isEqual(new src_1.Timestamp(3, 4))).to.be.true;
                chai_1.expect(result.readTime.isEqual(new src_1.Timestamp(5, 6))).to.be.true;
            });
        });
    });
    mocha_1.it('returns not found', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.missing('documentId'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(result => {
                chai_1.expect(result.exists).to.be.false;
                chai_1.expect(result.readTime.isEqual(new src_1.Timestamp(5, 6))).to.be.true;
                chai_1.expect(result.data()).to.not.exist;
                chai_1.expect(result.get('foo')).to.not.exist;
            });
        });
    });
    mocha_1.it('throws error', done => {
        const overrides = {
            batchGetDocuments: () => {
                const error = new google_gax_1.GoogleError('RPC Error');
                error.code = google_gax_1.Status.PERMISSION_DENIED;
                return helpers_1.stream(error);
            },
        };
        helpers_1.createInstance(overrides).then(firestore => {
            firestore
                .doc('collectionId/documentId')
                .get()
                .catch(err => {
                chai_1.expect(err.message).to.equal('RPC Error');
                done();
            });
        });
    });
    mocha_1.it('cannot obtain field value without field path', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found(helpers_1.document('documentId', 'foo', {
                    mapValue: {
                        fields: {
                            bar: {
                                stringValue: 'foobar',
                            },
                        },
                    },
                })));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(doc => {
                chai_1.expect(() => doc.get()).to.throw('Value for argument "field" is not a valid field path. The path cannot be omitted.');
            });
        });
    });
});
mocha_1.describe('delete document', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreClient => {
            firestore = firestoreClient;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('generates proto', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.remove('documentId'));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').delete();
        });
    });
    mocha_1.it('returns update time', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.remove('documentId'));
                return helpers_1.response({
                    commitTime: {
                        nanos: 123000000,
                        seconds: 479978400,
                    },
                    writeResults: [{}],
                });
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .delete()
                .then(res => {
                chai_1.expect(res.writeTime.isEqual(new src_1.Timestamp(479978400, 123000000))).to
                    .be.true;
            });
        });
    });
    mocha_1.it('with last update time precondition', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.remove('documentId', {
                    updateTime: {
                        nanos: 123000000,
                        seconds: 479978400,
                    },
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            const docRef = firestore.doc('collectionId/documentId');
            return Promise.all([
                docRef.delete({
                    lastUpdateTime: new src_1.Timestamp(479978400, 123000000),
                }),
                docRef.delete({
                    lastUpdateTime: src_1.Timestamp.fromMillis(479978400123),
                }),
                docRef.delete({
                    lastUpdateTime: src_1.Timestamp.fromDate(new Date(479978400123)),
                }),
            ]);
        });
    });
    mocha_1.it('with invalid last update time precondition', () => {
        chai_1.expect(() => {
            return firestore.doc('collectionId/documentId').delete({
                lastUpdateTime: 1337,
            });
        }).to.throw('"lastUpdateTime" is not a Firestore Timestamp.');
    });
    mocha_1.it('throws if "exists" is not a boolean', () => {
        chai_1.expect(() => {
            return firestore.doc('collectionId/documentId').delete({
                exists: 42,
            });
        }).to.throw('"exists" is not a boolean.');
    });
    mocha_1.it('throws if no delete conditions are provided', () => {
        chai_1.expect(() => {
            return firestore
                .doc('collectionId/documentId')
                .delete(42);
        }).to.throw('Input is not an object.');
    });
    mocha_1.it('throws if more than one condition is provided', () => {
        chai_1.expect(() => {
            return firestore.doc('collectionId/documentId').delete({
                exists: false,
                lastUpdateTime: src_1.Timestamp.now(),
            });
        }).to.throw('Input specifies more than one precondition.');
    });
});
mocha_1.describe('set document', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreClient => {
            firestore = firestoreClient;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('supports empty map', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({});
        });
    });
    mocha_1.it('supports nested empty map', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {},
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({ a: {} });
        });
    });
    mocha_1.it('skips merges with just field transform', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId'),
                    transforms: [helpers_1.serverTimestamp('a'), helpers_1.serverTimestamp('b.c')],
                    mask: helpers_1.updateMask(),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                a: src_1.FieldValue.serverTimestamp(),
                b: { c: src_1.FieldValue.serverTimestamp() },
            }, { merge: true });
        });
    });
    mocha_1.it('sends empty non-merge write even with just field transform', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId'),
                    transforms: [helpers_1.serverTimestamp('a'), helpers_1.serverTimestamp('b.c')],
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                a: src_1.FieldValue.serverTimestamp(),
                b: { c: src_1.FieldValue.serverTimestamp() },
            });
        });
    });
    mocha_1.it('supports document merges', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'a', 'b', 'c', {
                        mapValue: {
                            fields: {
                                d: {
                                    stringValue: 'e',
                                },
                            },
                        },
                    }),
                    mask: helpers_1.updateMask('a', 'c.d', 'f'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .set({ a: 'b', c: { d: 'e' }, f: src_1.FieldValue.delete() }, { merge: true });
        });
    });
    mocha_1.it('supports document merges with field mask', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'a', 'foo', 'b', {
                        mapValue: {
                            fields: {
                                c: {
                                    stringValue: 'foo',
                                },
                            },
                        },
                    }, 'd', {
                        mapValue: {
                            fields: {
                                e: {
                                    stringValue: 'foo',
                                },
                            },
                        },
                    }),
                    mask: helpers_1.updateMask('a', 'b', 'd.e', 'f'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                a: 'foo',
                b: { c: 'foo' },
                d: { e: 'foo', ignore: 'foo' },
                f: src_1.FieldValue.delete(),
                ignore: 'foo',
                ignoreMap: { a: 'foo' },
            }, { mergeFields: ['a', new src_1.FieldPath('b'), 'd.e', 'f'] });
        });
    });
    mocha_1.it('supports document merges with empty field mask', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId'),
                    mask: helpers_1.updateMask(),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({}, {
                mergeFields: [],
            });
        });
    });
    mocha_1.it('supports document merges with field mask and empty maps', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {
                            fields: {
                                b: {
                                    mapValue: {},
                                },
                            },
                        },
                    }, 'c', {
                        mapValue: {
                            fields: {
                                d: {
                                    mapValue: {},
                                },
                            },
                        },
                    }),
                    mask: helpers_1.updateMask('a', 'c.d'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                a: { b: {} },
                c: { d: {} },
            }, { mergeFields: ['a', new src_1.FieldPath('c', 'd')] });
        });
    });
    mocha_1.it('supports document merges with field mask and field transform', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId'),
                    mask: helpers_1.updateMask('b', 'f'),
                    transforms: [
                        helpers_1.serverTimestamp('a'),
                        helpers_1.serverTimestamp('b.c'),
                        helpers_1.serverTimestamp('d.e'),
                    ],
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({
                a: src_1.FieldValue.serverTimestamp(),
                b: { c: src_1.FieldValue.serverTimestamp() },
                d: {
                    e: src_1.FieldValue.serverTimestamp(),
                    ignore: src_1.FieldValue.serverTimestamp(),
                },
                f: src_1.FieldValue.delete(),
                ignore: src_1.FieldValue.serverTimestamp(),
                ignoreMap: { a: src_1.FieldValue.serverTimestamp() },
            }, { mergeFields: ['a', new src_1.FieldPath('b'), 'd.e', 'f'] });
        });
    });
    mocha_1.it('supports empty merge', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId'),
                    mask: helpers_1.updateMask(),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({}, { merge: true });
        });
    });
    mocha_1.it('supports nested empty merge', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {},
                    }),
                    mask: helpers_1.updateMask('a'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({ a: {} }, {
                merge: true,
            });
        });
    });
    mocha_1.it('supports partials with merge', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'title', {
                        stringValue: 'story',
                    }),
                    mask: helpers_1.updateMask('title'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .withConverter(helpers_1.postConverterMerge)
                .set({ title: 'story' }, {
                merge: true,
            });
        });
    });
    mocha_1.it('supports partials with mergeFields', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'title', {
                        stringValue: 'story',
                    }),
                    mask: helpers_1.updateMask('title'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .withConverter(helpers_1.postConverterMerge)
                .set({ title: 'story', author: 'writer' }, {
                mergeFields: ['title'],
            });
        });
    });
    mocha_1.it("doesn't split on dots", () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.set({
                    document: helpers_1.document('documentId', 'a.b', 'c'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').set({ 'a.b': 'c' });
        });
    });
    mocha_1.it('validates merge option', () => {
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .set({ foo: 'bar' }, 'foo');
        }).to.throw('Value for argument "options" is not a valid set() options argument. Input is not an object.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({ foo: 'bar' }, {
                merge: 42,
            });
        }).to.throw('Value for argument "options" is not a valid set() options argument. "merge" is not a boolean.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({ foo: 'bar' }, {
                mergeFields: 42,
            });
        }).to.throw('Value for argument "options" is not a valid set() options argument. "mergeFields" is not an array.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({ foo: 'bar' }, {
                mergeFields: [null],
            });
        }).to.throw('Value for argument "options" is not a valid set() options argument. "mergeFields" is not valid: Element at index 0 is not a valid field path. Paths can only be specified as strings or via a FieldPath object.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({ foo: 'bar' }, {
                mergeFields: ['foobar'],
            });
        }).to.throw('Input data is missing for field "foobar".');
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .set({ foo: 'bar' }, { merge: true, mergeFields: [] });
        }).to.throw('Value for argument "options" is not a valid set() options argument. You cannot specify both "merge" and "mergeFields".');
    });
    mocha_1.it('requires an object', () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set(null);
        }).to.throw('Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
    });
    mocha_1.it("doesn't support non-merge deletes", () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set({ foo: src_1.FieldValue.delete() });
        }).to.throw('Value for argument "data" is not a valid Firestore document. FieldValue.delete() must appear at the top-level and can only be used in update() or set() with {merge:true} (found in field "foo").');
    });
    mocha_1.it("doesn't accept arrays", () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').set([42]);
        }).to.throw('Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
    });
});
mocha_1.describe('create document', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreClient => {
            firestore = firestoreClient;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('creates document', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.create({ document: helpers_1.document('documentId') }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').create({});
        });
    });
    mocha_1.it('returns update time', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.create({ document: helpers_1.document('documentId') }));
                return helpers_1.response({
                    commitTime: {
                        nanos: 0,
                        seconds: 0,
                    },
                    writeResults: [
                        {
                            updateTime: {
                                nanos: 123000000,
                                seconds: 479978400,
                            },
                        },
                    ],
                });
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .create({})
                .then(res => {
                chai_1.expect(res.writeTime.isEqual(new src_1.Timestamp(479978400, 123000000))).to
                    .be.true;
            });
        });
    });
    mocha_1.it('supports field transform', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.create({
                    document: helpers_1.document('documentId'),
                    transforms: [
                        helpers_1.serverTimestamp('field'),
                        helpers_1.serverTimestamp('map.field'),
                    ],
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').create({
                field: src_1.FieldValue.serverTimestamp(),
                map: { field: src_1.FieldValue.serverTimestamp() },
            });
        });
    });
    mocha_1.it('supports nested empty map', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.create({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {
                            fields: {
                                b: {
                                    mapValue: {},
                                },
                            },
                        },
                    }),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').create({ a: { b: {} } });
        });
    });
    mocha_1.it('requires an object', () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').create(null);
        }).to.throw('Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
    });
    mocha_1.it("doesn't accept arrays", () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').create([42]);
        }).to.throw('Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
    });
});
mocha_1.describe('update document', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreClient => {
            firestore = firestoreClient;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('generates proto', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    mask: helpers_1.updateMask('foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({ foo: 'bar' });
        });
    });
    mocha_1.it('supports nested field transform', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', {
                        mapValue: {},
                    }),
                    transforms: [helpers_1.serverTimestamp('a.b'), helpers_1.serverTimestamp('c.d')],
                    mask: helpers_1.updateMask('a', 'foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({
                foo: {},
                a: { b: src_1.FieldValue.serverTimestamp() },
                'c.d': src_1.FieldValue.serverTimestamp(),
            });
        });
    });
    mocha_1.it('skips write for single field transform', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId'),
                    transforms: [helpers_1.serverTimestamp('a')],
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .update('a', src_1.FieldValue.serverTimestamp());
        });
    });
    mocha_1.it('supports nested empty map', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {},
                    }),
                    mask: helpers_1.updateMask('a'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({ a: {} });
        });
    });
    mocha_1.it('supports nested delete', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({ document: helpers_1.document('documentId'), mask: helpers_1.updateMask('a.b') }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({
                'a.b': src_1.FieldValue.delete(),
            });
        });
    });
    mocha_1.it('returns update time', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    mask: helpers_1.updateMask('foo'),
                }));
                return helpers_1.response({
                    commitTime: {
                        nanos: 0,
                        seconds: 0,
                    },
                    writeResults: [
                        {
                            updateTime: {
                                nanos: 123000000,
                                seconds: 479978400,
                            },
                        },
                    ],
                });
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .update({ foo: 'bar' })
                .then(res => {
                chai_1.expect(res.writeTime.isEqual(new src_1.Timestamp(479978400, 123000000))).to
                    .be.true;
            });
        });
    });
    mocha_1.it('with last update time precondition', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    mask: helpers_1.updateMask('foo'),
                    precondition: {
                        updateTime: {
                            nanos: 123000000,
                            seconds: 479978400,
                        },
                    },
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return Promise.all([
                firestore.doc('collectionId/documentId').update({ foo: 'bar' }, {
                    lastUpdateTime: new src_1.Timestamp(479978400, 123000000),
                }),
                firestore.doc('collectionId/documentId').update('foo', 'bar', {
                    lastUpdateTime: new src_1.Timestamp(479978400, 123000000),
                }),
            ]);
        });
    });
    mocha_1.it('with invalid last update time precondition', () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({ foo: 'bar' }, {
                lastUpdateTime: 'foo',
            });
        }).to.throw('"lastUpdateTime" is not a Firestore Timestamp.');
    });
    mocha_1.it('requires at least one field', () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({});
        }).to.throw('At least one field must be updated.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update();
        }).to.throw('Function "DocumentReference.update()" requires at least 1 argument.');
    });
    mocha_1.it('rejects nested deletes', () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({
                a: { b: src_1.FieldValue.delete() },
            });
        }).to.throw('Update() requires either a single JavaScript object or an alternating list of field/value pairs that can be followed by an optional precondition. Value for argument "dataOrField" is not a valid Firestore value. FieldValue.delete() must appear at the top-level and can only be used in update() or set() with {merge:true} (found in field "a.b").');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update('a', {
                b: src_1.FieldValue.delete(),
            });
        }).to.throw('Update() requires either a single JavaScript object or an alternating list of field/value pairs that can be followed by an optional precondition. Element at index 1 is not a valid Firestore value. FieldValue.delete() must appear at the top-level and can only be used in update() or set() with {merge:true} (found in field "a.b").');
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .update('a', src_1.FieldValue.arrayUnion(src_1.FieldValue.delete()));
        }).to.throw('Element at index 0 is not a valid array element. FieldValue.delete() cannot be used inside of an array.');
    });
    mocha_1.it('with top-level document', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', 'bar'),
                    mask: helpers_1.updateMask('foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({
                foo: 'bar',
            });
        });
    });
    mocha_1.it('with nested document', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {
                            fields: {
                                b: {
                                    mapValue: {
                                        fields: {
                                            c: {
                                                stringValue: 'foobar',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    }, 'foo', {
                        mapValue: {
                            fields: {
                                bar: {
                                    stringValue: 'foobar',
                                },
                            },
                        },
                    }),
                    mask: helpers_1.updateMask('a.b.c', 'foo.bar'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return Promise.all([
                firestore.doc('collectionId/documentId').update({
                    'foo.bar': 'foobar',
                    'a.b.c': 'foobar',
                }),
                firestore
                    .doc('collectionId/documentId')
                    .update('foo.bar', 'foobar', new src_1.FieldPath('a', 'b', 'c'), 'foobar'),
            ]);
        });
    });
    mocha_1.it('with two nested fields ', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'foo', {
                        mapValue: {
                            fields: {
                                bar: { stringValue: 'two' },
                                deep: {
                                    mapValue: {
                                        fields: {
                                            bar: { stringValue: 'two' },
                                            foo: { stringValue: 'one' },
                                        },
                                    },
                                },
                                foo: { stringValue: 'one' },
                            },
                        },
                    }),
                    mask: helpers_1.updateMask('foo.bar', 'foo.deep.bar', 'foo.deep.foo', 'foo.foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return Promise.all([
                firestore.doc('collectionId/documentId').update({
                    'foo.foo': 'one',
                    'foo.bar': 'two',
                    'foo.deep.foo': 'one',
                    'foo.deep.bar': 'two',
                }),
                firestore
                    .doc('collectionId/documentId')
                    .update('foo.foo', 'one', 'foo.bar', 'two', 'foo.deep.foo', 'one', 'foo.deep.bar', 'two'),
            ]);
        });
    });
    mocha_1.it('with nested field and document transform ', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'a', {
                        mapValue: {
                            fields: {
                                b: {
                                    mapValue: {
                                        fields: {
                                            keep: {
                                                stringValue: 'keep',
                                            },
                                        },
                                    },
                                },
                                c: {
                                    mapValue: {
                                        fields: {
                                            keep: {
                                                stringValue: 'keep',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    }),
                    mask: helpers_1.updateMask('a.b.delete', 'a.b.keep', 'a.c.delete', 'a.c.keep'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({
                'a.b.delete': src_1.FieldValue.delete(),
                'a.b.keep': 'keep',
                'a.c.delete': src_1.FieldValue.delete(),
                'a.c.keep': 'keep',
            });
        });
    });
    mocha_1.it('with field with dot ', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'a.b', 'c'),
                    mask: helpers_1.updateMask('`a.b`'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .update(new src_1.FieldPath('a.b'), 'c');
        });
    });
    mocha_1.it('with conflicting update', () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({
                foo: 'foobar',
                'foo.bar': 'foobar',
            });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo" was specified multiple times.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({
                foo: 'foobar',
                'foo.bar.foobar': 'foobar',
            });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo" was specified multiple times.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({
                'foo.bar': 'foobar',
                foo: 'foobar',
            });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo" was specified multiple times.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({
                'foo.bar': 'foobar',
                'foo.bar.foo': 'foobar',
            });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo.bar" was specified multiple times.');
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update({
                'foo.bar': { foo: 'foobar' },
                'foo.bar.foo': 'foobar',
            });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo.bar" was specified multiple times.');
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .update('foo.bar', 'foobar', 'foo', 'foobar');
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo" was specified multiple times.');
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .update('foo', { foobar: 'foobar' }, 'foo.bar', { foobar: 'foobar' });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo" was specified multiple times.');
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .update('foo', { foobar: 'foobar' }, 'foo.bar', { foobar: 'foobar' });
        }).to.throw('Value for argument "dataOrField" is not a valid update map. Field "foo" was specified multiple times.');
    });
    mocha_1.it('with valid field paths', () => {
        const validFields = ['foo.bar', '_', 'foo.bar.foobar', '\n`'];
        for (let i = 0; i < validFields.length; ++i) {
            firestore.collection('col').select(validFields[i]);
        }
    });
    mocha_1.it('with empty field path', () => {
        chai_1.expect(() => {
            const doc = { '': 'foo' };
            firestore.doc('col/doc').update(doc);
        }).to.throw('Update() requires either a single JavaScript object or an alternating list of field/value pairs that can be followed by an optional precondition. Element at index 0 should not be an empty string.');
    });
    mocha_1.it('with invalid field paths', () => {
        const invalidFields = [
            '.a',
            'a.',
            '.a.',
            'a..a',
            'a*a',
            'a/a',
            'a[a',
            'a]a',
        ];
        for (let i = 0; i < invalidFields.length; ++i) {
            chai_1.expect(() => {
                const doc = {};
                doc[invalidFields[i]] = 'foo';
                firestore.doc('col/doc').update(doc);
            }).to.throw(/Value for argument ".*" is not a valid field path/);
        }
    });
    mocha_1.it("doesn't accept argument after precondition", () => {
        chai_1.expect(() => {
            firestore.doc('collectionId/documentId').update('foo', 'bar', {
                exists: true,
            });
        }).to.throw(INVALID_ARGUMENTS_TO_UPDATE);
        chai_1.expect(() => {
            firestore
                .doc('collectionId/documentId')
                .update({ foo: 'bar' }, { exists: true }, 'foo');
        }).to.throw(INVALID_ARGUMENTS_TO_UPDATE);
    });
    mocha_1.it('accepts an object', () => {
        chai_1.expect(() => firestore.doc('collectionId/documentId').update(null)).to.throw('Value for argument "dataOrField" is not a valid Firestore document. Input is not a plain JavaScript object.');
    });
    mocha_1.it("doesn't accept arrays", () => {
        chai_1.expect(() => firestore.doc('collectionId/documentId').update([42])).to.throw('Value for argument "dataOrField" is not a valid Firestore document. Input is not a plain JavaScript object.');
    });
    mocha_1.it('with field delete', () => {
        const overrides = {
            commit: request => {
                helpers_1.requestEquals(request, helpers_1.update({
                    document: helpers_1.document('documentId', 'bar', 'foobar'),
                    mask: helpers_1.updateMask('bar', 'foo'),
                }));
                return helpers_1.response(helpers_1.writeResult(1));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.doc('collectionId/documentId').update({
                foo: src_1.FieldValue.delete(),
                bar: 'foobar',
            });
        });
    });
});
mocha_1.describe('listCollections() method', () => {
    mocha_1.it('sorts results', () => {
        const overrides = {
            listCollectionIds: request => {
                chai_1.expect(request).to.deep.eq({
                    parent: `projects/${PROJECT_ID}/databases/(default)/documents/coll/doc`,
                    pageSize: 65535,
                });
                return helpers_1.response(['second', 'first']);
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('coll/doc')
                .listCollections()
                .then(collections => {
                chai_1.expect(collections[0].path).to.equal('coll/doc/first');
                chai_1.expect(collections[1].path).to.equal('coll/doc/second');
            });
        });
    });
});
mocha_1.describe('withConverter() support', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('for DocumentReference.get()', async () => {
        const doc = helpers_1.document('documentId', 'author', 'author', 'title', 'post');
        const overrides = {
            commit: request => {
                const expectedRequest = helpers_1.set({
                    document: doc,
                });
                helpers_1.requestEquals(request, expectedRequest);
                return helpers_1.response(helpers_1.writeResult(1));
            },
            batchGetDocuments: () => {
                const stream = through2.obj();
                setImmediate(() => {
                    stream.push({ found: doc, readTime: { seconds: 5, nanos: 6 } });
                    stream.push(null);
                });
                return stream;
            },
        };
        return helpers_1.createInstance(overrides).then(async (firestore) => {
            const docRef = firestore
                .collection('collectionId')
                .doc('documentId')
                .withConverter(helpers_1.postConverter);
            await docRef.set(new helpers_1.Post('post', 'author'));
            const postData = await docRef.get();
            const post = postData.data();
            chai_1.expect(post).to.not.be.undefined;
            chai_1.expect(post.toString()).to.equal('post, by author');
        });
    });
});
//# sourceMappingURL=document.js.map