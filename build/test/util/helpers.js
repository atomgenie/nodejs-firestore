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
const chai_1 = require("chai");
const extend = require("extend");
const google_gax_1 = require("google-gax");
const length_prefixed_json_stream_1 = require("length-prefixed-json-stream");
const stream_1 = require("stream");
const through2 = require("through2");
const v1 = require("../../src/v1");
const src_1 = require("../../src");
const pool_1 = require("../../src/pool");
const SSL_CREDENTIALS = google_gax_1.grpc.credentials.createInsecure();
exports.PROJECT_ID = 'test-project';
exports.DATABASE_ROOT = `projects/${exports.PROJECT_ID}/databases/(default)`;
exports.COLLECTION_ROOT = `${exports.DATABASE_ROOT}/documents/collectionId`;
exports.DOCUMENT_NAME = `${exports.COLLECTION_ROOT}/documentId`;
/**
 * Creates a new Firestore instance for testing. Request handlers can be
 * overridden by providing `apiOverrides`.
 *
 * @param apiOverrides An object with request handlers to override.
 * @param firestoreSettings Firestore Settings to configure the client.
 * @return A Promise that resolves with the new Firestore client.
 */
function createInstance(apiOverrides, firestoreSettings) {
    const initializationOptions = {
        ...{ projectId: exports.PROJECT_ID, sslCreds: SSL_CREDENTIALS },
        ...firestoreSettings,
    };
    const firestore = new src_1.Firestore();
    firestore.settings(initializationOptions);
    firestore['_clientPool'] = new pool_1.ClientPool(
    /* concurrentRequestLimit= */ 1, 
    /* maxIdleClients= */ 0, () => ({
        ...new v1.FirestoreClient(initializationOptions),
        ...apiOverrides,
    }) // eslint-disable-line @typescript-eslint/no-explicit-any
    );
    return Promise.resolve(firestore);
}
exports.createInstance = createInstance;
/**
 * Verifies that all streams have been properly shutdown at the end of a test
 * run.
 */
function verifyInstance(firestore) {
    // Allow the setTimeout() call in _initializeStream to run before
    // verifying that all operations have finished executing.
    return new Promise(resolve => {
        setTimeout(() => {
            chai_1.expect(firestore['_clientPool'].opCount).to.equal(0);
            resolve();
        }, 10);
    });
}
exports.verifyInstance = verifyInstance;
function write(document, mask, transforms, precondition) {
    const writes = [];
    const update = Object.assign({}, document);
    delete update.updateTime;
    delete update.createTime;
    writes.push({ update });
    if (mask) {
        writes[0].updateMask = mask;
    }
    if (transforms) {
        writes[0].updateTransforms = transforms;
    }
    if (precondition) {
        writes[0].currentDocument = precondition;
    }
    return { writes };
}
function updateMask(...fieldPaths) {
    return fieldPaths.length === 0 ? {} : { fieldPaths };
}
exports.updateMask = updateMask;
function set(opts) {
    return write(opts.document, opts.mask || null, opts.transforms || null, 
    /* precondition= */ null);
}
exports.set = set;
function update(opts) {
    const precondition = opts.precondition || { exists: true };
    const mask = opts.mask || updateMask();
    return write(opts.document, mask, opts.transforms || null, precondition);
}
exports.update = update;
function create(opts) {
    return write(opts.document, /* updateMask= */ null, opts.transforms || null, {
        exists: false,
    });
}
exports.create = create;
function value(value) {
    if (typeof value === 'string') {
        return {
            stringValue: value,
        };
    }
    else {
        return value;
    }
}
function retrieve(id) {
    return { documents: [`${exports.DATABASE_ROOT}/documents/collectionId/${id}`] };
}
exports.retrieve = retrieve;
function remove(id, precondition) {
    const writes = [
        { delete: `${exports.DATABASE_ROOT}/documents/collectionId/${id}` },
    ];
    if (precondition) {
        writes[0].currentDocument = precondition;
    }
    return { writes };
}
exports.remove = remove;
function found(dataOrId) {
    return {
        found: typeof dataOrId === 'string' ? document(dataOrId) : dataOrId,
        readTime: { seconds: 5, nanos: 6 },
    };
}
exports.found = found;
function missing(id) {
    return {
        missing: `${exports.DATABASE_ROOT}/documents/collectionId/${id}`,
        readTime: { seconds: 5, nanos: 6 },
    };
}
exports.missing = missing;
function document(id, field, value, ...fieldOrValues) {
    const document = {
        name: `${exports.DATABASE_ROOT}/documents/collectionId/${id}`,
        fields: {},
        createTime: { seconds: 1, nanos: 2 },
        updateTime: { seconds: 3, nanos: 4 },
    };
    if (field !== undefined) {
        fieldOrValues = [field, value].concat(fieldOrValues);
        for (let i = 0; i < fieldOrValues.length; i += 2) {
            const field = fieldOrValues[i];
            const value = fieldOrValues[i + 1];
            if (typeof value === 'string') {
                document.fields[field] = {
                    stringValue: value,
                };
            }
            else {
                document.fields[field] = value;
            }
        }
    }
    return document;
}
exports.document = document;
function serverTimestamp(field) {
    return { fieldPath: field, setToServerValue: 'REQUEST_TIME' };
}
exports.serverTimestamp = serverTimestamp;
function incrementTransform(field, n) {
    return {
        fieldPath: field,
        increment: Number.isInteger(n) ? { integerValue: n } : { doubleValue: n },
    };
}
exports.incrementTransform = incrementTransform;
function arrayTransform(field, transform, ...values) {
    const fieldTransform = {
        fieldPath: field,
    };
    fieldTransform[transform] = { values: values.map(val => value(val)) };
    return fieldTransform;
}
exports.arrayTransform = arrayTransform;
function writeResult(count) {
    const response = {
        commitTime: {
            nanos: 0,
            seconds: 1,
        },
    };
    if (count > 0) {
        response.writeResults = [];
        for (let i = 1; i <= count; ++i) {
            response.writeResults.push({
                updateTime: {
                    nanos: i * 2,
                    seconds: i * 2 + 1,
                },
            });
        }
    }
    return response;
}
exports.writeResult = writeResult;
function requestEquals(actual, expected) {
    chai_1.expect(actual).to.not.be.undefined;
    // 'extend' removes undefined fields in the request object. The backend
    // ignores these fields, but we need to manually strip them before we compare
    // the expected and the actual request.
    actual = extend(true, {}, actual);
    const proto = Object.assign({ database: exports.DATABASE_ROOT }, expected);
    chai_1.expect(actual).to.deep.eq(proto);
}
exports.requestEquals = requestEquals;
function stream(...elements) {
    const stream = through2.obj();
    setImmediate(() => {
        for (const el of elements) {
            if (el instanceof Error) {
                stream.destroy(el);
                return;
            }
            stream.push(el);
        }
        stream.push(null);
    });
    return stream;
}
exports.stream = stream;
/** Creates a response as formatted by the GAPIC request methods.  */
function response(result) {
    return Promise.resolve([result, undefined, undefined]);
}
exports.response = response;
/** Sample user object class used in tests. */
class Post {
    constructor(title, author) {
        this.title = title;
        this.author = author;
    }
    toString() {
        return this.title + ', by ' + this.author;
    }
}
exports.Post = Post;
/** Converts Post objects to and from Firestore in tests. */
exports.postConverter = {
    toFirestore(post) {
        return { title: post.title, author: post.author };
    },
    fromFirestore(snapshot) {
        const data = snapshot.data();
        return new Post(data.title, data.author);
    },
};
exports.postConverterMerge = {
    toFirestore(post, options) {
        if (options && (options.merge || options.mergeFields)) {
            chai_1.expect(post).to.not.be.an.instanceOf(Post);
        }
        else {
            chai_1.expect(post).to.be.an.instanceof(Post);
        }
        const result = {};
        if (post.title)
            result.title = post.title;
        if (post.author)
            result.author = post.author;
        return result;
    },
    fromFirestore(snapshot) {
        const data = snapshot.data();
        return new Post(data.title, data.author);
    },
};
async function bundleToElementArray(bundle) {
    const result = [];
    const readable = new stream_1.PassThrough();
    readable.end(bundle);
    const streamIterator = new length_prefixed_json_stream_1.JSONStreamIterator(readable);
    for await (const value of streamIterator) {
        result.push(value);
    }
    return result;
}
exports.bundleToElementArray = bundleToElementArray;
//# sourceMappingURL=helpers.js.map