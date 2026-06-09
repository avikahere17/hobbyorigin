import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { SEND_MESSAGE_MUTATION, MESSAGE_SUBSCRIPTION, GROUP_QUERY } from '../graphql';

function Message({ msg, isOwn }) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isOwn ? 'row-reverse' : 'row', marginBottom: 12 }}>
      <div className="avatar avatar-sm" style={{ background: msg.sender.avatarColor, flexShrink: 0 }}>
        {msg.sender.name[0].toUpperCase()}
      </div>
      <div style={{ maxWidth: '70%' }}>
        {!isOwn && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>{msg.sender.name}</div>
        )}
        <div style={{
          background: isOwn ? 'var(--primary)' : 'var(--surface2)',
          color: isOwn ? '#fff' : 'var(--text)',
          padding: '8px 12px', borderRadius: 12,
          borderTopRightRadius: isOwn ? 4 : 12,
          borderTopLeftRadius: isOwn ? 12 : 4,
          fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, textAlign: isOwn ? 'right' : 'left' }}>{time}</div>
      </div>
    </div>
  );
}

export default function ChatRoom({ group }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState(group.messages || []);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE_MUTATION);

  useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { groupId: group.id },
    onData: ({ data }) => {
      const msg = data.data?.messageSent;
      if (msg) setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
    },
  });

  useEffect(() => {
    setMessages(group.messages || []);
  }, [group.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    const content = text.trim();
    setText('');
    try {
      await sendMessage({ variables: { groupId: group.id, content } });
    } catch (err) {
      setText(content);
      alert(err.message);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const isMember = group.isMember;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            <p style={{ fontWeight: 500 }}>No messages yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Be the first to say something!</p>
          </div>
        ) : (
          messages.map(msg => (
            <Message key={msg.id} msg={msg} isOwn={msg.sender.id === currentUser?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        {isMember ? (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              className="input"
              placeholder={`Message #${group.name}…`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ flex: 1, resize: 'none', minHeight: 42, maxHeight: 120, lineHeight: 1.5 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!text.trim() || loading}
              style={{ flexShrink: 0, width: 42, height: 42, padding: 0, fontSize: 18 }}>
              ↑
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)', fontSize: 14 }}>
            Join this group to participate in the conversation
          </div>
        )}
      </div>
    </div>
  );
}
