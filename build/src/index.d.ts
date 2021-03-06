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
/// <reference types="node" />
import * as firestore from '@google-cloud/firestore';
import { Duplex } from 'stream';
import { google } from '../protos/firestore_v1_proto_api';
import { BulkWriter } from './bulk-writer';
import { BundleBuilder } from './bundle';
import { DocumentSnapshot, QueryDocumentSnapshot } from './document';
import { CollectionReference, Query } from './reference';
import { DocumentReference } from './reference';
import { Serializer } from './serializer';
import { Transaction } from './transaction';
import { FirestoreStreamingMethod, FirestoreUnaryMethod } from './types';
import { WriteBatch } from './write-batch';
import api = google.firestore.v1;
export { CollectionReference, DocumentReference, QuerySnapshot, Query, } from './reference';
export { BulkWriter } from './bulk-writer';
export { DocumentSnapshot, QueryDocumentSnapshot } from './document';
export { FieldValue } from './field-value';
export { WriteBatch, WriteResult } from './write-batch';
export { Transaction } from './transaction';
export { Timestamp } from './timestamp';
export { DocumentChange } from './document-change';
export { FieldPath } from './path';
export { GeoPoint } from './geo-point';
export { setLogFunction } from './logger';
export { Status as GrpcStatus } from 'google-gax';
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
export declare class Firestore implements firestore.Firestore {
    /**
     * A client pool to distribute requests over multiple GAPIC clients in order
     * to work around a connection limit of 100 concurrent requests per client.
     * @private
     */
    private _clientPool;
    /**
     * The configuration options for the GAPIC client.
     * @private
     */
    _settings: firestore.Settings;
    /**
     * Settings for the exponential backoff used by the streaming endpoints.
     * @private
     */
    private _backoffSettings;
    /**
     * Whether the initialization settings can still be changed by invoking
     * `settings()`.
     * @private
     */
    private _settingsFrozen;
    /**
     * The serializer to use for the Protobuf transformation.
     * @private
     */
    _serializer: Serializer | null;
    /**
     * The project ID for this client.
     *
     * The project ID is auto-detected during the first request unless a project
     * ID is passed to the constructor (or provided via `.settings()`).
     * @private
     */
    private _projectId;
    /**
     * Count of listeners that have been registered on the client.
     *
     * The client can only be terminated when there are no pending writes or
     * registered listeners.
     * @private
     */
    private registeredListenersCount;
    /**
     * Number of pending operations on the client.
     *
     * The client can only be terminated when there are no pending writes or
     * registered listeners.
     * @private
     */
    private bulkWritersCount;
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
    constructor(settings?: firestore.Settings);
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
    settings(settings: firestore.Settings): void;
    private validateAndApplySettings;
    /**
     * Returns the Project ID for this Firestore instance. Validates that
     * `initializeIfNeeded()` was called before.
     *
     * @private
     */
    get projectId(): string;
    /**
     * Returns the root path of the database. Validates that
     * `initializeIfNeeded()` was called before.
     *
     * @private
     */
    get formattedName(): string;
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
    doc(documentPath: string): DocumentReference;
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
    collection(collectionPath: string): CollectionReference;
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
    collectionGroup(collectionId: string): Query;
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
    batch(): WriteBatch;
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
    bulkWriter(options?: firestore.BulkWriterOptions): BulkWriter;
    /**
     * Creates a [DocumentSnapshot]{@link DocumentSnapshot} or a
     * [QueryDocumentSnapshot]{@link QueryDocumentSnapshot} from a
     * `firestore.v1.Document` proto (or from a resource name for missing
     * documents).
     *
     * This API is used by Google Cloud Functions and can be called with both
     * 'Proto3 JSON' and 'Protobuf JS' encoded data.
     *
     * @private
     * @param documentOrName The Firestore 'Document' proto or the resource name
     * of a missing document.
     * @param readTime A 'Timestamp' proto indicating the time this document was
     * read.
     * @param encoding One of 'json' or 'protobufJS'. Applies to both the
     * 'document' Proto and 'readTime'. Defaults to 'protobufJS'.
     * @returns A QueryDocumentSnapshot for existing documents, otherwise a
     * DocumentSnapshot.
     */
    snapshot_(documentName: string, readTime?: google.protobuf.ITimestamp, encoding?: 'protobufJS'): DocumentSnapshot;
    snapshot_(documentName: string, readTime: string, encoding: 'json'): DocumentSnapshot;
    snapshot_(document: api.IDocument, readTime: google.protobuf.ITimestamp, encoding?: 'protobufJS'): QueryDocumentSnapshot;
    snapshot_(document: {
        [k: string]: unknown;
    }, readTime: string, encoding: 'json'): QueryDocumentSnapshot;
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
    _bundle(name?: string): BundleBuilder;
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
    runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>, transactionOptions?: {
        maxAttempts?: number;
    }): Promise<T>;
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
    listCollections(): Promise<CollectionReference[]>;
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
    getAll<T>(...documentRefsOrReadOptions: Array<firestore.DocumentReference<T> | firestore.ReadOptions>): Promise<Array<DocumentSnapshot<T>>>;
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
    getAll_<T>(docRefs: Array<firestore.DocumentReference<T>>, fieldMask: firestore.FieldPath[] | null, requestTag: string, transactionId?: Uint8Array): Promise<Array<DocumentSnapshot<T>>>;
    /**
     * Registers a listener on this client, incrementing the listener count. This
     * is used to verify that all listeners are unsubscribed when terminate() is
     * called.
     *
     * @private
     */
    registerListener(): void;
    /**
     * Unregisters a listener on this client, decrementing the listener count.
     * This is used to verify that all listeners are unsubscribed when terminate()
     * is called.
     *
     * @private
     */
    unregisterListener(): void;
    /**
     * Increments the number of open BulkWriter instances. This is used to verify
     * that all pending operations are complete when terminate() is called.
     *
     * @private
     */
    _incrementBulkWritersCount(): void;
    /**
     * Decrements the number of open BulkWriter instances. This is used to verify
     * that all pending operations are complete when terminate() is called.
     *
     * @private
     */
    _decrementBulkWritersCount(): void;
    /**
     * Terminates the Firestore client and closes all open streams.
     *
     * @return A Promise that resolves when the client is terminated.
     */
    terminate(): Promise<void>;
    /**
     * Initializes the client if it is not already initialized. All methods in the
     * SDK can be used after this method completes.
     *
     * @private
     * @param requestTag A unique client-assigned identifier that caused this
     * initialization.
     * @return A Promise that resolves when the client is initialized.
     */
    initializeIfNeeded(requestTag: string): Promise<void>;
    /**
     * Returns GAX call options that set the cloud resource header.
     * @private
     */
    private createCallOptions;
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
    private _retry;
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
    private _initializeStream;
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
    request<Req, Resp>(methodName: FirestoreUnaryMethod, request: Req, requestTag: string, retryCodes?: number[]): Promise<Resp>;
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
    requestStream(methodName: FirestoreStreamingMethod, request: {}, requestTag: string): Promise<Duplex>;
}
/**
 * A logging function that takes a single string.
 *
 * @callback Firestore~logFunction
 * @param {string} Log message
 */
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
export default Firestore;
