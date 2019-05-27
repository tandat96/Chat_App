import React, { Component } from 'react';

import ChatHttpServer from '../../../utils/ChatHttpServer.js';
import ChatSocketServer from '../../../utils/ChatSocketServer.js';

import './Conversation.css';
import { TIMEOUT } from 'dns';

class Conversation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      messageLoading: true,
      conversations: [],
      selectedUser: null
    }
    this.messageContainer = React.createRef();
  }

  componentDidMount() {
    ChatSocketServer.receiveMessage();
    ChatSocketServer.eventEmitter.on('add-message-response', this.receiveSocketMessages);
  }
  
  componentWillUnmount() {
    ChatSocketServer.eventEmitter.removeListener('add-message-response', this.receiveSocketMessages);
  }
  
  componentDidUpdate(prevProps,prevState) {
    // after update seen funtions
    if(this.state.conversations !== prevState.conversations){
      this.getMessages();
    }
    if (prevProps.newSelectedUser === null || (this.props.newSelectedUser.id !== prevProps.newSelectedUser.id)) {
      this.getMessages();
    }
  }


  static getDerivedStateFromProps(props, state) {
    if (state.selectedUser === null || state.selectedUser.id !== props.newSelectedUser.id) {
      return {
        selectedUser: props.newSelectedUser
      };
    }
    return null;
  }

  receiveSocketMessages = (socketResponse) => {
    const { selectedUser } = this.state;
    if (selectedUser !== null && selectedUser.id === socketResponse.fromUserId) {
      this.setState({
        conversations: [...this.state.conversations, socketResponse]
      });
      this.scrollMessageContainer();
    }
  }

  getMessages = async () => {
    try {
      const { userId, newSelectedUser } = this.props;
      const messageResponse = await ChatHttpServer.getMessages(userId, newSelectedUser.id);
      if (!messageResponse.error) {
        this.setState({
          conversations: messageResponse.messages,
        });
        this.scrollMessageContainer();
      } else {
        alert('Unable to fetch messages');
      }
      this.setState({
        messageLoading: false
      });
    } catch (error) {
      this.setState({
        messageLoading: false
      });
    }
  }

  sendMessage = (event) => {
    if (event.key === 'Enter') {
      const message = event.target.value;
      const { userId, newSelectedUser } = this.props;
      if (message === '' || message === undefined || message === null) {
        alert(`Message can't be empty.`);
      } else if (userId === '') {
        this.router.navigate(['/']);
      } else if (newSelectedUser === undefined) {
        alert(`Select a user to chat.`);
      } else {
        this.sendAndUpdateMessages({
          fromUserId: userId,
          message: (message).trim(),
          seen: false,
          toUserId: newSelectedUser.id,
        });
        event.target.value = '';
      }
    }
  }

  sendAndUpdateMessages(message) {
    try {
      ChatSocketServer.sendMessage(message);
      this.setState({
        conversations: [...this.state.conversations, message]
      });
      this.scrollMessageContainer();
    } catch (error) {
      alert(`Can't send your message`);
    }
  }

  scrollMessageContainer() {
    if (this.messageContainer.current !== null) {
      try {
        setTimeout(() => {
          this.messageContainer.current.scrollTop = this.messageContainer.current.scrollHeight;
        }, 100);
      } catch (error) {
        console.warn(error);
      }
    }
  }
  alignMessages(toUserId) {
    const { userId } = this.props;
    return userId !== toUserId;
  }
  // *********************************
  getMessageUI() {
    return (
      <ul ref={this.messageContainer} className="message-thread">
        {
          this.state.conversations.map((conversation, index) =>
            <li className={`${this.alignMessages(conversation.toUserId) ? 'align-right' : 'align-left'}`} key={index}>
              <div className='mssbox'>
                {conversation.message}
              </div>
              <div className={this.state.conversations.indexOf(conversation) === (this.state.conversations.length - 1) ? 'last' : 'not-last'}>
                <div className={(conversation.seen) ? 'seen' : 'unread'}>seen</div>
              </div>
            </li>
          )
        }
      </ul>
    )
  }

  getInitiateConversationUI() {
    if (this.props.newSelectedUser !== null) {
      return (
        <div className="message-thread start-chatting-banner">
          <p className="heading">
            You haven 't chatted with {this.props.newSelectedUser.username} in a while,
            <span className="sub-heading"> Say Hi.</span>
          </p>
        </div>
      )
    }
  }

  //seen
  seen = () => {
    if (this.state.conversations === null || this.state.conversations === '' || this.state.conversations === undefined || this.state.conversations.length === 0) {
      console.log('null data')
    } else {
      if (this.state.conversations[this.state.conversations.length - 1].fromUserId !== this.props.userId) {
        ChatSocketServer.SeenMesseage()
      }
      this.getMessages();
    }
  }

  render() {
    const { messageLoading, selectedUser } = this.state;
    return (
      <>
        <div className={`message-overlay ${!messageLoading ? 'visibility-hidden' : ''}`}>
          <h3> {selectedUser !== null && selectedUser.username ? 'Loading Messages' : ' Select a User to chat.'}</h3>
        </div>
        <div className={`message-wrapper ${messageLoading ? 'visibility-hidden' : ''}`}>
          <div className="message-container">
            <div className="opposite-user">
              Chatting with {this.props.newSelectedUser !== null ? this.props.newSelectedUser.username : '----'}
            </div>
            {this.state.conversations.length > 0 ? this.getMessageUI() : this.getInitiateConversationUI()}
          </div>

          <div className="message-typer">
            <form>
              <textarea className="message form-control" placeholder="Type and hit Enter" onKeyPress={this.sendMessage} onClick={this.seen}>
              </textarea>
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default Conversation;
