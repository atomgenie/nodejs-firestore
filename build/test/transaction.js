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
const through2 = require("through2");
const Firestore = require("../src");
const src_1 = require("../src");
const backoff_1 = require("../src/backoff");
const helpers_1 = require("./util/helpers");
chai_1.use(chaiAsPromised);
const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const COLLECTION_ROOT = `${DATABASE_ROOT}/documents/collectionId`;
const DOCUMENT_ID = 'documentId';
const DOCUMENT_NAME = `${COLLECTION_ROOT}/${DOCUMENT_ID}`;
// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => { });
/** Helper to create a transaction ID from either a string or a Uint8Array. */
function transactionId(transaction) {
    if (transaction === undefined) {
        return Buffer.from('foo');
    }
    else if (typeof transaction === 'string') {
        return Buffer.from(transaction);
    }
    else {
        return transaction;
    }
}
function commit(transaction, writes, error) {
    const proto = {
        database: DATABASE_ROOT,
        transaction: transactionId(transaction),
    };
    proto.writes = writes || [];
    const response = {
        commitTime: {
            nanos: 0,
            seconds: 0,
        },
        writeResults: [],
    };
    for (let i = 0; i < proto.writes.length; ++i) {
        response.writeResults.push({
            updateTime: {
                nanos: 0,
                seconds: 0,
            },
        });
    }
    return {
        type: 'commit',
        request: proto,
        error,
        response,
    };
}
function rollback(transaction, error) {
    const proto = {
        database: DATABASE_ROOT,
        transaction: transactionId(transaction),
    };
    return {
        type: 'rollback',
        request: proto,
        error,
        response: {},
    };
}
function begin(transaction, prevTransaction, error) {
    const proto = { database: DATABASE_ROOT };
    if (prevTransaction) {
        proto.options = {
            readWrite: {
                retryTransaction: transactionId(prevTransaction),
            },
        };
    }
    const response = {
        transaction: transactionId(transaction),
    };
    return {
        type: 'begin',
        request: proto,
        error,
        response,
    };
}
function getAll(docs, fieldMask, transaction, error) {
    const request = {
        database: DATABASE_ROOT,
        documents: [],
        transaction: transactionId(transaction),
    };
    if (fieldMask) {
        request.mask = { fieldPaths: fieldMask };
    }
    const stream = through2.obj();
    for (const doc of docs) {
        const name = `${COLLECTION_ROOT}/${doc}`;
        request.documents.push(name);
        setImmediate(() => {
            stream.push({
                found: {
                    name,
                    createTime: { seconds: 1, nanos: 2 },
                    updateTime: { seconds: 3, nanos: 4 },
                },
                readTime: { seconds: 5, nanos: 6 },
            });
        });
    }
    setImmediate(() => {
        if (error) {
            stream.destroy(error);
        }
        else {
            stream.push(null);
        }
    });
    return {
        type: 'getDocument',
        request,
        error,
        stream,
    };
}
function getDocument(transaction, error) {
    return getAll([DOCUMENT_ID], undefined, transaction, error);
}
function query(transaction, error) {
    const request = {
        parent: `${DATABASE_ROOT}/documents`,
        structuredQuery: {
            from: [
                {
                    collectionId: 'collectionId',
                },
            ],
            where: {
                fieldFilter: {
                    field: {
                        fieldPath: 'foo',
                    },
                    op: 'EQUAL',
                    value: {
                        stringValue: 'bar',
                    },
                },
            },
        },
        transaction: transactionId(transaction),
    };
    const stream = through2.obj();
    setImmediate(() => {
        // Push a single result even for errored queries, as this avoids implicit
        // stream retries.
        stream.push({
            document: {
                name: DOCUMENT_NAME,
                createTime: { seconds: 1, nanos: 2 },
                updateTime: { seconds: 3, nanos: 4 },
            },
            readTime: { seconds: 5, nanos: 6 },
        });
        if (error) {
            stream.destroy(error);
        }
        else {
            stream.push(null);
        }
    });
    return {
        type: 'query',
        request,
        stream,
    };
}
function backoff(maxDelay) {
    return {
        type: 'backoff',
        delay: maxDelay ? 'max' : 'exponential',
    };
}
/**
 * Asserts that the given transaction function issues the expected requests.
 */
function runTransaction(transactionCallback, ...expectedRequests) {
    const overrides = {
        beginTransaction: actual => {
            const request = expectedRequests.shift();
            chai_1.expect(request.type).to.equal('begin');
            chai_1.expect(actual).to.deep.eq(request.request);
            if (request.error) {
                return Promise.reject(request.error);
            }
            else {
                return helpers_1.response(request.response);
            }
        },
        commit: (actual, options) => {
            // Ensure that we do not specify custom retry behavior for transactional
            // commits.
            chai_1.expect(options.retry).to.be.undefined;
            const request = expectedRequests.shift();
            chai_1.expect(request.type).to.equal('commit');
            chai_1.expect(actual).to.deep.eq(request.request);
            if (request.error) {
                return Promise.reject(request.error);
            }
            else {
                return helpers_1.response(request.response);
            }
        },
        rollback: actual => {
            const request = expectedRequests.shift();
            chai_1.expect(request.type).to.equal('rollback');
            chai_1.expect(actual).to.deep.eq(request.request);
            if (request.error) {
                return Promise.reject(request.error);
            }
            else {
                return helpers_1.response({});
            }
        },
        batchGetDocuments: actual => {
            const request = expectedRequests.shift();
            chai_1.expect(request.type).to.equal('getDocument');
            chai_1.expect(actual).to.deep.eq(request.request);
            return request.stream;
        },
        runQuery: actual => {
            const request = expectedRequests.shift();
            chai_1.expect(request.type).to.equal('query');
            actual = extend(true, {}, actual); // Remove undefined properties
            chai_1.expect(actual).to.deep.eq(request.request);
            return request.stream;
        },
    };
    return helpers_1.createInstance(overrides).then(async (firestore) => {
        try {
            backoff_1.setTimeoutHandler((callback, timeout) => {
                if (timeout > 0) {
                    const request = expectedRequests.shift();
                    chai_1.expect(request.type).to.equal('backoff');
                    if (request.delay === 'max') {
                        // Make sure that the delay is at least 30 seconds, which is based
                        // on the maximum delay of 60 seconds and a jitter factor of 50%.
                        chai_1.expect(timeout).to.not.be.lessThan(30 * 1000);
                    }
                }
                callback();
            });
            return await firestore.runTransaction(transaction => {
                const docRef = firestore.doc('collectionId/documentId');
                return transactionCallback(transaction, docRef);
            });
        }
        finally {
            backoff_1.setTimeoutHandler(setTimeout);
            chai_1.expect(expectedRequests.length).to.equal(0);
        }
    });
}
mocha_1.describe('successful transactions', () => {
    mocha_1.it('empty transaction', () => {
        return runTransaction(() => {
            return Promise.resolve();
        }, begin(), commit());
    });
    mocha_1.it('returns value', () => {
        return runTransaction(() => {
            return Promise.resolve('bar');
        }, begin(), commit()).then(val => {
            chai_1.expect(val).to.equal('bar');
        });
    });
});
mocha_1.describe('failed transactions', () => {
    const retryBehavior = {
        [google_gax_1.Status.CANCELLED]: true,
        [google_gax_1.Status.UNKNOWN]: true,
        [google_gax_1.Status.INVALID_ARGUMENT]: false,
        [google_gax_1.Status.DEADLINE_EXCEEDED]: true,
        [google_gax_1.Status.NOT_FOUND]: false,
        [google_gax_1.Status.ALREADY_EXISTS]: false,
        [google_gax_1.Status.RESOURCE_EXHAUSTED]: true,
        [google_gax_1.Status.FAILED_PRECONDITION]: false,
        [google_gax_1.Status.ABORTED]: true,
        [google_gax_1.Status.OUT_OF_RANGE]: false,
        [google_gax_1.Status.UNIMPLEMENTED]: false,
        [google_gax_1.Status.INTERNAL]: true,
        [google_gax_1.Status.UNAVAILABLE]: true,
        [google_gax_1.Status.DATA_LOSS]: false,
        [google_gax_1.Status.UNAUTHENTICATED]: true,
    };
    mocha_1.it('retries commit based on error code', async () => {
        const transactionFunction = () => Promise.resolve();
        for (const [errorCode, retry] of Object.entries(retryBehavior)) {
            const serverError = new google_gax_1.GoogleError('Test Error');
            serverError.code = Number(errorCode);
            if (retry) {
                await runTransaction(transactionFunction, begin('foo1'), commit('foo1', undefined, serverError), rollback('foo1'), backoff(), begin('foo2', 'foo1'), commit('foo2'));
            }
            else {
                await chai_1.expect(runTransaction(transactionFunction, begin('foo1'), commit('foo1', undefined, serverError), rollback('foo1'))).to.eventually.be.rejected;
            }
        }
    });
    mocha_1.it('retries runQuery based on error code', async () => {
        const transactionFunction = (transaction, docRef) => {
            const query = docRef.parent.where('foo', '==', 'bar');
            return transaction.get(query);
        };
        for (const [errorCode, retry] of Object.entries(retryBehavior)) {
            const serverError = new google_gax_1.GoogleError('Test Error');
            serverError.code = Number(errorCode);
            if (retry) {
                await runTransaction(transactionFunction, begin('foo1'), query('foo1', serverError), rollback('foo1'), backoff(), begin('foo2', 'foo1'), query('foo2'), commit('foo2'));
            }
            else {
                await chai_1.expect(runTransaction(transactionFunction, begin('foo1'), query('foo1', serverError), rollback('foo1'))).to.eventually.be.rejected;
            }
        }
    });
    mocha_1.it('retries batchGetDocuments based on error code', async () => {
        const transactionFunction = (transaction, docRef) => {
            return transaction.get(docRef);
        };
        for (const [errorCode, retry] of Object.entries(retryBehavior)) {
            const serverError = new google_gax_1.GoogleError('Test Error');
            serverError.code = Number(errorCode);
            if (retry) {
                await runTransaction(transactionFunction, begin('foo1'), getDocument('foo1', serverError), rollback('foo1'), backoff(), begin('foo2', 'foo1'), getDocument('foo2'), commit('foo2'));
            }
            else {
                await chai_1.expect(runTransaction(transactionFunction, begin('foo1'), getDocument('foo1', serverError), rollback('foo1'))).to.eventually.be.rejected;
            }
        }
    });
    mocha_1.it('requires update function', () => {
        const overrides = {
            beginTransaction: () => Promise.reject(),
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            chai_1.expect(() => firestore.runTransaction()).to.throw('Value for argument "updateFunction" is not a valid function.');
        });
    });
    mocha_1.it('requires valid retry number', () => {
        const overrides = {
            beginTransaction: () => Promise.reject(),
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            chai_1.expect(() => firestore.runTransaction(() => Promise.resolve(), {
                maxAttempts: 'foo',
            })).to.throw('Value for argument "transactionOptions.maxAttempts" is not a valid integer.');
            chai_1.expect(() => firestore.runTransaction(() => Promise.resolve(), { maxAttempts: 0 })).to.throw('Value for argument "transactionOptions.maxAttempts" must be within [1, Infinity] inclusive, but was: 0');
        });
    });
    mocha_1.it('requires a promise', () => {
        return chai_1.expect(runTransaction((() => { }), begin(), rollback())).to.eventually.be.rejectedWith('You must return a Promise in your transaction()-callback.');
    });
    mocha_1.it('handles exception', () => {
        return helpers_1.createInstance().then(firestore => {
            firestore.request = () => {
                return Promise.reject(new Error('Expected exception'));
            };
            return chai_1.expect(firestore.runTransaction(() => {
                return Promise.resolve();
            })).to.eventually.be.rejectedWith('Expected exception');
        });
    });
    mocha_1.it("doesn't retry custom user exceptions in callback", () => {
        return chai_1.expect(runTransaction(() => {
            return Promise.reject('request exception');
        }, begin(), rollback())).to.eventually.be.rejectedWith('request exception');
    });
    mocha_1.it('limits the retry attempts', () => {
        const err = new google_gax_1.GoogleError('Server disconnect');
        err.code = google_gax_1.Status.UNAVAILABLE;
        return chai_1.expect(runTransaction(() => Promise.resolve(), begin('foo1'), commit('foo1', [], err), rollback('foo1'), backoff(), begin('foo2', 'foo1'), commit('foo2', [], err), rollback('foo2'), backoff(), begin('foo3', 'foo2'), commit('foo3', [], err), rollback('foo3'), backoff(), begin('foo4', 'foo3'), commit('foo4', [], err), rollback('foo4'), backoff(), begin('foo5', 'foo4'), commit('foo5', [], new Error('Final exception')), rollback('foo5'))).to.eventually.be.rejectedWith('Final exception');
    });
    mocha_1.it('uses maximum backoff for RESOURCE_EXHAUSTED', () => {
        const err = new google_gax_1.GoogleError('Server disconnect');
        err.code = google_gax_1.Status.RESOURCE_EXHAUSTED;
        return runTransaction(async () => { }, begin('foo1'), commit('foo1', [], err), rollback('foo1'), backoff(/* maxDelay= */ true), begin('foo2', 'foo1'), commit('foo2'));
    });
    mocha_1.it('fails on rollback', () => {
        return chai_1.expect(runTransaction(() => {
            return Promise.reject();
        }, begin(), rollback('foo', new Error('Fails on rollback')))).to.eventually.be.rejectedWith('Fails on rollback');
    });
});
mocha_1.describe('transaction operations', () => {
    mocha_1.it('support get with document ref', () => {
        return runTransaction((transaction, docRef) => {
            return transaction.get(docRef).then(doc => {
                chai_1.expect(doc.id).to.equal('documentId');
            });
        }, begin(), getDocument(), commit());
    });
    mocha_1.it('requires a query or document for get', () => {
        return runTransaction((transaction) => {
            chai_1.expect(() => transaction.get()).to.throw('Value for argument "refOrQuery" must be a DocumentReference or a Query.');
            chai_1.expect(() => transaction.get('foo')).to.throw('Value for argument "refOrQuery" must be a DocumentReference or a Query.');
            return Promise.resolve();
        }, begin(), commit());
    });
    mocha_1.it('enforce that gets come before writes', () => {
        return chai_1.expect(runTransaction((transaction, docRef) => {
            transaction.set(docRef, { foo: 'bar' });
            return transaction.get(docRef);
        }, begin(), rollback())).to.eventually.be.rejectedWith('Firestore transactions require all reads to be executed before all writes.');
    });
    mocha_1.it('support get with query', () => {
        return runTransaction((transaction, docRef) => {
            const query = docRef.parent.where('foo', '==', 'bar');
            return transaction.get(query).then(results => {
                chai_1.expect(results.docs[0].id).to.equal('documentId');
            });
        }, begin(), query(), commit());
    });
    mocha_1.it('support getAll', () => {
        return runTransaction((transaction, docRef) => {
            const firstDoc = docRef.parent.doc('firstDocument');
            const secondDoc = docRef.parent.doc('secondDocument');
            return transaction.getAll(firstDoc, secondDoc).then(docs => {
                chai_1.expect(docs.length).to.equal(2);
                chai_1.expect(docs[0].id).to.equal('firstDocument');
                chai_1.expect(docs[1].id).to.equal('secondDocument');
            });
        }, begin(), getAll(['firstDocument', 'secondDocument']), commit());
    });
    mocha_1.it('support getAll with field mask', () => {
        return runTransaction((transaction, docRef) => {
            const doc = docRef.parent.doc('doc');
            return transaction.getAll(doc, {
                fieldMask: ['a.b', new src_1.FieldPath('a.b')],
            });
        }, begin(), getAll(['doc'], ['a.b', '`a.b`']), commit());
    });
    mocha_1.it('enforce that getAll come before writes', () => {
        return chai_1.expect(runTransaction((transaction, docRef) => {
            transaction.set(docRef, { foo: 'bar' });
            return transaction.getAll(docRef);
        }, begin(), rollback())).to.eventually.be.rejectedWith('Firestore transactions require all reads to be executed before all writes.');
    });
    mocha_1.it('support create', () => {
        const create = {
            currentDocument: {
                exists: false,
            },
            update: {
                fields: {},
                name: DOCUMENT_NAME,
            },
        };
        return runTransaction((transaction, docRef) => {
            transaction.create(docRef, {});
            return Promise.resolve();
        }, begin(), commit(undefined, [create]));
    });
    mocha_1.it('support update', () => {
        const update = {
            currentDocument: {
                exists: true,
            },
            update: {
                fields: {
                    a: {
                        mapValue: {
                            fields: {
                                b: {
                                    stringValue: 'c',
                                },
                            },
                        },
                    },
                },
                name: DOCUMENT_NAME,
            },
            updateMask: {
                fieldPaths: ['a.b'],
            },
        };
        return runTransaction((transaction, docRef) => {
            transaction.update(docRef, { 'a.b': 'c' });
            transaction.update(docRef, 'a.b', 'c');
            transaction.update(docRef, new Firestore.FieldPath('a', 'b'), 'c');
            return Promise.resolve();
        }, begin(), commit(undefined, [update, update, update]));
    });
    mocha_1.it('support set', () => {
        const set = {
            update: {
                fields: {
                    'a.b': {
                        stringValue: 'c',
                    },
                },
                name: DOCUMENT_NAME,
            },
        };
        return runTransaction((transaction, docRef) => {
            transaction.set(docRef, { 'a.b': 'c' });
            return Promise.resolve();
        }, begin(), commit(undefined, [set]));
    });
    mocha_1.it('support set with merge', () => {
        const set = {
            update: {
                fields: {
                    'a.b': {
                        stringValue: 'c',
                    },
                },
                name: DOCUMENT_NAME,
            },
            updateMask: {
                fieldPaths: ['`a.b`'],
            },
        };
        return runTransaction((transaction, docRef) => {
            transaction.set(docRef, { 'a.b': 'c' }, { merge: true });
            return Promise.resolve();
        }, begin(), commit(undefined, [set]));
    });
    mocha_1.it('support set with partials and merge', () => {
        const set = {
            update: {
                fields: {
                    title: {
                        stringValue: 'story',
                    },
                },
                name: DOCUMENT_NAME,
            },
            updateMask: {
                fieldPaths: ['title'],
            },
        };
        return runTransaction((transaction, docRef) => {
            const postRef = docRef.withConverter(helpers_1.postConverterMerge);
            transaction.set(postRef, { title: 'story' }, {
                merge: true,
            });
            return Promise.resolve();
        }, begin(), commit(undefined, [set]));
    });
    mocha_1.it('support set with partials and mergeFields', () => {
        const set = {
            update: {
                fields: {
                    title: {
                        stringValue: 'story',
                    },
                },
                name: DOCUMENT_NAME,
            },
            updateMask: {
                fieldPaths: ['title'],
            },
        };
        return runTransaction((transaction, docRef) => {
            const postRef = docRef.withConverter(helpers_1.postConverter);
            transaction.set(postRef, { title: 'story', author: 'person' }, {
                mergeFields: ['title'],
            });
            return Promise.resolve();
        }, begin(), commit(undefined, [set]));
    });
    mocha_1.it('support delete', () => {
        const remove = {
            delete: DOCUMENT_NAME,
        };
        return runTransaction((transaction, docRef) => {
            transaction.delete(docRef);
            return Promise.resolve();
        }, begin(), commit(undefined, [remove]));
    });
    mocha_1.it('support multiple writes', () => {
        const remove = {
            delete: DOCUMENT_NAME,
        };
        const set = {
            update: {
                fields: {},
                name: DOCUMENT_NAME,
            },
        };
        return runTransaction((transaction, docRef) => {
            transaction.delete(docRef).set(docRef, {});
            return Promise.resolve();
        }, begin(), commit(undefined, [remove, set]));
    });
});
//# sourceMappingURL=transaction.js.map