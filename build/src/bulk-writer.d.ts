/*!
 * Copyright 2020 Google LLC
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
import * as firestore from '@google-cloud/firestore';
import { FieldPath, Firestore } from '.';
import { Timestamp } from './timestamp';
import { WriteResult } from './write-batch';
/**
 * A Firestore BulkWriter than can be used to perform a large number of writes
 * in parallel. Writes to the same document will be executed sequentially.
 *
 * @class
 */
export declare class BulkWriter {
    private readonly firestore;
    /**
     * The maximum number of writes that can be in a single batch.
     */
    private maxBatchSize;
    /**
     * A queue of batches to be written.
     */
    private batchQueue;
    /**
     * Whether this BulkWriter instance is closed. Once closed, it cannot be
     * opened again.
     */
    private closed;
    /**
     * Rate limiter used to throttle requests as per the 500/50/5 rule.
     */
    private rateLimiter;
    constructor(firestore: Firestore, enableThrottling: boolean);
    /**
     * Create a document with the provided data. This single operation will fail
     * if a document exists at its location.
     *
     * @param {DocumentReference} documentRef A reference to the document to be
     * created.
     * @param {T} data The object to serialize as the document.
     * @returns {Promise<WriteResult>} A promise that resolves with the result of
     * the write. Throws an error if the write fails.
     *
     * @example
     * let bulkWriter = firestore.bulkWriter();
     * let documentRef = firestore.collection('col').doc();
     *
     * bulkWriter
     *  .create(documentRef, {foo: 'bar'})
     *  .then(result => {
     *    console.log('Successfully executed write at: ', result);
     *  })
     *  .catch(err => {
     *    console.log('Write failed with: ', err);
     *  });
     * });
     */
    create<T>(documentRef: firestore.DocumentReference<T>, data: T): Promise<WriteResult>;
    /**
     * Delete a document from the database.
     *
     * @param {DocumentReference} documentRef A reference to the document to be
     * deleted.
     * @param {Precondition=} precondition A precondition to enforce for this
     * delete.
     * @param {Timestamp=} precondition.lastUpdateTime If set, enforces that the
     * document was last updated at lastUpdateTime. Fails the batch if the
     * document doesn't exist or was last updated at a different time.
     * @returns {Promise<WriteResult>} A promise that resolves with a sentinel
     * Timestamp indicating that the delete was successful. Throws an error if
     * the write fails.
     *
     * @example
     * let bulkWriter = firestore.bulkWriter();
     * let documentRef = firestore.doc('col/doc');
     *
     * bulkWriter
     *  .delete(documentRef)
     *  .then(result => {
     *    console.log('Successfully deleted document');
     *  })
     *  .catch(err => {
     *    console.log('Delete failed with: ', err);
     *  });
     * });
     */
    delete<T>(documentRef: firestore.DocumentReference<T>, precondition?: firestore.Precondition): Promise<WriteResult>;
    set<T>(documentRef: firestore.DocumentReference<T>, data: Partial<T>, options: firestore.SetOptions): Promise<WriteResult>;
    set<T>(documentRef: firestore.DocumentReference<T>, data: T): Promise<WriteResult>;
    /**
     * Update fields of the document referred to by the provided
     * [DocumentReference]{@link DocumentReference}. If the document doesn't yet
     * exist, the update fails and the entire batch will be rejected.
     *
     * The update() method accepts either an object with field paths encoded as
     * keys and field values encoded as values, or a variable number of arguments
     * that alternate between field paths and field values. Nested fields can be
     * updated by providing dot-separated field path strings or by providing
     * FieldPath objects.
     *
     *
     * A Precondition restricting this update can be specified as the last
     * argument.
     *
     * @param {DocumentReference} documentRef A reference to the document to be
     * updated.
     * @param {UpdateData|string|FieldPath} dataOrField An object containing the
     * fields and values with which to update the document or the path of the
     * first field to update.
     * @param {...(Precondition|*|string|FieldPath)} preconditionOrValues - An
     * alternating list of field paths and values to update or a Precondition to
     * restrict this update
     * @returns {Promise<WriteResult>} A promise that resolves with the result of
     * the write. Throws an error if the write fails.
     *
     *
     * @example
     * let bulkWriter = firestore.bulkWriter();
     * let documentRef = firestore.doc('col/doc');
     *
     * bulkWriter
     *  .update(documentRef, {foo: 'bar'})
     *  .then(result => {
     *    console.log('Successfully executed write at: ', result);
     *  })
     *  .catch(err => {
     *    console.log('Write failed with: ', err);
     *  });
     * });
     */
    update<T>(documentRef: firestore.DocumentReference, dataOrField: firestore.UpdateData | string | FieldPath, ...preconditionOrValues: Array<{
        lastUpdateTime?: Timestamp;
    } | unknown | string | FieldPath>): Promise<WriteResult>;
    /**
     * Commits all writes that have been enqueued up to this point in parallel.
     *
     * Returns a Promise that resolves when all currently queued operations have
     * been committed. The Promise will never be rejected since the results for
     * each individual operation are conveyed via their individual Promises.
     *
     * The Promise resolves immediately if there are no pending writes. Otherwise,
     * the Promise waits for all previously issued writes, but it does not wait
     * for writes that were added after the method is called. If you want to wait
     * for additional writes, call `flush()` again.
     *
     * @return {Promise<void>} A promise that resolves when all enqueued writes
     * up to this point have been committed.
     *
     * @example
     * let bulkWriter = firestore.bulkWriter();
     *
     * bulkWriter.create(documentRef, {foo: 'bar'});
     * bulkWriter.update(documentRef2, {foo: 'bar'});
     * bulkWriter.delete(documentRef3);
     * await flush().then(() => {
     *   console.log('Executed all writes');
     * });
     */
    flush(): Promise<void>;
    /**
     * Commits all enqueued writes and marks the BulkWriter instance as closed.
     *
     * After calling `close()`, calling any method wil throw an error.
     *
     * Returns a Promise that resolves when there are no more pending writes. The
     * Promise will never be rejected. Calling this method will send all requests.
     * The promise resolves immediately if there are no pending writes.
     *
     * @return {Promise<void>} A promise that resolves when all enqueued writes
     * up to this point have been committed.
     *
     * @example
     * let bulkWriter = firestore.bulkWriter();
     *
     * bulkWriter.create(documentRef, {foo: 'bar'});
     * bulkWriter.update(documentRef2, {foo: 'bar'});
     * bulkWriter.delete(documentRef3);
     * await close().then(() => {
     *   console.log('Executed all writes');
     * });
     */
    close(): Promise<void>;
    private verifyNotClosed;
    /**
     * Return the first eligible batch that can hold a write to the provided
     * reference, or creates one if no eligible batches are found.
     *
     * @private
     */
    private getEligibleBatch;
    /**
     * Creates a new batch and adds it to the BatchQueue. If there is already a
     * batch enqueued, sends the batch after a new one is created.
     *
     * @private
     */
    private createNewBatch;
    /**
     * Attempts to send batches starting from the front of the BatchQueue until a
     * batch cannot be sent.
     *
     * After a batch is complete, try sending batches again.
     *
     * @private
     */
    private sendReadyBatches;
    /**
     * Sends the provided batch and processes the results. After the batch is
     * committed, sends the next group of ready batches.
     *
     * @private
     */
    private sendBatch;
    /**
     * Checks that the provided batch is sendable. To be sendable, a batch must:
     * (1) be marked as READY_TO_SEND
     * (2) not write to references that are currently in flight
     *
     * @private
     */
    private isBatchSendable;
    /**
     * Sets the maximum number of allowed operations in a batch.
     *
     * @private
     */
    _setMaxBatchSize(size: number): void;
}
