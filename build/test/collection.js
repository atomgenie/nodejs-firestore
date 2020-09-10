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
const through2 = require("through2");
const src_1 = require("../src");
const helpers_1 = require("./util/helpers");
// Change the argument to 'console.log' to enable debug output.
src_1.setLogFunction(() => { });
mocha_1.describe('Collection interface', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    mocha_1.it('has doc() method', () => {
        const collectionRef = firestore.collection('colId');
        chai_1.expect(collectionRef.doc);
        let documentRef = collectionRef.doc('docId');
        chai_1.expect(documentRef).to.be.an.instanceOf(src_1.DocumentReference);
        chai_1.expect(collectionRef.id).to.equal('colId');
        chai_1.expect(documentRef.id).to.equal('docId');
        chai_1.expect(() => collectionRef.doc(false)).to.throw('Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.');
        chai_1.expect(() => collectionRef.doc(null)).to.throw('Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.');
        chai_1.expect(() => collectionRef.doc('')).to.throw('Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.');
        chai_1.expect(() => collectionRef.doc(undefined)).to.throw('Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.');
        chai_1.expect(() => collectionRef.doc('doc/coll')).to.throw('Value for argument "documentPath" must point to a document, but was "doc/coll". Your path does not contain an even number of components.');
        documentRef = collectionRef.doc('docId/colId/docId');
        chai_1.expect(documentRef).to.be.an.instanceOf(src_1.DocumentReference);
    });
    mocha_1.it('has parent() method', () => {
        const collection = firestore.collection('col1/doc/col2');
        chai_1.expect(collection.path).to.equal('col1/doc/col2');
        const document = collection.parent;
        chai_1.expect(document.path).to.equal('col1/doc');
    });
    mocha_1.it('parent() returns null for root', () => {
        const collection = firestore.collection('col1');
        chai_1.expect(collection.parent).to.equal(null);
    });
    mocha_1.it('supports auto-generated ids', () => {
        const collectionRef = firestore.collection('collectionId');
        const documentRef = collectionRef.doc();
        chai_1.expect(documentRef).to.be.an.instanceOf(src_1.DocumentReference);
        chai_1.expect(collectionRef.id).to.equal('collectionId');
        chai_1.expect(documentRef.id).to.have.length(20);
    });
    mocha_1.it('has add() method', () => {
        const overrides = {
            commit: request => {
                // Verify that the document name uses an auto-generated id.
                const docIdRe = /^projects\/test-project\/databases\/\(default\)\/documents\/collectionId\/[a-zA-Z0-9]{20}$/;
                chai_1.expect(request.writes[0].update.name).to.match(docIdRe);
                delete request.writes[0].update.name;
                // Verify that the rest of the protobuf matches.
                chai_1.expect(request).to.deep.equal({
                    database: helpers_1.DATABASE_ROOT,
                    writes: [
                        {
                            update: {
                                fields: {},
                            },
                            currentDocument: {
                                exists: false,
                            },
                        },
                    ],
                });
                return helpers_1.response({
                    commitTime: {
                        nanos: 0,
                        seconds: 0,
                    },
                    writeResults: [
                        {
                            updateTime: {
                                nanos: 0,
                                seconds: 0,
                            },
                        },
                    ],
                });
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            const collectionRef = firestore.collection('collectionId');
            const promise = collectionRef.add({});
            chai_1.expect(promise).to.be.an.instanceOf(Promise);
            return promise.then(documentRef => {
                chai_1.expect(documentRef).to.be.an.instanceOf(src_1.DocumentReference);
                chai_1.expect(collectionRef.id).to.equal('collectionId');
                chai_1.expect(documentRef.id).to.have.length(20);
            });
        });
    });
    mocha_1.it('has list() method', () => {
        const overrides = {
            listDocuments: request => {
                chai_1.expect(request).to.deep.eq({
                    parent: `${helpers_1.DATABASE_ROOT}/documents/a/b`,
                    collectionId: 'c',
                    showMissing: true,
                    pageSize: 4294967295,
                    mask: { fieldPaths: [] },
                });
                return helpers_1.response([helpers_1.document('first'), helpers_1.document('second')]);
            },
        };
        return helpers_1.createInstance(overrides).then(firestore => {
            return firestore
                .collection('a/b/c')
                .listDocuments()
                .then(documentRefs => {
                chai_1.expect(documentRefs[0].id).to.equal('first');
                chai_1.expect(documentRefs[1].id).to.equal('second');
            });
        });
    });
    mocha_1.it('has isEqual() method', () => {
        const coll1 = firestore.collection('coll1');
        const coll1Equals = firestore.collection('coll1');
        const coll2 = firestore.collection('coll2');
        chai_1.expect(coll1.isEqual(coll1Equals)).to.be.ok;
        chai_1.expect(coll1.isEqual(coll2)).to.not.be.ok;
    });
    mocha_1.it('for CollectionReference.withConverter().doc()', async () => {
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
                .withConverter(helpers_1.postConverter)
                .doc('documentId');
            await docRef.set(new helpers_1.Post('post', 'author'));
            const postData = await docRef.get();
            const post = postData.data();
            chai_1.expect(post).to.not.be.undefined;
            chai_1.expect(post.toString()).to.equal('post, by author');
        });
    });
    mocha_1.it('for CollectionReference.withConverter().add()', async () => {
        let doc = helpers_1.document('dummy');
        const overrides = {
            commit: request => {
                // Extract the auto-generated document ID.
                const docId = request.writes[0].update.name;
                const docIdSplit = docId.split('/');
                doc = helpers_1.document(docIdSplit[docIdSplit.length - 1], 'author', 'author', 'title', 'post');
                chai_1.expect(request).to.deep.equal({
                    database: helpers_1.DATABASE_ROOT,
                    writes: [
                        {
                            update: {
                                fields: {
                                    author: {
                                        stringValue: 'author',
                                    },
                                    title: {
                                        stringValue: 'post',
                                    },
                                },
                                name: docId,
                            },
                            currentDocument: {
                                exists: false,
                            },
                        },
                    ],
                });
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
            const docRef = await firestore
                .collection('collectionId')
                .withConverter(helpers_1.postConverter)
                .add(new helpers_1.Post('post', 'author'));
            const postData = await docRef.get();
            const post = postData.data();
            chai_1.expect(post).to.not.be.undefined;
            chai_1.expect(post.toString()).to.equal('post, by author');
        });
    });
    mocha_1.it('drops the converter when calling CollectionReference<T>.parent()', () => {
        return helpers_1.createInstance().then(async (firestore) => {
            const postsCollection = firestore
                .collection('users/user1/posts')
                .withConverter(helpers_1.postConverter);
            const usersCollection = postsCollection.parent;
            chai_1.expect(usersCollection.isEqual(firestore.doc('users/user1'))).to.be.true;
        });
    });
});
//# sourceMappingURL=collection.js.map