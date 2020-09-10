import { google } from '../protos/firestore_v1_proto_api';
import api = google.firestore.v1;
export declare function fieldFilters(fieldPath: string, op: api.StructuredQuery.FieldFilter.Operator, value: string | api.IValue, ...fieldPathOpAndValues: Array<string | api.StructuredQuery.FieldFilter.Operator | string | api.IValue>): api.IStructuredQuery;
export declare function orderBy(fieldPath: string, direction: api.StructuredQuery.Direction, ...fieldPathAndOrderBys: Array<string | api.StructuredQuery.Direction>): api.IStructuredQuery;
export declare function startAt(before: boolean, ...values: Array<string | api.IValue>): api.IStructuredQuery;
export declare function queryEquals(actual: api.IRunQueryRequest | undefined, ...protoComponents: api.IStructuredQuery[]): void;
export declare function result(documentId: string): api.IRunQueryResponse;
