/*
 * Wire
 * Copyright (C) 2022 Wire Swiss GmbH
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

import React, {useState} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {Runtime} from '@wireapp/commons';

import {t} from 'Util/LocalizerUtil';

import ModalComponent from 'Components/ModalComponent';
import {useKoSubscribableChildren} from 'Util/ComponentUtil';
import Icon from 'Components/Icon';
import {Config} from '../../../Config';
import {UserState} from '../../../user/UserState';

export interface InviteModalProps {
  readonly userState: UserState;
  onClose?: () => void;
}

const {BRAND_NAME: brandName} = Config.getConfig();

const InviteModalComponent: React.FC<InviteModalProps> = ({userState, onClose}) => {
  const [isInviteMessageSelected, setIsInviteMessageSelected] = useState<boolean>(false);
  const {self: selfUser} = useKoSubscribableChildren(userState, ['self']);
  const userName = selfUser.username();
  const inviteMessage = userName
    ? t('inviteMessage', {brandName: brandName, username: `@${userName}`})
    : t('inviteMessageNoEmail', brandName);

  const metaKey = Runtime.isMacOS() ? t('inviteMetaKeyMac') : t('inviteMetaKeyPc');
  const inviteHint = isInviteMessageSelected ? t('inviteHintSelected', metaKey) : t('inviteHintUnselected', metaKey);

  const onTextClick = () => setIsInviteMessageSelected(true);
  const onBlur = () => setIsInviteMessageSelected(false);

  const onClick = (ev: React.MouseEvent<HTMLTextAreaElement, MouseEvent>) => {
    (ev.target as HTMLTextAreaElement).select();
    onTextClick();
  };

  const onFocus = (ev: React.FocusEvent<HTMLTextAreaElement, Element>) => {
    ev.target.select();
    onTextClick();
  };

  return (
    <div className="invite-modal">
      <ModalComponent isShown onBgClick={onClose} onClosed={onClose} data-uie-name="modal-invite">
        <div className="modal__header">
          <h2 className="modal__header__title" data-uie-name="status-modal-title">
            {t('inviteHeadline', brandName)}
          </h2>

          <button type="button" className="modal__header__button" onClick={onClose} data-uie-name="do-close">
            <Icon.Close />
          </button>
        </div>

        <div className="modal__body invite-modal__body">
          <textarea
            defaultValue={inviteMessage}
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            className="modal__input reset-textarea invite-modal__message"
            dir="auto"
          />

          <div className="modal__info invite-modal__info" data-bind="text: inviteHint">
            {inviteHint}
          </div>
        </div>
      </ModalComponent>
    </div>
  );
};

export default InviteModalComponent;

let modalContainer: HTMLDivElement;
let reactRoot: Root;

const cleanUp = () => {
  if (modalContainer) {
    reactRoot.unmount();
    document.body.removeChild(modalContainer);
    modalContainer = undefined;
  }
};

export const showInviteModal = (props: InviteModalProps) => {
  cleanUp();
  modalContainer = document.createElement('div');
  document.getElementById('wire-main').appendChild(modalContainer);
  reactRoot = createRoot(modalContainer);

  const onClose = () => {
    cleanUp();
    props.onClose?.();
  };

  reactRoot.render(<InviteModalComponent {...props} onClose={onClose} />);
};
