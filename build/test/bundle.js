"use strict";
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const extend = require("extend");
const mocha_1 = require("mocha");
const src_1 = require("../src");
const helpers_1 = require("./util/helpers");
exports.TEST_BUNDLE_ID = 'test-bundle';
const TEST_BUNDLE_VERSION = 1;
function verifyMetadata(meta, createTime, totalDocuments, expectEmptyContent = false) {
    if (!expectEmptyContent) {
        chai_1.expect(meta.totalBytes).greaterThan(0);
    }
    else {
        chai_1.expect(meta.totalBytes).to.equal(0);
    }
    chai_1.expect(meta.id).to.equal(exports.TEST_BUNDLE_ID);
    chai_1.expect(meta.version).to.equal(TEST_BUNDLE_VERSION);
    chai_1.expect(meta.totalDocuments).to.equal(totalDocuments);
    chai_1.expect(meta.createTime).to.deep.equal(createTime);
}
exports.verifyMetadata = verifyMetadata;
mocha_1.describe('Bundle Buidler', () => {
    let firestore;
    mocha_1.beforeEach(() => {
        return helpers_1.createInstance().then(firestoreInstance => {
            firestore = firestoreInstance;
        });
    });
    mocha_1.afterEach(() => helpers_1.verifyInstance(firestore));
    // Tests the testing helper function bundleToElementArray works as expected.
    mocha_1.it('succeeds to read length prefixed json with testing function', async () => {
        const bundleString = '20{"a":"string value"}9{"b":123}26{"c":{"d":"nested value"}}';
        const elements = await helpers_1.bundleToElementArray(Buffer.from(bundleString));
        chai_1.expect(elements).to.deep.equal([
            { a: 'string value' },
            { b: 123 },
            { c: { d: 'nested value' } },
        ]);
    });
    mocha_1.it('succeeds with document snapshots', async () => {
        const bundle = firestore._bundle(exports.TEST_BUNDLE_ID);
        const snap1 = firestore.snapshot_({
            name: `${helpers_1.DATABASE_ROOT}/documents/collectionId/doc1`,
            fields: { foo: { stringValue: 'value' }, bar: { integerValue: 42 } },
            createTime: '1970-01-01T00:00:01.002Z',
            updateTime: '1970-01-01T00:00:03.000004Z',
        }, 
        // This should be the bundle read time.
        '2020-01-01T00:00:05.000000006Z', 'json');
        // Same document but older read time.
        const snap2 = firestore.snapshot_({
            name: `${helpers_1.DATABASE_ROOT}/documents/collectionId/doc1`,
            fields: { foo: { stringValue: 'value' }, bar: { integerValue: -42 } },
            createTime: '1970-01-01T00:00:01.002Z',
            updateTime: '1970-01-01T00:00:03.000004Z',
        }, '1970-01-01T00:00:05.000000006Z', 'json');
        bundle.add(snap1);
        bundle.add(snap2);
        // Bundle is expected to be [bundleMeta, snap2Meta, snap2] because `snap1` is newer.
        const elements = await helpers_1.bundleToElementArray(bundle.build());
        chai_1.expect(elements.length).to.equal(3);
        const meta = elements[0].metadata;
        verifyMetadata(meta, 
        // `snap1.readTime` is the bundle createTime, because it is larger than `snap2.readTime`.
        snap1.readTime.toProto().timestampValue, 1);
        // Verify doc1Meta and doc1Snap
        const docMeta = elements[1].documentMetadata;
        const docSnap = elements[2].document;
        chai_1.expect(docMeta).to.deep.equal({
            name: snap1.toDocumentProto().name,
            readTime: snap1.readTime.toProto().timestampValue,
            exists: true,
            queries: [],
        });
        chai_1.expect(docSnap).to.deep.equal(snap1.toDocumentProto());
    });
    mocha_1.it('succeeds with query snapshots', async () => {
        var _a;
        const bundle = firestore._bundle(exports.TEST_BUNDLE_ID);
        const snap = firestore.snapshot_({
            name: `${helpers_1.DATABASE_ROOT}/documents/collectionId/doc1`,
            value: 'string',
            createTime: '1970-01-01T00:00:01.002Z',
            updateTime: '1970-01-01T00:00:03.000004Z',
        }, 
        // This should be the bundle read time.
        '2020-01-01T00:00:05.000000006Z', 'json');
        const query = firestore
            .collection('collectionId')
            .where('value', '==', 'string');
        const querySnapshot = new src_1.QuerySnapshot(query, snap.readTime, 1, () => [snap], () => []);
        const newQuery = firestore.collection('collectionId');
        const newQuerySnapshot = new src_1.QuerySnapshot(newQuery, snap.readTime, 1, () => [snap], () => []);
        bundle.add('test-query', querySnapshot);
        bundle.add('test-query-new', newQuerySnapshot);
        // Bundle is expected to be [bundleMeta, namedQuery, newNamedQuery, snapMeta, snap]
        const elements = await helpers_1.bundleToElementArray(bundle.build());
        chai_1.expect(elements.length).to.equal(5);
        const meta = elements[0].metadata;
        verifyMetadata(meta, 
        // `snap.readTime` is the bundle createTime, because it is larger than `snap2.readTime`.
        snap.readTime.toProto().timestampValue, 1);
        // Verify named query
        const namedQuery = elements.find(e => { var _a; return ((_a = e.namedQuery) === null || _a === void 0 ? void 0 : _a.name) === 'test-query'; })
            .namedQuery;
        const newNamedQuery = elements.find(e => { var _a; return ((_a = e.namedQuery) === null || _a === void 0 ? void 0 : _a.name) === 'test-query-new'; }).namedQuery;
        chai_1.expect(namedQuery).to.deep.equal({
            name: 'test-query',
            readTime: snap.readTime.toProto().timestampValue,
            bundledQuery: extend(true, {}, {
                parent: query.toProto().parent,
                structuredQuery: query.toProto().structuredQuery,
            }),
        });
        chai_1.expect(newNamedQuery).to.deep.equal({
            name: 'test-query-new',
            readTime: snap.readTime.toProto().timestampValue,
            bundledQuery: extend(true, {}, {
                parent: newQuery.toProto().parent,
                structuredQuery: newQuery.toProto().structuredQuery,
            }),
        });
        // Verify docMeta and docSnap
        const docMeta = elements[3].documentMetadata;
        const docSnap = elements[4].document;
        (_a = docMeta === null || docMeta === void 0 ? void 0 : docMeta.queries) === null || _a === void 0 ? void 0 : _a.sort();
        chai_1.expect(docMeta).to.deep.equal({
            name: snap.toDocumentProto().name,
            readTime: snap.readTime.toProto().timestampValue,
            exists: true,
            queries: ['test-query', 'test-query-new'],
        });
        chai_1.expect(docSnap).to.deep.equal(snap.toDocumentProto());
    });
    mocha_1.it('succeeds with multiple calls to build()', async () => {
        const bundle = firestore._bundle(exports.TEST_BUNDLE_ID);
        const snap1 = firestore.snapshot_({
            name: `${helpers_1.DATABASE_ROOT}/documents/collectionId/doc1`,
            fields: { foo: { stringValue: 'value' }, bar: { integerValue: 42 } },
            createTime: '1970-01-01T00:00:01.002Z',
            updateTime: '1970-01-01T00:00:03.000004Z',
        }, 
        // This should be the bundle read time.
        '2020-01-01T00:00:05.000000006Z', 'json');
        bundle.add(snap1);
        // Bundle is expected to be [bundleMeta, doc1Meta, doc1Snap].
        const elements = await helpers_1.bundleToElementArray(bundle.build());
        chai_1.expect(elements.length).to.equal(3);
        const meta = elements[0].metadata;
        verifyMetadata(meta, 
        // `snap1.readTime` is the bundle createTime, because it is larger than `snap2.readTime`.
        snap1.readTime.toProto().timestampValue, 1);
        // Verify doc1Meta and doc1Snap
        const doc1Meta = elements[1].documentMetadata;
        const doc1Snap = elements[2].document;
        chai_1.expect(doc1Meta).to.deep.equal({
            name: snap1.toDocumentProto().name,
            readTime: snap1.readTime.toProto().timestampValue,
            exists: true,
            queries: [],
        });
        chai_1.expect(doc1Snap).to.deep.equal(snap1.toDocumentProto());
        // Add another document
        const snap2 = firestore.snapshot_({
            name: `${helpers_1.DATABASE_ROOT}/documents/collectionId/doc2`,
            fields: { foo: { stringValue: 'value' }, bar: { integerValue: -42 } },
            createTime: '1970-01-01T00:00:01.002Z',
            updateTime: '1970-01-01T00:00:03.000004Z',
        }, '1970-01-01T00:00:05.000000006Z', 'json');
        bundle.add(snap2);
        // Bundle is expected to be [bundleMeta, doc1Meta, doc1Snap, doc2Meta, doc2Snap].
        const newElements = await helpers_1.bundleToElementArray(bundle.build());
        chai_1.expect(newElements.length).to.equal(5);
        const newMeta = newElements[0].metadata;
        verifyMetadata(newMeta, 
        // `snap1.readTime` is the bundle createTime, because it is larger than `snap2.readTime`.
        snap1.readTime.toProto().timestampValue, 2);
        chai_1.expect(newElements.slice(1, 3)).to.deep.equal(elements.slice(1));
        // Verify doc2Meta and doc2Snap
        const doc2Meta = newElements[3].documentMetadata;
        const doc2Snap = newElements[4].document;
        chai_1.expect(doc2Meta).to.deep.equal({
            name: snap2.toDocumentProto().name,
            readTime: snap2.readTime.toProto().timestampValue,
            exists: true,
            queries: [],
        });
        chai_1.expect(doc2Snap).to.deep.equal(snap2.toDocumentProto());
    });
    mocha_1.it('succeeds when nothing is added', async () => {
        const bundle = firestore._bundle(exports.TEST_BUNDLE_ID);
        // `elements` is expected to be [bundleMeta].
        const elements = await helpers_1.bundleToElementArray(bundle.build());
        chai_1.expect(elements.length).to.equal(1);
        const meta = elements[0].metadata;
        verifyMetadata(meta, new src_1.Timestamp(0, 0).toProto().timestampValue, 0, true);
    });
});
//# sourceMappingURL=bundle.js.map