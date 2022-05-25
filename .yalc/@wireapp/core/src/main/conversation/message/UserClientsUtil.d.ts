import { QualifiedId } from '@wireapp/api-client/src/user';
declare type UserClientsContainer<T> = {
    [userId: string]: T;
};
declare type QualifiedUserClientsContainer<T> = {
    [domain: string]: UserClientsContainer<T>;
};
export declare function flattenUserClients<T>(userClients: UserClientsContainer<T>, domain?: string): {
    data: T;
    userId: QualifiedId;
}[];
/**
 * Will flatten a container of users=>clients infos to an array
 *
 * @param userClients The UserClients (qualified or not) to flatten
 * @return An array containing the qualified user Ids and the clients info
 */
export declare function flattenQualifiedUserClients<T = unknown>(userClients: QualifiedUserClientsContainer<T>): {
    data: T;
    userId: QualifiedId;
}[];
export {};
