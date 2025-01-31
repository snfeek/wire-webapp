/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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

import ko from 'knockout';
import TestPage from 'Util/test/TestPage';
import {CallMessage as CallMessageEntity} from 'src/script/entity/message/CallMessage';
import CallMessage, {CallMessageProps} from './CallMessage';

jest.mock('Components/Icon', () => ({
  Hangup: function HangupIcon() {
    return <span className="hangupicon"></span>;
  },
  Pickup: function PickupIcon() {
    return <span className="pickupicon"></span>;
  },
}));

class CallMessagePage extends TestPage<CallMessageProps> {
  constructor(props?: CallMessageProps) {
    super(CallMessage, props);
  }

  getCallMessage = (completed: 'completed' | 'not_completed') =>
    this.get(`[data-uie-name="element-message-call"]${completed ? `[data-uie-value="${completed}"]` : ''}`);
  getPickupIcon = () => this.get('.pickupicon');
  getHangupIcon = () => this.get('.hangupicon');
}

const createCallMessage = (partialCallMessage: Partial<CallMessageEntity>) => {
  const callMessage: Partial<CallMessageEntity> = {
    caption: ko.pureComputed(() => ''),
    displayTimestampLong: () => '',
    displayTimestampShort: () => '',
    timestamp: ko.observable(Date.now()),
    unsafeSenderName: ko.pureComputed(() => ''),
    ...partialCallMessage,
  };
  return callMessage as CallMessageEntity;
};

describe('CallMessage', () => {
  it('shows green pickup icon for completed calls', async () => {
    const callMessagePage = new CallMessagePage({
      message: createCallMessage({
        wasCompleted: () => true,
      }),
    });

    expect(callMessagePage.getCallMessage('completed')).not.toBeNull();
    expect(callMessagePage.getPickupIcon()).not.toBeNull();
  });

  it('shows red hangup icon for incompleted calls', async () => {
    const callMessagePage = new CallMessagePage({
      message: createCallMessage({
        wasCompleted: () => false,
      }),
    });

    expect(callMessagePage.getCallMessage('not_completed')).not.toBeNull();
    expect(callMessagePage.getHangupIcon()).not.toBeNull();
  });
});
