"use strict";
/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const google_gax_1 = require("google-gax");
const stream_1 = require("stream");
const url_1 = require("url");
const backoff_1 = require("./backoff");
const bulk_writer_1 = require("./bulk-writer");
const bundle_1 = require("./bundle");
const convert_1 = require("./convert");
const document_1 = require("./document");
const logger_1 = require("./logger");
const path_1 = require("./path");
const pool_1 = require("./pool");
const reference_1 = require("./reference");
const reference_2 = require("./reference");
const serializer_1 = require("./serializer");
const timestamp_1 = require("./timestamp");
const transaction_1 = require("./transaction");
const util_1 = require("./util");
const validate_1 = require("./validate");
const write_batch_1 = require("./write-batch");
const firestore_client_config_json_1 = require("./v1/firestore_client_config.json");
const serviceConfig = firestore_client_config_json_1.interfaces['google.firestore.v1.Firestore'];
var reference_3 = require("./reference");
exports.CollectionReference = reference_3.CollectionReference;
exports.DocumentReference = reference_3.DocumentReference;
exports.QuerySnapshot = reference_3.QuerySnapshot;
exports.Query = reference_3.Query;
var bulk_writer_2 = require("./bulk-writer");
exports.BulkWriter = bulk_writer_2.BulkWriter;
var document_2 = require("./document");
exports.DocumentSnapshot = document_2.DocumentSnapshot;
exports.QueryDocumentSnapshot = document_2.QueryDocumentSnapshot;
var field_value_1 = require("./field-value");
exports.FieldValue = field_value_1.FieldValue;
var write_batch_2 = require("./write-batch");
exports.WriteBatch = write_batch_2.WriteBatch;
exports.WriteResult = write_batch_2.WriteResult;
var transaction_2 = require("./transaction");
exports.Transaction = transaction_2.Transaction;
var timestamp_2 = require("./timestamp");
exports.Timestamp = timestamp_2.Timestamp;
var document_change_1 = require("./document-change");
exports.DocumentChange = document_change_1.DocumentChange;
var path_2 = require("./path");
exports.FieldPath = path_2.FieldPath;
var geo_point_1 = require("./geo-point");
exports.GeoPoint = geo_point_1.GeoPoint;
var logger_2 = require("./logger");
exports.setLogFunction = logger_2.setLogFunction;
var google_gax_2 = require("google-gax");
exports.GrpcStatus = google_gax_2.Status;
const libVersion = require('../../package.json').version;
logger_1.setLibVersion(libVersion);
/*!
 * DO NOT REMOVE THE FOLLOWING NAMESPACE DEFINITIONS
 */
/**
 * @namespace google.protobuf
 */
/**
 * @namespace google.rpc
 */
/**
 * @namespace google.longrunning
 */
/**
 * @namespace google.firestore.v1
 */
/**
 * @namespace google.firestore.v1beta1
 */
/**
 * @namespace google.firestore.admin.v1
 */
/*!
 * @see v1
 */
let v1; // Lazy-loaded in `_runRequest()`
/*!
 * @see v1beta1
 */
let v1beta1; // Lazy-loaded upon access.
/*!
 * HTTP header for the resource prefix to improve routing and project isolation
 * by the backend.
 */
const CLOUD_RESOURCE_HEADER = 'google-cloud-resource-prefix';
/*!
 * The maximum number of times to retry idempotent requests.
 */
const MAX_REQUEST_RETRIES = 5;
/*!
 * The default number of idle GRPC channel to keep.
 */
const DEFAULT_MAX_IDLE_CHANNELS = 1;
/*!
 * The maximum number of concurrent requests supported by a single GRPC channel,
 * as enforced by Google's Frontend. If the SDK issues more than 100 concurrent
 * operations, we need to use more than one GAPIC client since these clients
 * multiplex all requests over a single channel.
 */
const MAX_CONCURRENT_REQUESTS_PER_CLIENT = 100;
/**
 * Document data (e.g. for use with
 * [set()]{@link DocumentReference#set}) consisting of fields mapped
 * to values.
 *
 * @typedef {Object.<string, *>} DocumentData
 */
/**
 * Converter used by [withConverter()]{@link Query#withConverter} to transform
 * user objects of type T into Firestore data.
 *
 * Using the converter allows you to specify generic type arguments when storing
 * and retrieving objects from Firestore.
 *
 * @example
 * class Post {
 *   constructor(readonly title: string, readonly author: string) {}
 *
 *   toString(): string {
 *     return this.title + ', by ' + this.author;
 *   }
 * }
 *
 * const postConverter = {
 *   toFirestore(post: Post): FirebaseFirestore.DocumentData {
 *     return {title: post.title, author: post.author};
 *   },
 *   fromFirestore(
 *     data: FirebaseFirestore.QueryDocumentSnapshot
 *   ): Post {
 *     const data = snapshot.data();
 *     return new Post(data.title, data.author);
 *   }
 * };
 *
 * const postSnap = await Firestore()
 *   .collection('posts')
 *   .withConverter(postConverter)
 *   .doc().get();
 * const post = postSnap.data();
 * if (post !== undefined) {
 *   post.title; // string
 *   post.toString(); // Should be defined
 *   post.someNonExistentProperty; // TS error
 * }
 *
 * @property {Function} toFirestore Called by the Firestore SDK to convert a
 * custom model object of type T into a plain Javascript object (suitable for
 * writing directly to the Firestore database).
 * @property {Function} fromFirestore Called by the Firestore SDK to convert
 * Firestore data into an object of type T.
 * @typedef {Object} FirestoreDataConverter
 */
/**
 * Update data (for use with [update]{@link DocumentReference#update})
 * that contains paths (e.g. 'foo' or 'foo.baz') mapped to values. Fields that
 * contain dots reference nested fields within the document.
 *
 * @typedef {Object.<string, *>} UpdateData
 */
/**
 * An options object that configures conditional behavior of
 * [update()]{@link DocumentReference#update} and
 * [delete()]{@link DocumentReference#delete} calls in
 * [DocumentReference]{@link DocumentReference},
 * [WriteBatch]{@link WriteBatch}, and
 * [Transaction]{@link Transaction}. Using Preconditions, these calls
 * can be restricted to only apply to documents that match the specified
 * conditions.
 *
 * @example
 * const documentRef = firestore.doc('coll/doc');
 *
 * documentRef.get().then(snapshot => {
 *   const updateTime = snapshot.updateTime;
 *
 *   console.log(`Deleting document at update time: ${updateTime.toDate()}`);
 *   return documentRef.delete({ lastUpdateTime: updateTime });
 * });
 *
 * @property {Timestamp} lastUpdateTime The update time to enforce. If set,
 *  enforces that the document was last updated at lastUpdateTime. Fails the
 *  operation if the document was last updated at a different time.
 * @typedef {Object} Precondition
 */
/**
 * An options object that configures the behavior of
 * [set()]{@link DocumentReference#set} calls in
 * [DocumentReference]{@link DocumentReference},
 * [WriteBatch]{@link WriteBatch}, and
 * [Transaction]{@link Transaction}. These calls can be
 * configured to perform granular merges instead of overwriting the target
 * documents in their entirety by providing a SetOptions object with
 * { merge : true }.
 *
 * @property {boolean} merge Changes the behavior of a set() call to only
 * replace the values specified in its data argument. Fields omitted from the
 * set() call remain untouched.
 * @property {Array<(string|FieldPath)>} mergeFields Changes the behavior of
 * set() calls to only replace the specified field paths. Any field path that is
 * not specified is ignored and remains untouched.
 * It is an error to pass a SetOptions object to a set() call that is missing a
 * value for any of the fields specified here.
 * @typedef {Object} SetOptions
 */
/**
 * An options object that can be used to configure the behavior of
 * [getAll()]{@link Firestore#getAll} calls. By providing a `fieldMask`, these
 * calls can be configured to only return a subset of fields.
 *
 * @property {Array<(string|FieldPath)>} fieldMask Specifies the set of fields
 * to return and reduces the amount of data transmitted by the backend.
 * Adding a field mask does not filter results. Documents do not need to
 * contain values for all the fields in the mask to be part of the result set.
 * @typedef {Object} ReadOptions
 */
/**
 * The Firestore client represents a Firestore Database and is the entry point
 * for all Firestore operations.
 *
 * @see [Firestore Documentation]{@link https://firebase.google.com/docs/firestore/}
 *
 * @class
 *
 * @example <caption>Install the client library with <a
 * href="https://www.npmjs.com/">npm</a>:</caption> npm install --save
 * @google-cloud/firestore
 *
 * @example <caption>Import the client library</caption>
 * var Firestore = require('@google-cloud/firestore');
 *
 * @example <caption>Create a client that uses <a
 * href="https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application">Application
 * Default Credentials (ADC)</a>:</caption> var firestore = new Firestore();
 *
 * @example <caption>Create a client with <a
 * href="https://cloud.google.com/docs/authentication/production#obtaining_and_providing_service_account_credentials_manually">explicit
 * credentials</a>:</caption> var firestore = new Firestore({ projectId:
 * 'your-project-id', keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @example <caption>include:samples/quickstart.js</caption>
 * region_tag:firestore_quickstart
 * Full quickstart example:
 */
class Firestore {
    /**
     * @param {Object=} settings [Configuration object](#/docs).
     * @param {string=} settings.projectId The project ID from the Google
     * Developer's Console, e.g. 'grape-spaceship-123'. We will also check the
     * environment variable GCLOUD_PROJECT for your project ID.  Can be omitted in
     * environments that support
     * {@link https://cloud.google.com/docs/authentication Application Default
     * Credentials}
     * @param {string=} settings.keyFilename Local file containing the Service
     * Account credentials as downloaded from the Google Developers Console. Can
     * be omitted in environments that support
     * {@link https://cloud.google.com/docs/authentication Application Default
     * Credentials}. To configure Firestore with custom credentials, use
     * `settings.credentials` and provide the `client_email` and `private_key` of
     * your service account.
     * @param {{client_email:string=, private_key:string=}=} settings.credentials
     * The `client_email` and `private_key` properties of the service account
     * to use with your Firestore project. Can be omitted in environments that
     * support {@link https://cloud.google.com/docs/authentication Application
     * Default Credentials}. If your credentials are stored in a JSON file, you
     * can specify a `keyFilename` instead.
     * @param {string=} settings.host The host to connect to.
     * @param {boolean=} settings.ssl Whether to use SSL when connecting.
     * @param {number=} settings.maxIdleChannels The maximum number of idle GRPC
     * channels to keep. A smaller number of idle channels reduces memory usage
     * but increases request latency for clients with fluctuating request rates.
     * If set to 0, shuts down all GRPC channels when the client becomes idle.
     * Defaults to 1.
     * @param {boolean=} settings.ignoreUndefinedProperties Whether to skip nested
     * properties that are set to `undefined` during object serialization. If set
     * to `true`, these properties are skipped and not written to Firestore. If
     * set `false` or omitted, the SDK throws an exception when it encounters
     * properties of type `undefined`.
     */
    constructor(settings) {
        /**
         * The configuration options for the GAPIC client.
         * @private
         */
        this._settings = {};
        /**
         * Whether the initialization settings can still be changed by invoking
         * `settings()`.
         * @private
         */
        this._settingsFrozen = false;
        /**
         * The serializer to use for the Protobuf transformation.
         * @private
         */
        this._serializer = null;
        /**
         * The project ID for this client.
         *
         * The project ID is auto-detected during the first request unless a project
         * ID is passed to the constructor (or provided via `.settings()`).
         * @private
         */
        this._projectId = undefined;
        /**
         * Count of listeners that have been registered on the client.
         *
         * The client can only be terminated when there are no pending writes or
         * registered listeners.
         * @private
         */
        this.registeredListenersCount = 0;
        /**
         * Number of pending operations on the client.
         *
         * The client can only be terminated when there are no pending writes or
         * registered listeners.
         * @private
         */
        this.bulkWritersCount = 0;
        const libraryHeader = {
            libName: 'gccl',
            libVersion,
        };
        if (settings && settings.firebaseVersion) {
            libraryHeader.libVersion += ' fire/' + settings.firebaseVersion;
        }
        this.validateAndApplySettings({ ...settings, ...libraryHeader });
        const retryConfig = serviceConfig.retry_params.default;
        this._backoffSettings = {
            initialDelayMs: retryConfig.initial_retry_delay_millis,
            maxDelayMs: retryConfig.max_retry_delay_millis,
            backoffFactor: retryConfig.retry_delay_multiplier,
        };
        const maxIdleChannels = this._settings.maxIdleChannels === undefined
            ? DEFAULT_MAX_IDLE_CHANNELS
            : this._settings.maxIdleChannels;
        this._clientPool = new pool_1.ClientPool(MAX_CONCURRENT_REQUESTS_PER_CLIENT, maxIdleChannels, 
        /* clientFactory= */ () => {
            var _a;
            let client;
            if (this._settings.ssl === false) {
                const grpcModule = (_a = this._settings.grpc) !== null && _a !== void 0 ? _a : google_gax_1.grpc;
                const sslCreds = grpcModule.credentials.createInsecure();
                client = new module.exports.v1({
                    sslCreds,
                    ...this._settings,
                });
            }
            else {
                client = new module.exports.v1(this._settings);
            }
            logger_1.logger('Firestore', null, 'Initialized Firestore GAPIC Client');
            return client;
        }, 
        /* clientDestructor= */ client => client.close());
        logger_1.logger('Firestore', null, 'Initialized Firestore');
    }
    /**
     * Specifies custom settings to be used to configure the `Firestore`
     * instance. Can only be invoked once and before any other Firestore method.
     *
     * If settings are provided via both `settings()` and the `Firestore`
     * constructor, both settings objects are merged and any settings provided via
     * `settings()` take precedence.
     *
     * @param {object} settings The settings to use for all Firestore operations.
     */
    settings(settings) {
        validate_1.validateObject('settings', settings);
        validate_1.validateString('settings.projectId', settings.projectId, { optional: true });
        if (this._settingsFrozen) {
            throw new Error('Firestore has already been initialized. You can only call ' +
                'settings() once, and only before calling any other methods on a ' +
                'Firestore object.');
        }
        const mergedSettings = { ...this._settings, ...settings };
        this.validateAndApplySettings(mergedSettings);
        this._settingsFrozen = true;
    }
    validateAndApplySettings(settings) {
        var _a;
        if (settings.projectId !== undefined) {
            validate_1.validateString('settings.projectId', settings.projectId);
            this._projectId = settings.projectId;
        }
        let url = null;
        // If the environment variable is set, it should always take precedence
        // over any user passed in settings.
        if (process.env.FIRESTORE_EMULATOR_HOST) {
            validate_1.validateHost('FIRESTORE_EMULATOR_HOST', process.env.FIRESTORE_EMULATOR_HOST);
            settings = {
                ...settings,
                host: process.env.FIRESTORE_EMULATOR_HOST,
                ssl: false,
            };
            url = new url_1.URL(`http://${settings.host}`);
        }
        else if (settings.host !== undefined) {
            validate_1.validateHost('settings.host', settings.host);
            url = new url_1.URL(`http://${settings.host}`);
        }
        // Only store the host if a valid value was provided in `host`.
        if (url !== null) {
            if ((settings.servicePath !== undefined &&
                settings.servicePath !== url.hostname) ||
                (settings.apiEndpoint !== undefined &&
                    settings.apiEndpoint !== url.hostname)) {
                // eslint-disable-next-line no-console
                console.warn(`The provided host (${url.hostname}) in "settings" does not ` +
                    `match the existing host (${(_a = settings.servicePath) !== null && _a !== void 0 ? _a : settings.apiEndpoint}). Using the provided host.`);
            }
            settings.servicePath = url.hostname;
            if (url.port !== '' && settings.port === undefined) {
                settings.port = Number(url.port);
            }
            // We need to remove the `host` and `apiEndpoint` setting, in case a user
            // calls `settings()`, which will compare the the provided `host` to the
            // existing hostname stored on `servicePath`.
            delete settings.host;
            delete settings.apiEndpoint;
        }
        if (settings.ssl !== undefined) {
            validate_1.validateBoolean('settings.ssl', settings.ssl);
        }
        if (settings.maxIdleChannels !== undefined) {
            validate_1.validateInteger('settings.maxIdleChannels', settings.maxIdleChannels, {
                minValue: 0,
            });
        }
        this._settings = settings;
        this._serializer = new serializer_1.Serializer(this);
    }
    /**
     * Returns the Project ID for this Firestore instance. Validates that
     * `initializeIfNeeded()` was called before.
     *
     * @private
     */
    get projectId() {
        if (this._projectId === undefined) {
            throw new Error('INTERNAL ERROR: Client is not yet ready to issue requests.');
        }
        return this._projectId;
    }
    /**
     * Returns the root path of the database. Validates that
     * `initializeIfNeeded()` was called before.
     *
     * @private
     */
    get formattedName() {
        return `projects/${this.projectId}/databases/${path_1.DEFAULT_DATABASE_ID}`;
    }
    /**
     * Gets a [DocumentReference]{@link DocumentReference} instance that
     * refers to the document at the specified path.
     *
     * @param {string} documentPath A slash-separated path to a document.
     * @returns {DocumentReference} The
     * [DocumentReference]{@link DocumentReference} instance.
     *
     * @example
     * let documentRef = firestore.doc('collection/document');
     * console.log(`Path of document is ${documentRef.path}`);
     */
    doc(documentPath) {
        path_1.validateResourcePath('documentPath', documentPath);
        const path = path_1.ResourcePath.EMPTY.append(documentPath);
        if (!path.isDocument) {
            throw new Error(`Value for argument "documentPath" must point to a document, but was "${documentPath}". Your path does not contain an even number of components.`);
        }
        return new reference_2.DocumentReference(this, path);
    }
    /**
     * Gets a [CollectionReference]{@link CollectionReference} instance
     * that refers to the collection at the specified path.
     *
     * @param {string} collectionPath A slash-separated path to a collection.
     * @returns {CollectionReference} The
     * [CollectionReference]{@link CollectionReference} instance.
     *
     * @example
     * let collectionRef = firestore.collection('collection');
     *
     * // Add a document with an auto-generated ID.
     * collectionRef.add({foo: 'bar'}).then((documentRef) => {
     *   console.log(`Added document at ${documentRef.path})`);
     * });
     */
    collection(collectionPath) {
        path_1.validateResourcePath('collectionPath', collectionPath);
        const path = path_1.ResourcePath.EMPTY.append(collectionPath);
        if (!path.isCollection) {
            throw new Error(`Value for argument "collectionPath" must point to a collection, but was "${collectionPath}". Your path does not contain an odd number of components.`);
        }
        return new reference_1.CollectionReference(this, path);
    }
    /**
     * Creates and returns a new Query that includes all documents in the
     * database that are contained in a collection or subcollection with the
     * given collectionId.
     *
     * @param {string} collectionId Identifies the collections to query over.
     * Every collection or subcollection with this ID as the last segment of its
     * path will be included. Cannot contain a slash.
     * @returns {Query} The created Query.
     *
     * @example
     * let docA = firestore.doc('mygroup/docA').set({foo: 'bar'});
     * let docB = firestore.doc('abc/def/mygroup/docB').set({foo: 'bar'});
     *
     * Promise.all([docA, docB]).then(() => {
     *    let query = firestore.collectionGroup('mygroup');
     *    query = query.where('foo', '==', 'bar');
     *    return query.get().then(snapshot => {
     *       console.log(`Found ${snapshot.size} documents.`);
     *    });
     * });
     */
    collectionGroup(collectionId) {
        if (collectionId.indexOf('/') !== -1) {
            throw new Error(`Invalid collectionId '${collectionId}'. Collection IDs must not contain '/'.`);
        }
        return new reference_1.Query(this, reference_1.QueryOptions.forCollectionGroupQuery(collectionId));
    }
    /**
     * Creates a [WriteBatch]{@link WriteBatch}, used for performing
     * multiple writes as a single atomic operation.
     *
     * @returns {WriteBatch} A WriteBatch that operates on this Firestore
     * client.
     *
     * @example
     * let writeBatch = firestore.batch();
     *
     * // Add two documents in an atomic batch.
     * let data = { foo: 'bar' };
     * writeBatch.set(firestore.doc('col/doc1'), data);
     * writeBatch.set(firestore.doc('col/doc2'), data);
     *
     * writeBatch.commit().then(res => {
     *   console.log('Successfully executed batch.');
     * });
     */
    batch() {
        return new write_batch_1.WriteBatch(this);
    }
    /**
     * Creates a [BulkWriter]{@link BulkWriter}, used for performing
     * multiple writes in parallel. Gradually ramps up writes as specified
     * by the 500/50/5 rule.
     *
     * @see [500/50/5 Documentation]{@link https://cloud.google.com/datastore/docs/best-practices#ramping_up_traffic}
     *
     * @param {object=} options BulkWriter options.
     * @param {boolean=} options.disableThrottling Whether to disable throttling
     * as specified by the 500/50/5 rule.
     * @returns {WriteBatch} A BulkWriter that operates on this Firestore
     * client.
     *
     * @example
     * let bulkWriter = firestore.bulkWriter();
     *
     * bulkWriter.create(firestore.doc('col/doc1'), {foo: 'bar'})
     *   .then(res => {
     *     console.log(`Added document at ${res.writeTime}`);
     *   });
     * bulkWriter.update(firestore.doc('col/doc2'), {foo: 'bar'})
     *   .then(res => {
     *     console.log(`Updated document at ${res.writeTime}`);
     *   });
     * bulkWriter.delete(firestore.doc('col/doc3'))
     *   .then(res => {
     *     console.log(`Deleted document at ${res.writeTime}`);
     *   });
     * await bulkWriter.close().then(() => {
     *   console.log('Executed all writes');
     * });
     */
    bulkWriter(options) {
        return new bulk_writer_1.BulkWriter(this, !(options === null || options === void 0 ? void 0 : options.disableThrottling));
    }
    snapshot_(documentOrName, readTime, encoding) {
        // TODO: Assert that Firestore Project ID is valid.
        let convertTimestamp;
        let convertFields;
        if (encoding === undefined || encoding === 'protobufJS') {
            convertTimestamp = data => data;
            convertFields = data => data;
        }
        else if (encoding === 'json') {
            // Google Cloud Functions calls us with Proto3 JSON format data, which we
            // must convert to Protobuf JS.
            convertTimestamp = convert_1.timestampFromJson;
            convertFields = convert_1.fieldsFromJson;
        }
        else {
            throw new Error('Unsupported encoding format. Expected "json" or "protobufJS", ' +
                `but was "${encoding}".`);
        }
        let ref;
        let document;
        if (typeof documentOrName === 'string') {
            ref = new reference_2.DocumentReference(this, path_1.QualifiedResourcePath.fromSlashSeparatedString(documentOrName));
            document = new document_1.DocumentSnapshotBuilder(ref);
        }
        else {
            ref = new reference_2.DocumentReference(this, path_1.QualifiedResourcePath.fromSlashSeparatedString(documentOrName.name));
            document = new document_1.DocumentSnapshotBuilder(ref);
            document.fieldsProto = documentOrName.fields
                ? convertFields(documentOrName.fields)
                : {};
            document.createTime = timestamp_1.Timestamp.fromProto(convertTimestamp(documentOrName.createTime, 'documentOrName.createTime'));
            document.updateTime = timestamp_1.Timestamp.fromProto(convertTimestamp(documentOrName.updateTime, 'documentOrName.updateTime'));
        }
        if (readTime) {
            document.readTime = timestamp_1.Timestamp.fromProto(convertTimestamp(readTime, 'readTime'));
        }
        return document.build();
    }
    /**
     * Creates a new `BundleBuilder` instance to package selected Firestore data into
     * a bundle.
     *
     * @param bundleId. The id of the bundle. When loaded on clients, client SDKs use this id
     * and the timestamp associated with the built bundle to tell if it has been loaded already.
     * If not specified, a random identifier will be used.
     *
     * @private
     */
    _bundle(name) {
        return new bundle_1.BundleBuilder(name || util_1.autoId());
    }
    /**
     * Executes the given updateFunction and commits the changes applied within
     * the transaction.
     *
     * You can use the transaction object passed to 'updateFunction' to read and
     * modify Firestore documents under lock. Transactions are committed once
     * 'updateFunction' resolves and attempted up to five times on failure.
     *
     * @param {function(Transaction)} updateFunction The function to execute
     * within the transaction context.
     * @param {object=} transactionOptions Transaction options.
     * @param {number=} transactionOptions.maxAttempts - The maximum number of
     * attempts for this transaction.
     * @returns {Promise} If the transaction completed successfully or was
     * explicitly aborted (by the updateFunction returning a failed Promise), the
     * Promise returned by the updateFunction will be returned here. Else if the
     * transaction failed, a rejected Promise with the corresponding failure
     * error will be returned.
     *
     * @example
     * let counterTransaction = firestore.runTransaction(transaction => {
     *   let documentRef = firestore.doc('col/doc');
     *   return transaction.get(documentRef).then(doc => {
     *     if (doc.exists) {
     *       let count =  doc.get('count') || 0;
     *       if (count > 10) {
     *         return Promise.reject('Reached maximum count');
     *       }
     *       transaction.update(documentRef, { count: ++count });
     *       return Promise.resolve(count);
     *     }
     *
     *     transaction.create(documentRef, { count: 1 });
     *     return Promise.resolve(1);
     *   });
     * });
     *
     * counterTransaction.then(res => {
     *   console.log(`Count updated to ${res}`);
     * });
     */
    runTransaction(updateFunction, transactionOptions) {
        validate_1.validateFunction('updateFunction', updateFunction);
        const defaultAttempts = 5;
        const tag = util_1.requestTag();
        let maxAttempts;
        if (transactionOptions) {
            validate_1.validateObject('transactionOptions', transactionOptions);
            validate_1.validateInteger('transactionOptions.maxAttempts', transactionOptions.maxAttempts, { optional: true, minValue: 1 });
            maxAttempts = transactionOptions.maxAttempts || defaultAttempts;
        }
        else {
            maxAttempts = defaultAttempts;
        }
        const transaction = new transaction_1.Transaction(this, tag);
        return this.initializeIfNeeded(tag).then(() => transaction.runTransaction(updateFunction, maxAttempts));
    }
    /**
     * Fetches the root collections that are associated with this Firestore
     * database.
     *
     * @returns {Promise.<Array.<CollectionReference>>} A Promise that resolves
     * with an array of CollectionReferences.
     *
     * @example
     * firestore.listCollections().then(collections => {
     *   for (let collection of collections) {
     *     console.log(`Found collection with id: ${collection.id}`);
     *   }
     * });
     */
    listCollections() {
        const rootDocument = new reference_2.DocumentReference(this, path_1.ResourcePath.EMPTY);
        return rootDocument.listCollections();
    }
    /**
     * Retrieves multiple documents from Firestore.
     *
     * The first argument is required and must be of type `DocumentReference`
     * followed by any additional `DocumentReference` documents. If used, the
     * optional `ReadOptions` must be the last argument.
     *
     * @param {...DocumentReference|ReadOptions} documentRefsOrReadOptions The
     * `DocumentReferences` to receive, followed by an optional field mask.
     * @returns {Promise<Array.<DocumentSnapshot>>} A Promise that
     * contains an array with the resulting document snapshots.
     *
     * @example
     * let docRef1 = firestore.doc('col/doc1');
     * let docRef2 = firestore.doc('col/doc2');
     *
     * firestore.getAll(docRef1, docRef2, { fieldMask: ['user'] }).then(docs => {
     *   console.log(`First document: ${JSON.stringify(docs[0])}`);
     *   console.log(`Second document: ${JSON.stringify(docs[1])}`);
     * });
     */
    getAll(...documentRefsOrReadOptions) {
        validate_1.validateMinNumberOfArguments('Firestore.getAll', documentRefsOrReadOptions, 1);
        const { documents, fieldMask } = transaction_1.parseGetAllArguments(documentRefsOrReadOptions);
        const tag = util_1.requestTag();
        // Capture the error stack to preserve stack tracing across async calls.
        const stack = Error().stack;
        return this.initializeIfNeeded(tag)
            .then(() => this.getAll_(documents, fieldMask, tag))
            .catch(err => {
            throw util_1.wrapError(err, stack);
        });
    }
    /**
     * Internal method to retrieve multiple documents from Firestore, optionally
     * as part of a transaction.
     *
     * @private
     * @param docRefs The documents to receive.
     * @param fieldMask An optional field mask to apply to this read.
     * @param requestTag A unique client-assigned identifier for this request.
     * @param transactionId The transaction ID to use for this read.
     * @returns A Promise that contains an array with the resulting documents.
     */
    getAll_(docRefs, fieldMask, requestTag, transactionId) {
        const requestedDocuments = new Set();
        const retrievedDocuments = new Map();
        for (const docRef of docRefs) {
            requestedDocuments.add(docRef.formattedName);
        }
        const request = {
            database: this.formattedName,
            transaction: transactionId,
            documents: Array.from(requestedDocuments),
        };
        if (fieldMask) {
            const fieldPaths = fieldMask.map(fieldPath => fieldPath.formattedName);
            request.mask = { fieldPaths };
        }
        return this.requestStream('batchGetDocuments', request, requestTag).then(stream => {
            return new Promise((resolve, reject) => {
                stream
                    .on('error', err => {
                    logger_1.logger('Firestore.getAll_', requestTag, 'GetAll failed with error:', err);
                    reject(err);
                })
                    .on('data', (response) => {
                    try {
                        let document;
                        if (response.found) {
                            logger_1.logger('Firestore.getAll_', requestTag, 'Received document: %s', response.found.name);
                            document = this.snapshot_(response.found, response.readTime);
                        }
                        else {
                            logger_1.logger('Firestore.getAll_', requestTag, 'Document missing: %s', response.missing);
                            document = this.snapshot_(response.missing, response.readTime);
                        }
                        const path = document.ref.path;
                        retrievedDocuments.set(path, document);
                    }
                    catch (err) {
                        logger_1.logger('Firestore.getAll_', requestTag, 'GetAll failed with exception:', err);
                        reject(err);
                    }
                })
                    .on('end', () => {
                    logger_1.logger('Firestore.getAll_', requestTag, 'Received %d results', retrievedDocuments.size);
                    // BatchGetDocuments doesn't preserve document order. We use
                    // the request order to sort the resulting documents.
                    const orderedDocuments = [];
                    for (const docRef of docRefs) {
                        const document = retrievedDocuments.get(docRef.path);
                        if (document !== undefined) {
                            // Recreate the DocumentSnapshot with the DocumentReference
                            // containing the original converter.
                            const finalDoc = new document_1.DocumentSnapshotBuilder(docRef);
                            finalDoc.fieldsProto = document._fieldsProto;
                            finalDoc.readTime = document.readTime;
                            finalDoc.createTime = document.createTime;
                            finalDoc.updateTime = document.updateTime;
                            orderedDocuments.push(finalDoc.build());
                        }
                        else {
                            reject(new Error(`Did not receive document for "${docRef.path}".`));
                        }
                    }
                    resolve(orderedDocuments);
                });
                stream.resume();
            });
        });
    }
    /**
     * Registers a listener on this client, incrementing the listener count. This
     * is used to verify that all listeners are unsubscribed when terminate() is
     * called.
     *
     * @private
     */
    registerListener() {
        this.registeredListenersCount += 1;
    }
    /**
     * Unregisters a listener on this client, decrementing the listener count.
     * This is used to verify that all listeners are unsubscribed when terminate()
     * is called.
     *
     * @private
     */
    unregisterListener() {
        this.registeredListenersCount -= 1;
    }
    /**
     * Increments the number of open BulkWriter instances. This is used to verify
     * that all pending operations are complete when terminate() is called.
     *
     * @private
     */
    _incrementBulkWritersCount() {
        this.bulkWritersCount += 1;
    }
    /**
     * Decrements the number of open BulkWriter instances. This is used to verify
     * that all pending operations are complete when terminate() is called.
     *
     * @private
     */
    _decrementBulkWritersCount() {
        this.bulkWritersCount -= 1;
    }
    /**
     * Terminates the Firestore client and closes all open streams.
     *
     * @return A Promise that resolves when the client is terminated.
     */
    terminate() {
        if (this.registeredListenersCount > 0 || this.bulkWritersCount > 0) {
            return Promise.reject('All onSnapshot() listeners must be unsubscribed, and all BulkWriter ' +
                'instances must be closed before terminating the client. ' +
                `There are ${this.registeredListenersCount} active listeners and ` +
                `${this.bulkWritersCount} open BulkWriter instances.`);
        }
        return this._clientPool.terminate();
    }
    /**
     * Initializes the client if it is not already initialized. All methods in the
     * SDK can be used after this method completes.
     *
     * @private
     * @param requestTag A unique client-assigned identifier that caused this
     * initialization.
     * @return A Promise that resolves when the client is initialized.
     */
    async initializeIfNeeded(requestTag) {
        this._settingsFrozen = true;
        if (this._settings.ssl === false) {
            // If SSL is false, we assume that we are talking to the emulator. We
            // provide an Authorization header by default so that the connection is
            // recognized as admin in Firestore Emulator. (If for some reason we're
            // not connecting to the emulator, then this will result in denials with
            // invalid token, rather than behave like clients not logged in. The user
            // can then provide their own Authorization header, which will take
            // precedence).
            this._settings.customHeaders = {
                Authorization: 'Bearer owner',
                ...this._settings.customHeaders,
            };
        }
        if (this._projectId === undefined) {
            try {
                this._projectId = await this._clientPool.run(requestTag, gapicClient => gapicClient.getProjectId());
                logger_1.logger('Firestore.initializeIfNeeded', null, 'Detected project ID: %s', this._projectId);
            }
            catch (err) {
                logger_1.logger('Firestore.initializeIfNeeded', null, 'Failed to detect project ID: %s', err);
                return Promise.reject(err);
            }
        }
    }
    /**
     * Returns GAX call options that set the cloud resource header.
     * @private
     */
    createCallOptions(methodName, retryCodes) {
        const callOptions = {
            otherArgs: {
                headers: {
                    [CLOUD_RESOURCE_HEADER]: this.formattedName,
                    ...this._settings.customHeaders,
                },
            },
        };
        if (retryCodes) {
            const retryParams = util_1.getRetryParams(methodName);
            callOptions.retry = new google_gax_1.RetryOptions(retryCodes, retryParams);
        }
        return callOptions;
    }
    /**
     * A function returning a Promise that can be retried.
     *
     * @private
     * @callback retryFunction
     * @returns {Promise} A Promise indicating the function's success.
     */
    /**
     * Helper method that retries failed Promises.
     *
     * If 'delayMs' is specified, waits 'delayMs' between invocations. Otherwise,
     * schedules the first attempt immediately, and then waits 100 milliseconds
     * for further attempts.
     *
     * @private
     * @param methodName Name of the Veneer API endpoint that takes a request
     * and GAX options.
     * @param requestTag A unique client-assigned identifier for this request.
     * @param func Method returning a Promise than can be retried.
     * @returns A Promise with the function's result if successful within
     * `attemptsRemaining`. Otherwise, returns the last rejected Promise.
     */
    async _retry(methodName, requestTag, func) {
        const backoff = new backoff_1.ExponentialBackoff();
        let lastError = undefined;
        for (let attempt = 0; attempt < MAX_REQUEST_RETRIES; ++attempt) {
            if (lastError) {
                logger_1.logger('Firestore._retry', requestTag, 'Retrying request that failed with error:', lastError);
            }
            try {
                await backoff.backoffAndWait();
                return await func();
            }
            catch (err) {
                lastError = err;
                if (util_1.isPermanentRpcError(err, methodName)) {
                    break;
                }
            }
        }
        logger_1.logger('Firestore._retry', requestTag, 'Request failed with error:', lastError);
        return Promise.reject(lastError);
    }
    /**
     * Waits for the provided stream to become active and returns a paused but
     * healthy stream. If an error occurs before the first byte is read, the
     * method rejects the returned Promise.
     *
     * @private
     * @param backendStream The Node stream to monitor.
     * @param lifetime A Promise that resolves when the stream receives an 'end',
     * 'close' or 'finish' message.
     * @param requestTag A unique client-assigned identifier for this request.
     * @param request If specified, the request that should be written to the
     * stream after opening.
     * @returns A guaranteed healthy stream that should be used instead of
     * `backendStream`.
     */
    _initializeStream(backendStream, lifetime, requestTag, request) {
        const resultStream = new stream_1.PassThrough({ objectMode: true });
        resultStream.pause();
        /**
         * Whether we have resolved the Promise and returned the stream to the
         * caller.
         */
        let streamInitialized = false;
        return new Promise((resolve, reject) => {
            function streamReady() {
                if (!streamInitialized) {
                    streamInitialized = true;
                    logger_1.logger('Firestore._initializeStream', requestTag, 'Releasing stream');
                    resolve(resultStream);
                }
            }
            function streamEnded() {
                logger_1.logger('Firestore._initializeStream', requestTag, 'Received stream end');
                resultStream.unpipe(backendStream);
                resolve(resultStream);
                lifetime.resolve();
            }
            function streamFailed(err) {
                if (!streamInitialized) {
                    // If we receive an error before we were able to receive any data,
                    // reject this stream.
                    logger_1.logger('Firestore._initializeStream', requestTag, 'Received initial error:', err);
                    reject(err);
                }
                else {
                    logger_1.logger('Firestore._initializeStream', requestTag, 'Received stream error:', err);
                    // We execute the forwarding of the 'error' event via setImmediate() as
                    // V8 guarantees that the Promise chain returned from this method
                    // is resolved before any code executed via setImmediate(). This
                    // allows the caller to attach an error handler.
                    setImmediate(() => {
                        resultStream.emit('error', err);
                    });
                }
            }
            backendStream.on('data', () => streamReady());
            backendStream.on('error', err => streamFailed(err));
            backendStream.on('end', () => streamEnded());
            backendStream.on('close', () => streamEnded());
            backendStream.on('finish', () => streamEnded());
            backendStream.pipe(resultStream);
            if (request) {
                logger_1.logger('Firestore._initializeStream', requestTag, 'Sending request: %j', request);
                backendStream.write(request, 'utf-8', err => {
                    if (err) {
                        streamFailed(err);
                    }
                    else {
                        logger_1.logger('Firestore._initializeStream', requestTag, 'Marking stream as healthy');
                        streamReady();
                    }
                });
            }
        });
    }
    /**
     * A funnel for all non-streaming API requests, assigning a project ID where
     * necessary within the request options.
     *
     * @private
     * @param methodName Name of the Veneer API endpoint that takes a request
     * and GAX options.
     * @param request The Protobuf request to send.
     * @param requestTag A unique client-assigned identifier for this request.
     * @param retryCodes If provided, a custom list of retry codes. If not
     * provided, retry is based on the behavior as defined in the ServiceConfig.
     * @returns A Promise with the request result.
     */
    request(methodName, request, requestTag, retryCodes) {
        const callOptions = this.createCallOptions(methodName, retryCodes);
        return this._clientPool.run(requestTag, async (gapicClient) => {
            try {
                logger_1.logger('Firestore.request', requestTag, 'Sending request: %j', request);
                const [result] = await gapicClient[methodName](request, callOptions);
                logger_1.logger('Firestore.request', requestTag, 'Received response: %j', result);
                return result;
            }
            catch (err) {
                logger_1.logger('Firestore.request', requestTag, 'Received error:', err);
                return Promise.reject(err);
            }
        });
    }
    /**
     * A funnel for streaming API requests, assigning a project ID where necessary
     * within the request options.
     *
     * The stream is returned in paused state and needs to be resumed once all
     * listeners are attached.
     *
     * @private
     * @param methodName Name of the streaming Veneer API endpoint that
     * takes a request and GAX options.
     * @param request The Protobuf request to send.
     * @param requestTag A unique client-assigned identifier for this request.
     * @returns A Promise with the resulting read-only stream.
     */
    requestStream(methodName, request, requestTag) {
        const callOptions = this.createCallOptions(methodName);
        const bidirectional = methodName === 'listen';
        return this._retry(methodName, requestTag, () => {
            const result = new util_1.Deferred();
            this._clientPool.run(requestTag, async (gapicClient) => {
                logger_1.logger('Firestore.requestStream', requestTag, 'Sending request: %j', request);
                try {
                    const stream = bidirectional
                        ? gapicClient[methodName](callOptions)
                        : gapicClient[methodName](request, callOptions);
                    const logStream = new stream_1.Transform({
                        objectMode: true,
                        transform: (chunk, encoding, callback) => {
                            logger_1.logger('Firestore.requestStream', requestTag, 'Received response: %j', chunk);
                            callback();
                        },
                    });
                    stream.pipe(logStream);
                    const lifetime = new util_1.Deferred();
                    const resultStream = await this._initializeStream(stream, lifetime, requestTag, bidirectional ? request : undefined);
                    resultStream.on('end', () => stream.end());
                    result.resolve(resultStream);
                    // While we return the stream to the callee early, we don't want to
                    // release the GAPIC client until the callee has finished processing the
                    // stream.
                    return lifetime.promise;
                }
                catch (e) {
                    result.reject(e);
                }
            });
            return result.promise;
        });
    }
}
exports.Firestore = Firestore;
/**
 * A logging function that takes a single string.
 *
 * @callback Firestore~logFunction
 * @param {string} Log message
 */
// tslint:disable-next-line:no-default-export
/**
 * The default export of the `@google-cloud/firestore` package is the
 * {@link Firestore} class.
 *
 * See {@link Firestore} and {@link ClientConfig} for client methods and
 * configuration options.
 *
 * @module {Firestore} @google-cloud/firestore
 * @alias nodejs-firestore
 *
 * @example <caption>Install the client library with <a
 * href="https://www.npmjs.com/">npm</a>:</caption> npm install --save
 * @google-cloud/firestore
 *
 * @example <caption>Import the client library</caption>
 * var Firestore = require('@google-cloud/firestore');
 *
 * @example <caption>Create a client that uses <a
 * href="https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application">Application
 * Default Credentials (ADC)</a>:</caption> var firestore = new Firestore();
 *
 * @example <caption>Create a client with <a
 * href="https://cloud.google.com/docs/authentication/production#obtaining_and_providing_service_account_credentials_manually">explicit
 * credentials</a>:</caption> var firestore = new Firestore({ projectId:
 * 'your-project-id', keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @example <caption>include:samples/quickstart.js</caption>
 * region_tag:firestore_quickstart
 * Full quickstart example:
 */
// tslint:disable-next-line:no-default-export
exports.default = Firestore;
// Horrible hack to ensure backwards compatibility with <= 17.0, which allows
// users to call the default constructor via
// `const Fs = require(`@google-cloud/firestore`); new Fs()`;
const existingExports = module.exports;
module.exports = Firestore;
module.exports = Object.assign(module.exports, existingExports);
/**
 * {@link v1beta1} factory function.
 *
 * @private
 * @name Firestore.v1beta1
 * @see v1beta1
 * @type {function}
 */
Object.defineProperty(module.exports, 'v1beta1', {
    // The v1beta1 module is very large. To avoid pulling it in from static
    // scope, we lazy-load and cache the module.
    get: () => {
        if (!v1beta1) {
            v1beta1 = require('./v1beta1');
        }
        return v1beta1;
    },
});
/**
 * {@link v1} factory function.
 *
 * @private
 * @name Firestore.v1
 * @see v1
 * @type {function}
 */
Object.defineProperty(module.exports, 'v1', {
    // The v1 module is very large. To avoid pulling it in from static
    // scope, we lazy-load and cache the module.
    get: () => {
        if (!v1) {
            v1 = require('./v1');
        }
        return v1;
    },
});
//# sourceMappingURL=index.js.map