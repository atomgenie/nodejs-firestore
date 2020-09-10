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
const google_gax_1 = require("google-gax");
const src_1 = require("../src");
const backoff_1 = require("../src/backoff");
const util_1 = require("../src/util");
const helpers_1 = require("./util/helpers");
// Change the argument to 'console.log' to enable debug output.
src_1.setLogFunction(() => { });
const PROJECT_ID = 'test-project';
mocha_1.describe('BulkWriter', () => {
    let firestore;
    let requestCounter;
    let opCount;
    let activeRequestDeferred;
    let activeRequestCounter = 0;
    let timeoutHandlerCounter = 0;
    mocha_1.beforeEach(() => {
        activeRequestDeferred = new util_1.Deferred();
        requestCounter = 0;
        opCount = 0;
        timeoutHandlerCounter = 0;
        backoff_1.setTimeoutHandler((fn, timeout) => {
            // Since a call to the backoff is made before each batchWrite, only
            // increment the counter if the timeout is non-zero, which indicates a
            // retry from an error.
            if (timeout > 0) {
                timeoutHandlerCounter++;
            }
            fn();
        });
    });
    function incrementOpCount() {
        opCount++;
    }
    function verifyOpCount(expected) {
        chai_1.expect(opCount).to.equal(expected);
    }
    function setOp(doc, value) {
        return helpers_1.set({
            document: helpers_1.document(doc, 'foo', value),
        }).writes[0];
    }
    function updateOp(doc, value) {
        return helpers_1.update({
            document: helpers_1.document(doc, 'foo', value),
            mask: helpers_1.updateMask('foo'),
        }).writes[0];
    }
    function createOp(doc, value) {
        return helpers_1.create({
            document: helpers_1.document(doc, 'foo', value),
        }).writes[0];
    }
    function deleteOp(doc) {
        return helpers_1.remove(doc).writes[0];
    }
    function createRequest(requests) {
        return {
            writes: requests,
        };
    }
    function successResponse(updateTimeSeconds) {
        return {
            writeResults: [
                {
                    updateTime: {
                        nanos: 0,
                        seconds: updateTimeSeconds,
                    },
                },
            ],
            status: [{ code: google_gax_1.Status.OK }],
        };
    }
    function failedResponse(code = google_gax_1.Status.DEADLINE_EXCEEDED) {
        return {
            writeResults: [
                {
                    updateTime: null,
                },
            ],
            status: [{ code }],
        };
    }
    function mergeResponses(responses) {
        return {
            writeResults: responses.map(v => v.writeResults[0]),
            status: responses.map(v => v.status[0]),
        };
    }
    /**
     * Creates an instance with the mocked objects.
     *
     * @param enforceSingleConcurrentRequest Whether to check that there is only
     * one active request at a time. If true, the `activeRequestDeferred` must be
     * manually resolved for the response to return.
     */
    function instantiateInstance(mock, enforceSingleConcurrentRequest = false) {
        const overrides = {
            batchWrite: async (request, options) => {
                chai_1.expect(options.retry.retryCodes).contains(google_gax_1.Status.ABORTED);
                chai_1.expect(request).to.deep.eq({
                    database: `projects/${PROJECT_ID}/databases/(default)`,
                    writes: mock[requestCounter].request.writes,
                });
                if (enforceSingleConcurrentRequest) {
                    activeRequestCounter++;
                    // This expect statement is used to test that only one request is
                    // made at a time.
                    chai_1.expect(activeRequestCounter).to.equal(1);
                    await activeRequestDeferred.promise;
                    activeRequestCounter--;
                }
                const responsePromise = helpers_1.response({
                    writeResults: mock[requestCounter].response.writeResults,
                    status: mock[requestCounter].response.status,
                });
                requestCounter++;
                return responsePromise;
            },
        };
        return helpers_1.createInstance(overrides).then(firestoreClient => {
            firestore = firestoreClient;
            return firestore.bulkWriter();
        });
    }
    mocha_1.afterEach(() => {
        helpers_1.verifyInstance(firestore);
        chai_1.expect(timeoutHandlerCounter).to.equal(0);
        backoff_1.setTimeoutHandler(setTimeout);
    });
    mocha_1.it('has a set() method', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc', 'bar')]),
                response: successResponse(2),
            },
        ]);
        const doc = firestore.doc('collectionId/doc');
        let writeResult;
        bulkWriter.set(doc, { foo: 'bar' }).then(result => {
            incrementOpCount();
            writeResult = result;
        });
        return bulkWriter.close().then(async () => {
            verifyOpCount(1);
            chai_1.expect(writeResult.writeTime.isEqual(new src_1.Timestamp(2, 0))).to.be.true;
        });
    });
    mocha_1.it('has an update() method', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([updateOp('doc', 'bar')]),
                response: successResponse(2),
            },
        ]);
        const doc = firestore.doc('collectionId/doc');
        let writeResult;
        bulkWriter.update(doc, { foo: 'bar' }).then(result => {
            incrementOpCount();
            writeResult = result;
        });
        return bulkWriter.close().then(async () => {
            verifyOpCount(1);
            chai_1.expect(writeResult.writeTime.isEqual(new src_1.Timestamp(2, 0))).to.be.true;
        });
    });
    mocha_1.it('has a delete() method', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([deleteOp('doc')]),
                response: successResponse(2),
            },
        ]);
        const doc = firestore.doc('collectionId/doc');
        let writeResult;
        bulkWriter.delete(doc).then(result => {
            incrementOpCount();
            writeResult = result;
        });
        return bulkWriter.close().then(async () => {
            verifyOpCount(1);
            chai_1.expect(writeResult.writeTime.isEqual(new src_1.Timestamp(2, 0))).to.be.true;
        });
    });
    mocha_1.it('has a create() method', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([createOp('doc', 'bar')]),
                response: successResponse(2),
            },
        ]);
        const doc = firestore.doc('collectionId/doc');
        let writeResult;
        bulkWriter.create(doc, { foo: 'bar' }).then(result => {
            incrementOpCount();
            writeResult = result;
        });
        return bulkWriter.close().then(async () => {
            verifyOpCount(1);
            chai_1.expect(writeResult.writeTime.isEqual(new src_1.Timestamp(2, 0))).to.be.true;
        });
    });
    mocha_1.it('surfaces errors', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc', 'bar')]),
                response: failedResponse(),
            },
        ]);
        const doc = firestore.doc('collectionId/doc');
        bulkWriter.set(doc, { foo: 'bar' }).catch(err => {
            incrementOpCount();
            chai_1.expect(err.code).to.equal(google_gax_1.Status.DEADLINE_EXCEEDED);
        });
        return bulkWriter.close().then(async () => verifyOpCount(1));
    });
    mocha_1.it('flush() resolves immediately if there are no writes', async () => {
        const bulkWriter = await instantiateInstance([]);
        return bulkWriter.flush().then(() => verifyOpCount(0));
    });
    mocha_1.it('adds writes to a new batch after calling flush()', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([createOp('doc', 'bar')]),
                response: successResponse(2),
            },
            {
                request: createRequest([setOp('doc2', 'bar1')]),
                response: successResponse(2),
            },
        ]);
        bulkWriter
            .create(firestore.doc('collectionId/doc'), { foo: 'bar' })
            .then(incrementOpCount);
        bulkWriter.flush();
        bulkWriter
            .set(firestore.doc('collectionId/doc2'), { foo: 'bar1' })
            .then(incrementOpCount);
        await bulkWriter.close().then(async () => {
            verifyOpCount(2);
        });
    });
    mocha_1.it('close() sends all writes', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([createOp('doc', 'bar')]),
                response: successResponse(2),
            },
        ]);
        const doc = firestore.doc('collectionId/doc');
        bulkWriter.create(doc, { foo: 'bar' }).then(incrementOpCount);
        return bulkWriter.close().then(async () => {
            verifyOpCount(1);
        });
    });
    mocha_1.it('close() resolves immediately if there are no writes', async () => {
        const bulkWriter = await instantiateInstance([]);
        return bulkWriter.close().then(() => verifyOpCount(0));
    });
    mocha_1.it('cannot call methods after close() is called', async () => {
        const bulkWriter = await instantiateInstance([]);
        const expected = 'BulkWriter has already been closed.';
        const doc = firestore.doc('collectionId/doc');
        await bulkWriter.close();
        chai_1.expect(() => bulkWriter.set(doc, {})).to.throw(expected);
        chai_1.expect(() => bulkWriter.create(doc, {})).to.throw(expected);
        chai_1.expect(() => bulkWriter.update(doc, {})).to.throw(expected);
        chai_1.expect(() => bulkWriter.delete(doc)).to.throw(expected);
        chai_1.expect(bulkWriter.flush()).to.eventually.be.rejectedWith(expected);
        chai_1.expect(() => bulkWriter.close()).to.throw(expected);
    });
    mocha_1.it('sends writes to the same document in separate batches', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc', 'bar')]),
                response: successResponse(1),
            },
            {
                request: createRequest([updateOp('doc', 'bar1')]),
                response: successResponse(2),
            },
        ]);
        // Create two document references pointing to the same document.
        const doc = firestore.doc('collectionId/doc');
        const doc2 = firestore.doc('collectionId/doc');
        bulkWriter.set(doc, { foo: 'bar' }).then(incrementOpCount);
        bulkWriter.update(doc2, { foo: 'bar1' }).then(incrementOpCount);
        return bulkWriter.close().then(async () => {
            verifyOpCount(2);
        });
    });
    mocha_1.it('sends writes to different documents in the same batch', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc1', 'bar'), updateOp('doc2', 'bar')]),
                response: mergeResponses([successResponse(1), successResponse(2)]),
            },
        ]);
        const doc1 = firestore.doc('collectionId/doc1');
        const doc2 = firestore.doc('collectionId/doc2');
        bulkWriter.set(doc1, { foo: 'bar' }).then(incrementOpCount);
        bulkWriter.update(doc2, { foo: 'bar' }).then(incrementOpCount);
        return bulkWriter.close().then(async () => {
            verifyOpCount(2);
        });
    });
    mocha_1.it('splits into multiple batches after exceeding maximum batch size', async () => {
        const arrayRange = Array.from(new Array(6), (_, i) => i);
        const requests = arrayRange.map(i => setOp('doc' + i, 'bar'));
        const responses = arrayRange.map(i => successResponse(i));
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([requests[0], requests[1]]),
                response: mergeResponses([responses[0], responses[1]]),
            },
            {
                request: createRequest([requests[2], requests[3]]),
                response: mergeResponses([responses[2], responses[3]]),
            },
            {
                request: createRequest([requests[4], requests[5]]),
                response: mergeResponses([responses[4], responses[5]]),
            },
        ]);
        bulkWriter._setMaxBatchSize(2);
        for (let i = 0; i < 6; i++) {
            bulkWriter
                .set(firestore.doc('collectionId/doc' + i), { foo: 'bar' })
                .then(incrementOpCount);
        }
        return bulkWriter.close().then(async () => {
            verifyOpCount(6);
        });
    });
    mocha_1.it('sends existing batches when a new batch is created', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc', 'bar')]),
                response: successResponse(1),
            },
            {
                request: createRequest([
                    updateOp('doc', 'bar1'),
                    createOp('doc2', 'bar1'),
                ]),
                response: mergeResponses([successResponse(1), successResponse(2)]),
            },
        ]);
        bulkWriter._setMaxBatchSize(2);
        const doc = firestore.doc('collectionId/doc');
        const doc2 = firestore.doc('collectionId/doc2');
        // Create a new batch by writing to the same document.
        const setPromise = bulkWriter.set(doc, { foo: 'bar' }).then(incrementOpCount);
        const updatePromise = bulkWriter
            .update(doc, { foo: 'bar1' })
            .then(incrementOpCount);
        await setPromise;
        // Create a new batch by reaching the batch size limit.
        const createPromise = bulkWriter
            .create(doc2, { foo: 'bar1' })
            .then(incrementOpCount);
        await updatePromise;
        await createPromise;
        verifyOpCount(3);
        return bulkWriter.close();
    });
    mocha_1.it('sends batches automatically when the batch size limit is reached', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([
                    setOp('doc1', 'bar'),
                    updateOp('doc2', 'bar'),
                    createOp('doc3', 'bar'),
                ]),
                response: mergeResponses([
                    successResponse(1),
                    successResponse(2),
                    successResponse(3),
                ]),
            },
            {
                request: createRequest([deleteOp('doc4')]),
                response: successResponse(3),
            },
        ]);
        bulkWriter._setMaxBatchSize(3);
        const promise1 = bulkWriter
            .set(firestore.doc('collectionId/doc1'), { foo: 'bar' })
            .then(incrementOpCount);
        const promise2 = bulkWriter
            .update(firestore.doc('collectionId/doc2'), { foo: 'bar' })
            .then(incrementOpCount);
        const promise3 = bulkWriter
            .create(firestore.doc('collectionId/doc3'), { foo: 'bar' })
            .then(incrementOpCount);
        // The 4th write should not sent because it should be in a new batch.
        bulkWriter
            .delete(firestore.doc('collectionId/doc4'))
            .then(incrementOpCount);
        await Promise.all([promise1, promise2, promise3]).then(() => {
            verifyOpCount(3);
        });
        return bulkWriter.close().then(async () => {
            verifyOpCount(4);
        });
    });
    mocha_1.it('uses timeout for batches that exceed the rate limit', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc1', 'bar'), setOp('doc2', 'bar')]),
                response: mergeResponses([successResponse(1), successResponse(2)]),
            },
            {
                request: createRequest([setOp('doc1', 'bar')]),
                response: successResponse(3),
            },
        ], 
        /* enforceSingleConcurrentRequest= */ true);
        bulkWriter.set(firestore.doc('collectionId/doc1'), { foo: 'bar' });
        bulkWriter.set(firestore.doc('collectionId/doc2'), { foo: 'bar' });
        const flush1 = bulkWriter.flush();
        // The third write will be placed in a new batch
        bulkWriter.set(firestore.doc('collectionId/doc1'), { foo: 'bar' });
        const flush2 = bulkWriter.flush();
        activeRequestDeferred.resolve();
        await flush1;
        await flush2;
        return bulkWriter.close();
    });
    mocha_1.it('supports different type converters', async () => {
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([setOp('doc1', 'boo'), setOp('doc2', 'moo')]),
                response: mergeResponses([successResponse(1), successResponse(2)]),
            },
        ]);
        class Boo {
        }
        const booConverter = {
            toFirestore() {
                return { foo: 'boo' };
            },
            fromFirestore() {
                return new Boo();
            },
        };
        class Moo {
        }
        const mooConverter = {
            toFirestore() {
                return { foo: 'moo' };
            },
            fromFirestore() {
                return new Moo();
            },
        };
        const doc1 = firestore.doc('collectionId/doc1').withConverter(booConverter);
        const doc2 = firestore.doc('collectionId/doc2').withConverter(mooConverter);
        bulkWriter.set(doc1, new Boo()).then(incrementOpCount);
        bulkWriter.set(doc2, new Moo()).then(incrementOpCount);
        return bulkWriter.close().then(() => verifyOpCount(2));
    });
    mocha_1.it('retries individual rites that fail with ABORTED errors', async () => {
        backoff_1.setTimeoutHandler(setImmediate);
        // Create mock responses that simulate one successful write followed by
        // failed responses.
        const bulkWriter = await instantiateInstance([
            {
                request: createRequest([
                    setOp('doc1', 'bar'),
                    setOp('doc2', 'bar'),
                    setOp('doc3', 'bar'),
                ]),
                response: mergeResponses([
                    failedResponse(),
                    failedResponse(google_gax_1.Status.UNAVAILABLE),
                    failedResponse(google_gax_1.Status.ABORTED),
                ]),
            },
            {
                request: createRequest([setOp('doc2', 'bar'), setOp('doc3', 'bar')]),
                response: mergeResponses([
                    successResponse(2),
                    failedResponse(google_gax_1.Status.ABORTED),
                ]),
            },
            {
                request: createRequest([setOp('doc3', 'bar')]),
                response: mergeResponses([successResponse(3)]),
            },
        ]);
        bulkWriter
            .set(firestore.doc('collectionId/doc1'), {
            foo: 'bar',
        })
            .catch(incrementOpCount);
        const set2 = bulkWriter.set(firestore.doc('collectionId/doc2'), {
            foo: 'bar',
        });
        const set3 = bulkWriter.set(firestore.doc('collectionId/doc3'), {
            foo: 'bar',
        });
        await bulkWriter.close();
        chai_1.expect((await set2).writeTime).to.deep.equal(new src_1.Timestamp(2, 0));
        chai_1.expect((await set3).writeTime).to.deep.equal(new src_1.Timestamp(3, 0));
        // Check that set1 was not retried
        verifyOpCount(1);
    });
    mocha_1.describe('Timeout handler tests', () => {
        // Return success responses for all requests.
        function instantiateInstance() {
            const overrides = {
                batchWrite: request => {
                    var _a;
                    const requestLength = ((_a = request.writes) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    const responses = mergeResponses(Array.from(new Array(requestLength), (_, i) => successResponse(i)));
                    return helpers_1.response({
                        writeResults: responses.writeResults,
                        status: responses.status,
                    });
                },
            };
            return helpers_1.createInstance(overrides).then(firestoreClient => {
                firestore = firestoreClient;
                return firestore.bulkWriter();
            });
        }
        mocha_1.it('does not send batches if doing so exceeds the rate limit', done => {
            instantiateInstance().then(bulkWriter => {
                let timeoutCalled = false;
                backoff_1.setTimeoutHandler((_, timeout) => {
                    if (!timeoutCalled && timeout > 0) {
                        timeoutCalled = true;
                        done();
                    }
                });
                for (let i = 0; i < 600; i++) {
                    bulkWriter.set(firestore.doc('collectionId/doc' + i), { foo: 'bar' });
                }
                // The close() promise will never resolve. Since we do not call the
                // callback function in the overridden handler, subsequent requests
                // after the timeout will not be made. The close() call is used to
                // ensure that the final batch is sent.
                bulkWriter.close();
            });
        });
    });
    mocha_1.it('retries batchWrite when the RPC fails with retryable error', async () => {
        backoff_1.setTimeoutHandler(setImmediate);
        let retryAttempts = 0;
        function instantiateInstance() {
            const overrides = {
                batchWrite: () => {
                    retryAttempts++;
                    if (retryAttempts < 5) {
                        const error = new google_gax_1.GoogleError('Mock batchWrite failed in test');
                        error.code = google_gax_1.Status.ABORTED;
                        throw error;
                    }
                    else {
                        const mockResponse = successResponse(1);
                        return helpers_1.response({
                            writeResults: mockResponse.writeResults,
                            status: mockResponse.status,
                        });
                    }
                },
            };
            return helpers_1.createInstance(overrides).then(firestoreClient => {
                firestore = firestoreClient;
                return firestore.bulkWriter();
            });
        }
        const bulkWriter = await instantiateInstance();
        let writeResult;
        bulkWriter
            .create(firestore.doc('collectionId/doc'), {
            foo: 'bar',
        })
            .then(result => {
            incrementOpCount();
            writeResult = result;
        });
        return bulkWriter.close().then(async () => {
            chai_1.expect(writeResult.writeTime.isEqual(new src_1.Timestamp(1, 0))).to.be.true;
        });
    });
    mocha_1.it('fails writes after all retry attempts failed', async () => {
        backoff_1.setTimeoutHandler(setImmediate);
        function instantiateInstance() {
            const overrides = {
                batchWrite: () => {
                    const error = new google_gax_1.GoogleError('Mock batchWrite failed in test');
                    error.code = google_gax_1.Status.ABORTED;
                    throw error;
                },
            };
            return helpers_1.createInstance(overrides).then(firestoreClient => {
                firestore = firestoreClient;
                return firestore.bulkWriter();
            });
        }
        const bulkWriter = await instantiateInstance();
        bulkWriter
            .create(firestore.doc('collectionId/doc'), {
            foo: 'bar',
        })
            .catch(err => {
            chai_1.expect(err instanceof google_gax_1.GoogleError && err.code === google_gax_1.Status.ABORTED).to.be
                .true;
            incrementOpCount();
        });
        return bulkWriter.close().then(() => verifyOpCount(1));
    });
    mocha_1.describe('if bulkCommit() fails', async () => {
        function instantiateInstance() {
            const overrides = {
                batchWrite: () => {
                    throw new Error('Mock batchWrite failed in test');
                },
            };
            return helpers_1.createInstance(overrides).then(firestoreClient => {
                firestore = firestoreClient;
                return firestore.bulkWriter();
            });
        }
        mocha_1.it('flush() should not fail', async () => {
            const bulkWriter = await instantiateInstance();
            bulkWriter
                .create(firestore.doc('collectionId/doc'), { foo: 'bar' })
                .catch(incrementOpCount);
            bulkWriter
                .set(firestore.doc('collectionId/doc2'), { foo: 'bar' })
                .catch(incrementOpCount);
            await bulkWriter.flush();
            verifyOpCount(2);
            return bulkWriter.close();
        });
        mocha_1.it('close() should not fail', async () => {
            const bulkWriter = await instantiateInstance();
            bulkWriter
                .create(firestore.doc('collectionId/doc'), { foo: 'bar' })
                .catch(incrementOpCount);
            bulkWriter
                .set(firestore.doc('collectionId/doc2'), { foo: 'bar' })
                .catch(incrementOpCount);
            return bulkWriter.close().then(() => verifyOpCount(2));
        });
        mocha_1.it('all individual writes are rejected', async () => {
            const bulkWriter = await instantiateInstance();
            bulkWriter
                .create(firestore.doc('collectionId/doc'), { foo: 'bar' })
                .catch(err => {
                chai_1.expect(err.message).to.equal('Mock batchWrite failed in test');
                incrementOpCount();
            });
            bulkWriter
                .set(firestore.doc('collectionId/doc2'), { foo: 'bar' })
                .catch(err => {
                chai_1.expect(err.message).to.equal('Mock batchWrite failed in test');
                incrementOpCount();
            });
            return bulkWriter.close().then(() => verifyOpCount(2));
        });
    });
});
//# sourceMappingURL=bulk-writer.js.map