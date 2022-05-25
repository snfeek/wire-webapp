import { Confirmation } from '@wireapp/protocol-messaging';
import { AbortReason } from '..';
import { EncryptedAssetUploaded } from '../../cryptography';
import type { ButtonActionConfirmationContent, ButtonActionContent, CallingContent, FileContent, FileMetaDataContent, ImageContent, KnockContent, LegalHoldStatus, LocationContent, ReactionContent } from '../content';
import { CompositeContentBuilder } from './CompositeContentBuilder';
import type { ButtonActionConfirmationMessage, ButtonActionMessage, CallMessage, ConfirmationMessage, FileAssetAbortMessage, FileAssetMessage, FileAssetMetaDataMessage, ImageAssetMessageOutgoing, LocationMessage, PingMessage, ReactionMessage, ResetSessionMessage } from './OtrMessage';
import { TextContentBuilder } from './TextContentBuilder';
interface BaseOptions {
    conversationId: string;
    from: string;
    messageId?: string;
}
interface CreateImageOptions extends BaseOptions {
    expectsReadConfirmation?: boolean;
    asset: EncryptedAssetUploaded;
    image: ImageContent;
    legalHoldStatus?: LegalHoldStatus;
}
interface CreateFileOptions extends BaseOptions {
    expectsReadConfirmation?: boolean;
    asset: EncryptedAssetUploaded;
    file: FileContent;
    legalHoldStatus?: LegalHoldStatus;
    originalMessageId: string;
}
interface CreateEditedTextOptions extends BaseOptions {
    newMessageText: string;
    originalMessageId: string;
}
interface CreateFileMetadataOptions extends BaseOptions {
    expectsReadConfirmation?: boolean;
    legalHoldStatus?: LegalHoldStatus;
    metaData: FileMetaDataContent;
}
interface CreateFileAbortOptions {
    conversationId: string;
    expectsReadConfirmation?: boolean;
    from: string;
    legalHoldStatus?: LegalHoldStatus;
    originalMessageId: string;
    reason: AbortReason;
}
interface CreateLocationOptions extends BaseOptions {
    location: LocationContent;
}
interface CreateCallOptions extends BaseOptions {
    content: CallingContent;
}
interface CreateReactionOptions extends BaseOptions {
    reaction: ReactionContent;
}
interface CreateTextOptions extends BaseOptions {
    text: string;
}
interface CreateConfirmationOptions extends BaseOptions {
    firstMessageId: string;
    moreMessageIds?: string[];
    type: Confirmation.Type;
}
interface CreatePingOptions extends BaseOptions {
    ping?: KnockContent;
}
interface CreateButtonActionConfirmationOptions extends BaseOptions {
    content: ButtonActionConfirmationContent;
}
interface CreateActionMessageOptions extends BaseOptions {
    content: ButtonActionContent;
}
export declare class MessageBuilder {
    static createEditedText(payload: CreateEditedTextOptions): TextContentBuilder;
    static createFileData(payload: CreateFileOptions): FileAssetMessage;
    static createFileMetadata(payload: CreateFileMetadataOptions): FileAssetMetaDataMessage;
    static createFileAbort(payload: CreateFileAbortOptions): FileAssetAbortMessage;
    static createImage(payload: CreateImageOptions): ImageAssetMessageOutgoing;
    static createLocation(payload: CreateLocationOptions): LocationMessage;
    static createCall(payload: CreateCallOptions): CallMessage;
    static createReaction(payload: CreateReactionOptions): ReactionMessage;
    static createText(payload: CreateTextOptions): TextContentBuilder;
    static createConfirmation(payload: CreateConfirmationOptions): ConfirmationMessage;
    static createButtonActionMessage(payload: CreateActionMessageOptions): ButtonActionMessage;
    static createButtonActionConfirmationMessage(payload: CreateButtonActionConfirmationOptions): ButtonActionConfirmationMessage;
    static createComposite(payload: BaseOptions): CompositeContentBuilder;
    static createPing(payload: CreatePingOptions): PingMessage;
    static createSessionReset(payload: BaseOptions): ResetSessionMessage;
    static createId(): string;
}
export {};
