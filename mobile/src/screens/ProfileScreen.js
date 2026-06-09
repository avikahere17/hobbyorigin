import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@apollo/client';
import { USER_QUERY } from '../graphql';

export default function ProfileScreen({ navigation }) {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return (
      <View style={s.container}>
        <View style={s.center}>
          <Text style={s.emoji}>👤</Text>
          <Text style={s.title}>Sign in to see your profile</Text>
          <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Auth')}>
            <Text style={s.btnText}>Sign in / Join free</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { data } = useQuery(USER_QUERY, { variables: { id: currentUser.id } });
  const user = data?.user || currentUser;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={[s.avatar, { backgroundColor: user.avatarColor }]}>
          <Text style={s.avatarText}>{user.name[0].toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.email}>{user.email}</Text>
        {user.bio ? <Text style={s.bio}>{user.bio}</Text> : null}
        {user.interests?.length > 0 && (
          <View style={s.interestRow}>
            {user.interests.map(i => (
              <View key={i} style={s.interestBadge}><Text style={s.interestText}>{i}</Text></View>
            ))}
          </View>
        )}
      </View>

      <Text style={s.sectionTitle}>My Groups ({user.joinedGroups?.length || 0})</Text>
      <FlatList
        data={user.joinedGroups || []}
        keyExtractor={g => g.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.groupItem} onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}>
            <View style={{ flex: 1 }}>
              <Text style={s.groupName}>{item.name}</Text>
              <Text style={s.groupCat}>{item.category}</Text>
            </View>
            <Text style={s.groupCount}>{item.memberCount}/{item.maxMembers}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>No groups yet — explore and join some!</Text>}
      />

      <TouchableOpacity style={s.logoutBtn} onPress={() => Alert.alert('Sign out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: logout },
      ])}>
        <Text style={s.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { color: '#e8e8f5', fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  header: { alignItems: 'center', padding: 24, paddingTop: 56, backgroundColor: '#16162a', borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { color: '#e8e8f5', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  email: { color: '#8888aa', fontSize: 14, marginBottom: 8 },
  bio: { color: '#e8e8f5', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  interestBadge: { backgroundColor: '#6366f122', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  interestText: { color: '#6366f1', fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: '#8888aa', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, padding: 16, paddingBottom: 8 },
  groupItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16162a', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a2a4a' },
  groupName: { color: '#e8e8f5', fontSize: 15, fontWeight: '600' },
  groupCat: { color: '#8888aa', fontSize: 12, marginTop: 2 },
  groupCount: { color: '#8888aa', fontSize: 13 },
  empty: { color: '#5a5a7a', textAlign: 'center', padding: 20 },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  logoutBtn: { margin: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ef444440', alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
