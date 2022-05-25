"use strict";
/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CoreCrypto_module, _CoreCrypto_ccFFI, _CoreCrypto_cc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreCrypto = void 0;
const stubFfiModule = () => ({
    module: null,
    instance: {
        exports: {
            init_with_path_and_key() { },
            cc_create_conversation(ptr, conversationId, params) {
                return new Uint8Array();
            },
            cc_decrypt_message(ptr, conversationId, payload) {
                return new Uint8Array();
            },
            cc_encrypt_message(ptr, conversationId, message) {
                return new Uint8Array();
            },
            cc_process_welcome_message(ptr, welcomeMessage, config) {
                return new Uint8Array();
            },
            cc_client_public_key(ptr) {
                return new TextEncoder('utf-8').encode('R1krdDFFUXUwWnNtMHIvenJtNnp6OVVwalBjQVB5VDVpOEwxaWFZM3lwTT0=');
            },
            cc_client_keypackages(ptr, amountRequested) {
                return new Array(amountRequested)
                    .fill(null)
                    .map(() => new TextEncoder('utf-8').encode('a2V5IHBhY2thZ2UgZGF0YQo='));
            },
            cc_add_clients_to_conversation(ptr, conversationId, clients) {
                return null;
            },
            cc_remove_clients_from_conversation(ptr, conversationId, clients) {
                return null;
            },
            cc_conversation_exists(ptr, conversationId) {
                return false;
            },
            cc_version() {
                return '0.2.0-stub';
            },
        },
    },
});
class CoreCrypto {
    constructor({ wasmModule, path, key, clientId, }) {
        _CoreCrypto_module.set(this, void 0);
        _CoreCrypto_ccFFI.set(this, void 0);
        _CoreCrypto_cc.set(this, void 0);
        __classPrivateFieldSet(this, _CoreCrypto_module, wasmModule, "f");
        __classPrivateFieldSet(this, _CoreCrypto_cc, __classPrivateFieldGet(this, _CoreCrypto_module, "f").instance.exports.init_with_path_and_key(path, key, clientId), "f");
        __classPrivateFieldSet(this, _CoreCrypto_ccFFI, __classPrivateFieldGet(this, _CoreCrypto_module, "f").instance.exports, "f");
    }
    static async init(wasmFile, params) {
        const wasmModule = await WebAssembly.instantiateStreaming(fetch(wasmFile), {});
        const self = new CoreCrypto(Object.assign({ wasmModule }, params));
        return self;
    }
    static async initStubbed(_wasmFile, params) {
        const wasmModule = stubFfiModule();
        const self = new CoreCrypto(Object.assign({ wasmModule }, params));
        return self;
    }
    createConversation(conversationId, { extraMembers, admins, ciphersuite, keyRotationSpan }) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_create_conversation(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), conversationId, {
            extra_members: extraMembers !== null && extraMembers !== void 0 ? extraMembers : [],
            admins: admins !== null && admins !== void 0 ? admins : [],
            ciphersuite,
            key_rotation_span: keyRotationSpan,
        });
    }
    decryptMessage(conversationId, payload) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_decrypt_message(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), conversationId, payload);
    }
    encryptMessage(conversationId, message) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_encrypt_message(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), conversationId, message);
    }
    processWelcomeMessage(welcomeMessage, { extraMembers, admins, ciphersuite, keyRotationSpan }) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_process_welcome_message(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), welcomeMessage, {
            extra_members: extraMembers !== null && extraMembers !== void 0 ? extraMembers : [],
            admins: admins !== null && admins !== void 0 ? admins : [],
            ciphersuite,
            key_rotation_span: keyRotationSpan,
        });
    }
    clientPublicKey() {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_client_public_key(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"));
    }
    clientKeypackages(amountRequested) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_client_keypackages(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), amountRequested);
    }
    addClientsToConverastion(conversationId, clients) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_add_clients_to_conversation(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), conversationId, clients);
    }
    removeClientsFromConversation(conversationId, clients) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_remove_clients_from_conversation(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), conversationId, clients);
    }
    conversationExists(conversationId) {
        return __classPrivateFieldGet(this, _CoreCrypto_ccFFI, "f").cc_conversation_exists(__classPrivateFieldGet(this, _CoreCrypto_cc, "f"), conversationId);
    }
    version() {
        return __classPrivateFieldGet(this, _CoreCrypto_module, "f").instance.exports.cc_version();
    }
}
exports.CoreCrypto = CoreCrypto;
_CoreCrypto_module = new WeakMap(), _CoreCrypto_ccFFI = new WeakMap(), _CoreCrypto_cc = new WeakMap();
//# sourceMappingURL=CoreCrypto.js.map