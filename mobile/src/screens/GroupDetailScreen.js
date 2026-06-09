import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GROUP_QUERY, JOIN_GROUP_MUTATION, SEND_MESSAGE_MUTATION, MESSAGE_SUBSCRIPTION } from '../graphql';
import { useAuth } from '../context/AuthContext';

function ChatMessage({ msg, isOwn }) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={[s.msgRow, isOwn && s.msgRowOwn]}>
      {!isOwn && (
        <View style={[s.avatar, { backgroundColor: msg.sender.avatarColor }]}>
          <Text style={s.avatarText}>{msg.sender.name[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={{ maxWidth: '70%' }}>
        {!isOwn && <Text style={s.senderName}>{msg.sender.name}</Text>}
        <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther]}>
          <Text style={[s.bubbleText, isOwn && s.bubbleTextOwn]}>{msg.content}</Text>
        </View>
        <Text style={[s.timeText, isOwn && { textAlign: 'right' }]}>{time}</Text>
      </View>
    </View>
  );
}

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const { data, loading } = useQuery(GROUP_QUERY, { variables: { id: groupId }, fetchPolicy: 'cache-and-network' });
  const [joinGroup] = useMutation(JOIN_GROUP_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id: groupId } }] });
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION);

  useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { groupId },
    onData: ({ data: d }) => {
      const msg = d.data?.messageSent;
      if (msg) setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
    },
  });

  useEffect(() => {
    if (data?.group?.messages) setMessages(data.group.messages);
  }, [data?.group?.id]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    try { await sendMessage({ variables: { groupId, content } }); }
    catch (e) { setText(content); alert(e.message); }
  };

  if (loading && !data) return <View style={s.center}><ActivityIndicator color="#6366f1" size="large" /></View>;
  const group = data?.group;
  if (!group) return null;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.groupName} numberOfLines={1}>{group.name}</Text>
          <Text style={s.groupMeta}>{group.memberCount}/{group.maxMembers} members · {group.category}</Text>
        </View>
        {!group.isMember && group.isOpen && (
          <TouchableOpacity style={s.joinBtn} onPress={() => joinGroup({ variables: { groupId } })}>
            <Text style={s.joinBtnText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <ChatMessage msg={item} isOwn={item.sender.id === currentUser?.id} />}
        ListEmptyComponent={
          <View style={s.emptyChat}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>💬</Text>
            <Text style={{ color: '#8888aa' }}>No messages yet. Say hi!</Text>
          </View>
        }
      />

      {/* Input */}
      {group.isMember ? (
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor="#5a5a7a"
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
            <Text style={s.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.joinPrompt}>
          <Text style={{ color: '#8888aa', fontSize: 14 }}>Join this group to chat</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d1a' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 56, backgroundColor: '#16162a', borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  back: { paddingRight: 4 },
  backText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  groupName: { color: '#e8e8f5', fontSize: 16, fontWeight: '700' },
  groupMeta: { color: '#8888aa', fontSize: 12, marginTop: 2 },
  joinBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  senderName: { color: '#8888aa', fontSize: 11, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
  bubble: { padding: 10, borderRadius: 14 },
  bubbleOwn: { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1e1e35', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#e8e8f5', fontSize: 14, lineHeight: 20 },
  bubbleTextOwn: { color: '#fff' },
  timeText: { color: '#5a5a7a', fontSize: 10, marginTop: 3, marginHorizontal: 4 },
  emptyChat: { alignItems: 'center', paddingTop: 60 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#16162a', borderTopWidth: 1, borderTopColor: '#2a2a4a' },
  input: { flex: 1, backgroundColor: '#1e1e35', color: '#e8e8f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#2a2a4a' },
  sendBtn: { width: 40, height: 40, backgroundColor: '#6366f1', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#2a2a4a' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  joinPrompt: { padding: 16, alignItems: 'center', backgroundColor: '#16162a', borderTopWidth: 1, borderTopColor: '#2a2a4a' },
});
