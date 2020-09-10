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
const chaiAsPromised = require("chai-as-promised");
const extend = require("extend");
const google_gax_1 = require("google-gax");
const Firestore = require("../src");
const src_1 = require("../src");
const backoff_1 = require("../src/backoff");
const path_1 = require("../src/path");
const helpers_1 = require("./util/helpers");
chai_1.use(chaiAsPromised);
const { grpc } = new google_gax_1.GrpcClient({});
const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const DEFAULT_SETTINGS = {
    projectId: PROJECT_ID,
    sslCreds: grpc.credentials.createInsecure(),
};
// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => { });
const bytesData = Buffer.from('AQI=', 'base64');
const allSupportedTypesProtobufJs = helpers_1.document('documentId', 'arrayValue', {
    arrayValue: {
        values: [
            {
                stringValue: 'foo',
            },
            {
                integerValue: 42,
            },
            {
                stringValue: 'bar',
            },
        ],
    },
}, 'emptyArray', {
    arrayValue: {},
}, 'dateValue', {
    timestampValue: {
        nanos: 123000000,
        seconds: 479978400,
    },
}, 'timestampValue', {
    timestampValue: {
        nanos: 123000000,
        seconds: 479978400,
    },
}, 'doubleValue', {
    doubleValue: 0.1,
}, 'falseValue', {
    booleanValue: false,
}, 'infinityValue', {
    doubleValue: Infinity,
}, 'integerValue', {
    integerValue: 0,
}, 'negativeInfinityValue', {
    doubleValue: -Infinity,
}, 'nilValue', {
    nullValue: 'NULL_VALUE',
}, 'objectValue', {
    mapValue: {
        fields: {
            foo: {
                stringValue: 'bar',
            },
        },
    },
}, 'emptyObject', {
    mapValue: {},
}, 'pathValue', {
    referenceValue: `${DATABASE_ROOT}/documents/collection/document`,
}, 'stringValue', {
    stringValue: 'a',
}, 'trueValue', {
    booleanValue: true,
}, 'geoPointValue', {
    geoPointValue: {
        latitude: 50.1430847,
        longitude: -122.947778,
    },
}, 'bytesValue', {
    bytesValue: Buffer.from('AQI=', 'base64'),
});
const allSupportedTypesJson = {
    name: `${helpers_1.DOCUMENT_NAME}`,
    fields: {
        arrayValue: {
            arrayValue: {
                values: [
                    {
                        stringValue: 'foo',
                    },
                    {
                        integerValue: 42,
                    },
                    {
                        stringValue: 'bar',
                    },
                ],
            },
        },
        emptyArray: {
            arrayValue: {},
        },
        dateValue: {
            timestampValue: '1985-03-18T07:20:00.123000000Z',
        },
        timestampValue: {
            timestampValue: '1985-03-18T07:20:00.123000000Z',
        },
        doubleValue: {
            doubleValue: 0.1,
        },
        falseValue: {
            booleanValue: false,
        },
        infinityValue: {
            doubleValue: Infinity,
        },
        integerValue: {
            integerValue: 0,
        },
        negativeInfinityValue: {
            doubleValue: -Infinity,
        },
        nilValue: {
            nullValue: 'NULL_VALUE',
        },
        objectValue: {
            mapValue: {
                fields: {
                    foo: {
                        stringValue: 'bar',
                    },
                },
            },
        },
        emptyObject: {
            mapValue: {},
        },
        pathValue: {
            referenceValue: `${DATABASE_ROOT}/documents/collection/document`,
        },
        stringValue: {
            stringValue: 'a',
        },
        trueValue: {
            booleanValue: true,
        },
        geoPointValue: {
            geoPointValue: {
                latitude: 50.1430847,
                longitude: -122.947778,
            },
        },
        bytesValue: {
            bytesValue: 'AQI=',
        },
    },
    createTime: { seconds: 1, nanos: 2 },
    updateTime: { seconds: 3, nanos: 4 },
};
const allSupportedTypesInput = {
    stringValue: 'a',
    trueValue: true,
    falseValue: false,
    integerValue: 0,
    doubleValue: 0.1,
    infinityValue: Infinity,
    negativeInfinityValue: -Infinity,
    objectValue: { foo: 'bar' },
    emptyObject: {},
    dateValue: new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)'),
    timestampValue: Firestore.Timestamp.fromDate(new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')),
    pathValue: new Firestore.DocumentReference({
        formattedName: DATABASE_ROOT,
        _getProjectId: () => ({ projectId: PROJECT_ID, databaseId: '(default)' }),
    }, // eslint-disable-line @typescript-eslint/no-explicit-any
    new path_1.QualifiedResourcePath(PROJECT_ID, '(default)', 'collection', 'document')),
    arrayValue: ['foo', 42, 'bar'],
    emptyArray: [],
    nilValue: null,
    geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
    bytesValue: Buffer.from([0x1, 0x2]),
};
const allSupportedTypesOutput = {
    stringValue: 'a',
    trueValue: true,
    falseValue: false,
    integerValue: 0,
    doubleValue: 0.1,
    infinityValue: Infinity,
    negativeInfinityValue: -Infinity,
    objectValue: { foo: 'bar' },
    emptyObject: {},
    dateValue: Firestore.Timestamp.fromDate(new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')),
    timestampValue: Firestore.Timestamp.fromDate(new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')),
    pathValue: new Firestore.DocumentReference({
        formattedName: DATABASE_ROOT,
        _getProjectId: () => ({ projectId: PROJECT_ID, databaseId: '(default)' }),
    }, // eslint-disable-line @typescript-eslint/no-explicit-any
    new path_1.QualifiedResourcePath(PROJECT_ID, '(default)', 'collection', 'document')),
    arrayValue: ['foo', 42, 'bar'],
    emptyArray: [],
    nilValue: null,
    geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
    bytesValue: Buffer.from([0x1, 0x2]),
};
mocha_1.describe('instantiation', () => {
    mocha_1.it('creates instance', () => {
        const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
        chai_1.expect(firestore).to.be.an.instanceOf(Firestore.Firestore);
    });
    mocha_1.it('merges settings', () => {
        const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
        firestore.settings({ foo: 'bar' });
        /* eslint-disable @typescript-eslint/no-explicit-any */
        chai_1.expect(firestore._settings.projectId).to.equal(PROJECT_ID);
        chai_1.expect(firestore._settings.foo).to.equal('bar');
        /* eslint-enable @typescript-eslint/no-explicit-any */
    });
    mocha_1.it('can only call settings() once', () => {
        const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
        firestore.settings({});
        chai_1.expect(() => firestore.settings({})).to.throw('Firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object.');
    });
    mocha_1.it('cannot change settings after client initialized', async () => {
        const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
        await firestore.initializeIfNeeded('tag');
        chai_1.expect(() => firestore.settings({})).to.throw('Firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object.');
    });
    mocha_1.it('validates project ID is string', () => {
        chai_1.expect(() => {
            const settings = { ...DEFAULT_SETTINGS, projectId: 1337 };
            new Firestore.Firestore(settings);
        }).to.throw('Value for argument "settings.projectId" is not a valid string.');
        chai_1.expect(() => {
            new Firestore.Firestore(DEFAULT_SETTINGS).settings({
                projectId: 1337,
            });
        }).to.throw('Value for argument "settings.projectId" is not a valid string.');
    });
    mocha_1.it('validates ssl is a boolean', () => {
        const invalidValues = ['true', 1337];
        for (const value of invalidValues) {
            chai_1.expect(() => {
                const settings = { ...DEFAULT_SETTINGS, ssl: value };
                new Firestore.Firestore(settings);
            }).to.throw('Value for argument "settings.ssl" is not a valid boolean.');
        }
        new Firestore.Firestore({ ssl: true });
    });
    mocha_1.it('validates host is a valid host', () => {
        const invalidValues = [
            'foo://bar',
            'foobar/foobaz',
            'foobar/?foo',
            'foo@foobar',
            'foo:80:81',
        ];
        for (const value of invalidValues) {
            chai_1.expect(() => {
                new Firestore.Firestore({ host: value });
            }).to.throw('Value for argument "settings.host" is not a valid host.');
        }
        const validValues = [
            '127.0.0.1',
            '127.0.0.1:8080',
            '[::1]',
            '[::1]:8080',
            'foo',
            'foo:8080',
        ];
        for (const value of validValues) {
            new Firestore.Firestore({ host: value });
        }
    });
    mocha_1.it('validates FIRESTORE_EMULATOR_HOST is a valid host', () => {
        const oldValue = process.env.FIRESTORE_EMULATOR_HOST;
        try {
            const invalidValues = [
                'foo://bar',
                'foobar/foobaz',
                'foobar/?foo',
                'foo@foobar',
                'foo:80:81',
            ];
            for (const value of invalidValues) {
                chai_1.expect(() => {
                    process.env.FIRESTORE_EMULATOR_HOST = value;
                    new Firestore.Firestore();
                }).to.throw('Value for argument "FIRESTORE_EMULATOR_HOST" is not a valid host.');
            }
            const validValues = [
                '127.0.0.1',
                '127.0.0.1:8080',
                '[::1]',
                '[::1]:8080',
                'foo',
                'foo:8080',
            ];
            for (const value of validValues) {
                process.env.FIRESTORE_EMULATOR_HOST = value;
                new Firestore.Firestore();
            }
        }
        finally {
            if (oldValue) {
                process.env.FIRESTORE_EMULATOR_HOST = oldValue;
            }
            else {
                delete process.env.FIRESTORE_EMULATOR_HOST;
            }
        }
    });
    mocha_1.it('"settings.host" takes precedence without FIRESTORE_EMULATOR_HOST', () => {
        const oldValue = process.env.FIRESTORE_EMULATOR_HOST;
        try {
            delete process.env.FIRESTORE_EMULATOR_HOST;
            let firestore = new Firestore.Firestore({
                apiEndpoint: 'api-host',
            });
            firestore.settings({ host: 'new-host:100' });
            chai_1.expect(firestore._settings.servicePath).to.equal('new-host');
            firestore = new Firestore.Firestore({
                servicePath: 'service-host',
            });
            firestore.settings({ host: 'new-host:100' });
            chai_1.expect(firestore._settings.servicePath).to.equal('new-host');
            firestore = new Firestore.Firestore({
                apiEndpoint: 'api-host',
                servicePath: 'service-host',
            });
            firestore.settings({ host: 'new-host:100' });
            chai_1.expect(firestore._settings.servicePath).to.equal('new-host');
        }
        finally {
            if (oldValue) {
                process.env.FIRESTORE_EMULATOR_HOST = oldValue;
            }
            else {
                delete process.env.FIRESTORE_EMULATOR_HOST;
            }
        }
    });
    mocha_1.it('FIRESTORE_EMULATOR_HOST ignores host', () => {
        const oldValue = process.env.FIRESTORE_EMULATOR_HOST;
        try {
            process.env.FIRESTORE_EMULATOR_HOST = 'env-host:8080';
            const firestore = new Firestore.Firestore({
                host: 'localhost:8080',
            });
            chai_1.expect(firestore._settings.servicePath).to.equal('env-host');
            firestore.settings({ host: 'localhost:8080' });
            chai_1.expect(firestore._settings.servicePath).to.equal('env-host');
        }
        finally {
            if (oldValue) {
                process.env.FIRESTORE_EMULATOR_HOST = oldValue;
            }
            else {
                delete process.env.FIRESTORE_EMULATOR_HOST;
            }
        }
    });
    mocha_1.it('FIRESTORE_EMULATOR_HOST ignores servicePath', () => {
        const oldValue = process.env.FIRESTORE_EMULATOR_HOST;
        try {
            process.env.FIRESTORE_EMULATOR_HOST = 'foo';
            const firestore = new Firestore.Firestore({ servicePath: 'bar' });
            chai_1.expect(firestore._settings.servicePath).to.equal('foo');
            firestore.settings({ servicePath: 'bar' });
            chai_1.expect(firestore._settings.servicePath).to.equal('foo');
        }
        finally {
            if (oldValue) {
                process.env.FIRESTORE_EMULATOR_HOST = oldValue;
            }
            else {
                delete process.env.FIRESTORE_EMULATOR_HOST;
            }
        }
    });
    mocha_1.it('FIRESTORE_EMULATOR_HOST overrides other endpoint', done => {
        const oldValue = process.env.FIRESTORE_EMULATOR_HOST;
        try {
            process.env.FIRESTORE_EMULATOR_HOST = 'new';
            const firestore = new Firestore.Firestore({ servicePath: 'old' });
            firestore['validateAndApplySettings'] = settings => {
                chai_1.expect(settings.servicePath).to.equal('new');
                done();
            };
            firestore.settings({});
        }
        finally {
            if (oldValue) {
                process.env.FIRESTORE_EMULATOR_HOST = oldValue;
            }
            else {
                delete process.env.FIRESTORE_EMULATOR_HOST;
            }
        }
    });
    mocha_1.it('FIRESTORE_EMULATOR_HOST keeps user-provided headers', done => {
        const oldValue = process.env.FIRESTORE_EMULATOR_HOST;
        try {
            process.env.FIRESTORE_EMULATOR_HOST = 'new';
            const firestore = new Firestore.Firestore({ customHeaders: { foo: 'bar' } });
            firestore['validateAndApplySettings'] = settings => {
                chai_1.expect(settings.customHeaders.foo).to.equal('bar');
                done();
            };
            firestore.settings({});
        }
        finally {
            if (oldValue) {
                process.env.FIRESTORE_EMULATOR_HOST = oldValue;
            }
            else {
                delete process.env.FIRESTORE_EMULATOR_HOST;
            }
        }
    });
    mocha_1.it('validates maxIdleChannels', () => {
        const invalidValues = [-1, 'foo', 1.3];
        for (const value of invalidValues) {
            chai_1.expect(() => {
                const settings = { ...DEFAULT_SETTINGS, maxIdleChannels: value };
                new Firestore.Firestore(settings);
            }).to.throw();
        }
        new Firestore.Firestore({ maxIdleChannels: 1 });
    });
    mocha_1.it('uses project id from constructor', () => {
        const firestore = new Firestore.Firestore({ projectId: 'foo' });
        return chai_1.expect(firestore.formattedName).to.equal('projects/foo/databases/(default)');
    });
    mocha_1.it('uses project id from gapic client', async () => {
        return helpers_1.createInstance({
            getProjectId: () => Promise.resolve('foo'),
        }, { projectId: undefined }).then(async (firestore) => {
            await firestore.initializeIfNeeded('tag');
            chai_1.expect(firestore.projectId).to.equal('foo');
            chai_1.expect(firestore.formattedName).to.equal('projects/foo/databases/(default)');
        });
    });
    mocha_1.it('uses project ID from settings()', () => {
        const firestore = new Firestore.Firestore({
            sslCreds: grpc.credentials.createInsecure(),
        });
        firestore.settings({ projectId: PROJECT_ID });
        chai_1.expect(firestore.formattedName).to.equal(`projects/${PROJECT_ID}/databases/(default)`);
    });
    mocha_1.it('handles error from project ID detection', () => {
        return helpers_1.createInstance({
            getProjectId: () => Promise.reject(new Error('Injected Error')),
        }, { projectId: undefined }).then(firestore => {
            return chai_1.expect(firestore.collection('foo').add({})).to.eventually.be.rejectedWith('Injected Error');
        });
    });
    mocha_1.it('can instantiate client with ssl:false', async () => {
        const firestore = new Firestore.Firestore({
            ssl: false,
            projectId: 'foo',
        });
        await firestore['_clientPool'].run('tag', () => Promise.resolve());
    });
    mocha_1.it('exports all types', () => {
        // Ordering as per firestore.d.ts
        chai_1.expect(Firestore.Firestore).to.exist;
        chai_1.expect(Firestore.Firestore.name).to.equal('Firestore');
        chai_1.expect(Firestore.Timestamp).to.exist;
        chai_1.expect(Firestore.Timestamp.name).to.equal('Timestamp');
        chai_1.expect(Firestore.GeoPoint).to.exist;
        chai_1.expect(Firestore.GeoPoint.name).to.equal('GeoPoint');
        chai_1.expect(Firestore.Transaction).to.exist;
        chai_1.expect(Firestore.Transaction.name).to.equal('Transaction');
        chai_1.expect(Firestore.WriteBatch).to.exist;
        chai_1.expect(Firestore.WriteBatch.name).to.equal('WriteBatch');
        chai_1.expect(Firestore.DocumentReference).to.exist;
        chai_1.expect(Firestore.DocumentReference.name).to.equal('DocumentReference');
        chai_1.expect(Firestore.WriteResult).to.exist;
        chai_1.expect(Firestore.WriteResult.name).to.equal('WriteResult');
        chai_1.expect(Firestore.DocumentSnapshot).to.exist;
        chai_1.expect(Firestore.DocumentSnapshot.name).to.equal('DocumentSnapshot');
        chai_1.expect(Firestore.QueryDocumentSnapshot).to.exist;
        chai_1.expect(Firestore.QueryDocumentSnapshot.name).to.equal('QueryDocumentSnapshot');
        chai_1.expect(Firestore.Query).to.exist;
        chai_1.expect(Firestore.Query.name).to.equal('Query');
        chai_1.expect(Firestore.QuerySnapshot).to.exist;
        chai_1.expect(Firestore.QuerySnapshot.name).to.equal('QuerySnapshot');
        chai_1.expect(Firestore.CollectionReference).to.exist;
        chai_1.expect(Firestore.CollectionReference.name).to.equal('CollectionReference');
        chai_1.expect(Firestore.FieldValue).to.exist;
        chai_1.expect(Firestore.FieldValue.name).to.equal('FieldValue');
        chai_1.expect(Firestore.FieldPath).to.exist;
        chai_1.expect(Firestore.Firestore.name).to.equal('Firestore');
        chai_1.expect(Firestore.FieldValue.serverTimestamp().isEqual(Firestore.FieldValue.delete())).to.be.false;
    });
});
mocha_1.describe('serializer', () => {
    mocha_1.it('supports all types', () => {
        const overrides = {
            commit: request => {
                chai_1.expect(allSupportedTypesProtobufJs.fields).to.deep.eq(request.writes[0].update.fields);
                return helpers_1.response({
                    commitTime: {},
                    writeResults: [
                        {
                            updateTime: {},
                        },
                    ],
                });
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.collection('coll').add(allSupportedTypesInput);
        });
    });
});
mocha_1.describe('snapshot_() method', () => {
    let firestore;
    function verifyAllSupportedTypes(actualObject) {
        const expected = extend(true, {}, allSupportedTypesOutput);
        // Deep Equal doesn't support matching instances of DocumentRefs, so we
        // compare them manually and remove them from the resulting object.
        chai_1.expect(actualObject.get('pathValue').formattedName).to.equal(expected.pathValue.formattedName);
        const data = actualObject.data();
        delete data.pathValue;
        delete expected.pathValue;
        chai_1.expect(data).to.deep.eq(expected);
        // We specifically test the GeoPoint properties to ensure 100% test
        // coverage.
        chai_1.expect(data.geoPointValue.latitude).to.equal(50.1430847);
        chai_1.expect(data.geoPointValue.longitude).to.equal(-122.947778);
        chai_1.expect(data.geoPointValue.isEqual(new Firestore.GeoPoint(50.1430847, -122.947778))).to.be.true;
    }
    mocha_1.beforeEach(() => {
        // Unlike most other tests, we don't call `ensureClient` since the
        // `snapshot_` method does not require a GAPIC client.
        firestore = new Firestore.Firestore({
            projectId: PROJECT_ID,
            sslCreds: grpc.credentials.createInsecure(),
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('handles ProtobufJS', () => {
        const doc = firestore.snapshot_(helpers_1.document('doc', 'foo', { bytesValue: bytesData }), { seconds: 5, nanos: 6 });
        chai_1.expect(doc.exists).to.be.true;
        chai_1.expect({ foo: bytesData }).to.deep.eq(doc.data());
        chai_1.expect(doc.createTime.isEqual(new Firestore.Timestamp(1, 2))).to.be.true;
        chai_1.expect(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4))).to.be.true;
        chai_1.expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
    });
    mocha_1.it('handles Proto3 JSON together with existing types', () => {
        // Google Cloud Functions must be able to call snapshot_() with Proto3 JSON
        // data.
        const doc = firestore.snapshot_({
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {
                a: { bytesValue: 'AQI=' },
                b: { timestampValue: '1985-03-18T07:20:00.000Z' },
                c: {
                    valueType: 'bytesValue',
                    bytesValue: Buffer.from('AQI=', 'base64'),
                },
            },
            createTime: '1970-01-01T00:00:01.002Z',
            updateTime: '1970-01-01T00:00:03.000004Z',
        }, '1970-01-01T00:00:05.000000006Z', 'json');
        chai_1.expect(doc.exists).to.be.true;
        chai_1.expect(doc.data()).to.deep.eq({
            a: bytesData,
            b: Firestore.Timestamp.fromDate(new Date('1985-03-18T07:20:00.000Z')),
            c: bytesData,
        });
        chai_1.expect(doc.createTime.isEqual(new Firestore.Timestamp(1, 2000000))).to.be
            .true;
        chai_1.expect(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4000))).to.be
            .true;
        chai_1.expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
    });
    mocha_1.it('deserializes all supported types from Protobuf JS', () => {
        const doc = firestore.snapshot_(allSupportedTypesProtobufJs, {
            seconds: 5,
            nanos: 6,
        });
        verifyAllSupportedTypes(doc);
    });
    mocha_1.it('deserializes all supported types from Proto3 JSON', () => {
        const doc = firestore.snapshot_(allSupportedTypesJson, '1970-01-01T00:00:05.000000006Z', 'json');
        verifyAllSupportedTypes(doc);
    });
    mocha_1.it('handles invalid Proto3 JSON', () => {
        chai_1.expect(() => {
            firestore.snapshot_({
                name: `${DATABASE_ROOT}/documents/collectionId/doc`,
                fields: { foo: {} },
                createTime: '1970-01-01T00:00:01.000000002Z',
                updateTime: '1970-01-01T00:00:03.000000004Z',
            }, '1970-01-01T00:00:05.000000006Z', 'json');
        }).to.throw("Unable to infer type value fom '{}'.");
        chai_1.expect(() => {
            firestore.snapshot_({
                name: `${DATABASE_ROOT}/documents/collectionId/doc`,
                fields: { foo: { stringValue: 'bar', integerValue: 42 } },
                createTime: '1970-01-01T00:00:01.000000002Z',
                updateTime: '1970-01-01T00:00:03.000000004Z',
            }, '1970-01-01T00:00:05.000000006Z', 'json');
        }).to.throw('Unable to infer type value fom \'{"stringValue":"bar","integerValue":42}\'.');
        chai_1.expect(() => {
            firestore.snapshot_({
                name: `${DATABASE_ROOT}/documents/collectionId/doc`,
                fields: { foo: { stringValue: 'bar' } },
                createTime: '1970-01-01T00:00:01.NaNZ',
                updateTime: '1970-01-01T00:00:03.000000004Z',
            }, '1970-01-01T00:00:05.000000006Z', 'json');
        }).to.throw('Specify a valid ISO 8601 timestamp for "documentOrName.createTime".');
    });
    mocha_1.it('handles missing document ', () => {
        const doc = firestore.snapshot_(`${DATABASE_ROOT}/documents/collectionId/doc`, '1970-01-01T00:00:05.000000006Z', 'json');
        chai_1.expect(doc.exists).to.be.false;
        chai_1.expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
    });
    mocha_1.it('handles invalid encoding format ', () => {
        chai_1.expect(() => {
            firestore.snapshot_(`${DATABASE_ROOT}/documents/collectionId/doc`, '1970-01-01T00:00:05.000000006Z', 'ascii');
        }).to.throw('Unsupported encoding format. Expected "json" or "protobufJS", but was "ascii".');
    });
});
mocha_1.describe('doc() method', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('returns DocumentReference', () => {
        const documentRef = firestore.doc('collectionId/documentId');
        chai_1.expect(documentRef).to.be.an.instanceOf(Firestore.DocumentReference);
    });
    mocha_1.it('requires document path', () => {
        chai_1.expect(() => firestore.doc()).to.throw('Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.');
    });
    mocha_1.it("doesn't accept empty components", () => {
        chai_1.expect(() => firestore.doc('coll//doc')).to.throw('Value for argument "documentPath" is not a valid resource path. Paths must not contain //.');
    });
    mocha_1.it('must point to document', () => {
        chai_1.expect(() => firestore.doc('collectionId')).to.throw('Value for argument "documentPath" must point to a document, but was "collectionId". Your path does not contain an even number of components.');
    });
    mocha_1.it('exposes properties', () => {
        const documentRef = firestore.doc('collectionId/documentId');
        chai_1.expect(documentRef.id).to.equal('documentId');
        chai_1.expect(documentRef.firestore).to.equal(firestore);
    });
});
mocha_1.describe('collection() method', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('returns collection', () => {
        const collection = firestore.collection('col1/doc1/col2');
        chai_1.expect(collection).to.be.an.instanceOf(Firestore.CollectionReference);
    });
    mocha_1.it('requires collection id', () => {
        chai_1.expect(() => firestore.collection()).to.throw('Value for argument "collectionPath" is not a valid resource path. Path must be a non-empty string.');
    });
    mocha_1.it('must point to a collection', () => {
        chai_1.expect(() => firestore.collection('collectionId/documentId')).to.throw('Value for argument "collectionPath" must point to a collection, but was "collectionId/documentId". Your path does not contain an odd number of components.');
    });
    mocha_1.it('exposes properties', () => {
        const collection = firestore.collection('collectionId');
        chai_1.expect(collection.id).to.exist;
        chai_1.expect(collection.doc).to.exist;
        chai_1.expect(collection.id).to.equal('collectionId');
    });
});
mocha_1.describe('listCollections() method', () => {
    mocha_1.it('returns collections', () => {
        const overrides = {
            listCollectionIds: request => {
                chai_1.expect(request).to.deep.eq({
                    parent: `projects/${PROJECT_ID}/databases/(default)/documents`,
                    pageSize: 65535,
                });
                return helpers_1.response(['first', 'second']);
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.listCollections().then(collections => {
                chai_1.expect(collections[0].path).to.equal('first');
                chai_1.expect(collections[1].path).to.equal('second');
            });
        });
    });
});
mocha_1.describe('getAll() method', () => {
    mocha_1.before(() => {
        backoff_1.setTimeoutHandler(setImmediate);
    });
    mocha_1.after(() => backoff_1.setTimeoutHandler(setTimeout));
    function resultEquals(result, ...docs) {
        chai_1.expect(result.length).to.equal(docs.length);
        for (let i = 0; i < result.length; ++i) {
            const doc = docs[i];
            if (doc.found) {
                chai_1.expect(result[i].exists).to.be.true;
                chai_1.expect(result[i].ref.formattedName).to.equal(doc.found.name);
            }
            else {
                chai_1.expect(result[i].exists).to.be.false;
                chai_1.expect(result[i].ref.formattedName).to.equal(doc.missing);
            }
        }
    }
    mocha_1.it('accepts single document', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found('documentId'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/documentId'))
                .then(result => {
                resultEquals(result, helpers_1.found('documentId'));
            });
        });
    });
    mocha_1.it('verifies response', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found('documentId2'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/documentId'))
                .then(() => {
                throw new Error('Unexpected success in Promise');
            })
                .catch(err => {
                chai_1.expect(err.message).to.equal('Did not receive document for "collectionId/documentId".');
            });
        });
    });
    mocha_1.it('handles stream exception during initialization', () => {
        let attempts = 0;
        const overrides = {
            batchGetDocuments: () => {
                ++attempts;
                return helpers_1.stream(new Error('Expected exception'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/documentId'))
                .then(() => {
                throw new Error('Unexpected success in Promise');
            })
                .catch(err => {
                chai_1.expect(attempts).to.equal(5);
                chai_1.expect(err.message).to.equal('Expected exception');
            });
        });
    });
    mocha_1.it('handles stream exception after initialization', () => {
        let attempts = 0;
        const overrides = {
            batchGetDocuments: () => {
                ++attempts;
                return helpers_1.stream(helpers_1.found('documentId'), new Error('Expected exception'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/documentId'))
                .then(() => {
                throw new Error('Unexpected success in Promise');
            })
                .catch(err => {
                // We don't retry since the stream might have already been released
                // to the end user.
                chai_1.expect(attempts).to.equal(1);
                chai_1.expect(err.message).to.equal('Expected exception');
            });
        });
    });
    mocha_1.it('handles intermittent stream exception', () => {
        let attempts = 0;
        const overrides = {
            batchGetDocuments: () => {
                if (attempts < 3) {
                    ++attempts;
                    throw new Error('Expected error');
                }
                else {
                    return helpers_1.stream(helpers_1.found(helpers_1.document('documentId')));
                }
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .doc('collectionId/documentId')
                .get()
                .then(() => {
                chai_1.expect(attempts).to.equal(3);
            });
        });
    });
    mocha_1.it('handles serialization error', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(helpers_1.found('documentId'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            firestore['snapshot_'] = () => {
                throw new Error('Expected exception');
            };
            return firestore
                .getAll(firestore.doc('collectionId/documentId'))
                .then(() => {
                throw new Error('Unexpected success in Promise');
            })
                .catch(err => {
                chai_1.expect(err.message).to.equal('Expected exception');
            });
        });
    });
    mocha_1.it('retries based on error code', () => {
        const expectedErrorAttempts = {
            [google_gax_1.Status.CANCELLED]: 1,
            [google_gax_1.Status.UNKNOWN]: 1,
            [google_gax_1.Status.INVALID_ARGUMENT]: 1,
            [google_gax_1.Status.DEADLINE_EXCEEDED]: 5,
            [google_gax_1.Status.NOT_FOUND]: 1,
            [google_gax_1.Status.ALREADY_EXISTS]: 1,
            [google_gax_1.Status.PERMISSION_DENIED]: 1,
            [google_gax_1.Status.RESOURCE_EXHAUSTED]: 1,
            [google_gax_1.Status.FAILED_PRECONDITION]: 1,
            [google_gax_1.Status.ABORTED]: 1,
            [google_gax_1.Status.OUT_OF_RANGE]: 1,
            [google_gax_1.Status.UNIMPLEMENTED]: 1,
            [google_gax_1.Status.INTERNAL]: 5,
            [google_gax_1.Status.UNAVAILABLE]: 5,
            [google_gax_1.Status.DATA_LOSS]: 1,
            [google_gax_1.Status.UNAUTHENTICATED]: 1,
        };
        const actualErrorAttempts = {};
        const overrides = {
            batchGetDocuments: request => {
                const errorCode = Number(request.documents[0].split('/').pop());
                actualErrorAttempts[errorCode] =
                    (actualErrorAttempts[errorCode] || 0) + 1;
                const error = new google_gax_1.GoogleError('Expected exception');
                error.code = errorCode;
                return helpers_1.stream(error);
            },
        };
        return helpers_1.createInstance(overrides).then(async (firestore) => {
            const coll = firestore.collection('collectionId');
            for (const errorCode of Object.keys(expectedErrorAttempts)) {
                await firestore
                    .getAll(coll.doc(`${errorCode}`))
                    .then(() => {
                    throw new Error('Unexpected success in Promise');
                })
                    .catch(err => {
                    chai_1.expect(err.code).to.equal(Number(errorCode));
                });
            }
            chai_1.expect(actualErrorAttempts).to.deep.eq(expectedErrorAttempts);
        });
    }).timeout(5000);
    mocha_1.it('requires at least one argument', () => {
        return helpers_1.createInstance().then(firestore => {
            chai_1.expect(() => firestore.getAll()).to.throw('Function "Firestore.getAll()" requires at least 1 argument.');
        });
    });
    mocha_1.it('validates document references', () => {
        return helpers_1.createInstance().then(firestore => {
            chai_1.expect(() => firestore.getAll(null)).to.throw('Element at index 0 is not a valid DocumentReference.');
        });
    });
    mocha_1.it('returns not found for missing documents', () => {
        const overrides = {
            batchGetDocuments: () => helpers_1.stream(helpers_1.found('exists'), helpers_1.missing('missing')),
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/exists'), firestore.doc('collectionId/missing'))
                .then(result => {
                resultEquals(result, helpers_1.found('exists'), helpers_1.missing('missing'));
            });
        });
    });
    mocha_1.it('returns results in order', () => {
        const overrides = {
            batchGetDocuments: () => {
                return helpers_1.stream(
                // Note that these are out of order.
                helpers_1.found('second'), helpers_1.found('first'), helpers_1.found('fourth'), helpers_1.found('third'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/first'), firestore.doc('collectionId/second'), firestore.doc('collectionId/third'), firestore.doc('collectionId/fourth'))
                .then(result => {
                resultEquals(result, helpers_1.found('first'), helpers_1.found('second'), helpers_1.found('third'), helpers_1.found(helpers_1.document('fourth')));
            });
        });
    });
    mocha_1.it('accepts same document multiple times', () => {
        const overrides = {
            batchGetDocuments: request => {
                chai_1.expect(request.documents.length).to.equal(2);
                return helpers_1.stream(helpers_1.found('a'), helpers_1.found('b'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .getAll(firestore.doc('collectionId/a'), firestore.doc('collectionId/a'), firestore.doc('collectionId/b'), firestore.doc('collectionId/a'))
                .then(result => {
                resultEquals(result, helpers_1.found('a'), helpers_1.found('a'), helpers_1.found('b'), helpers_1.found('a'));
            });
        });
    });
    mocha_1.it('applies field mask', () => {
        const overrides = {
            batchGetDocuments: request => {
                chai_1.expect(request.mask.fieldPaths).to.have.members([
                    'foo.bar',
                    '`foo.bar`',
                ]);
                return helpers_1.stream(helpers_1.found('a'));
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore.getAll(firestore.doc('collectionId/a'), {
                fieldMask: ['foo.bar', new src_1.FieldPath('foo.bar')],
            });
        });
    });
    mocha_1.it('validates field mask', () => {
        return helpers_1.createInstance().then(firestore => {
            chai_1.expect(() => firestore.getAll(firestore.doc('collectionId/a'), {
                fieldMask: null,
            })).to.throw('Value for argument "options" is not a valid read option. "fieldMask" is not an array.');
            chai_1.expect(() => firestore.getAll(firestore.doc('collectionId/a'), {
                fieldMask: ['a', new src_1.FieldPath('b'), null],
            })).to.throw('Value for argument "options" is not a valid read option. "fieldMask" is not valid: Element at index 2 is not a valid field path. Paths can only be specified as strings or via a FieldPath object.');
        });
    });
});
//# sourceMappingURL=index.js.map