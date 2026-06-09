import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GROUPS_QUERY, JOIN_GROUP_MUTATION } from '../graphql';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Programming', 'Art & Design', 'Music', 'Gaming', 'Science', 'Writing', 'Other'];

function GroupCard({ group, onPress, onJoin, currentUserId }) {
  const pct = group.memberCount / group.maxMembers;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.cardTop}>
        <View style={[s.badge, { backgroundColor: '#6366f122' }]}>
          <Text style={[s.badgeText, { color: '#6366f1' }]}>{group.category}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: group.isOpen ? '#10b98122' : '#ef444422' }]}>
          <Text style={[s.badgeText, { color: group.isOpen ? '#10b981' : '#ef4444' }]}>
            {group.isOpen ? '● Open' : '● Full'}
          </Text>
        </View>
      </View>
      <Text style={s.cardTitle}>{group.name}</Text>
      <Text style={s.cardDesc} numberOfLines={2}>{group.description}</Text>
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: pct >= 1 ? '#ef4444' : '#6366f1' }]} />
      </View>
      <View style={s.cardFooter}>
        <Text style={s.memberCount}>{group.memberCount}/{group.maxMembers} members</Text>
        {!group.isMember ? (
          <TouchableOpacity style={[s.joinBtn, !group.isOpen && s.joinBtnDisabled]} onPress={onJoin} disabled={!group.isOpen}>
            <Text style={s.joinBtnText}>{group.isOpen ? 'Join' : 'Full'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.memberBadge}><Text style={s.memberBadgeText}>✓ Member</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const { currentUser } = useAuth();

  const { data, loading, refetch } = useQuery(GROUPS_QUERY, {
    variables: { category: category === 'All' ? undefined : category, search: search || undefined },
    pollInterval: 15000,
  });

  const [joinGroup] = useMutation(JOIN_GROUP_MUTATION, {
    refetchQueries: [{ query: GROUPS_QUERY }],
  });

  const handleJoin = async (groupId) => {
    if (!currentUser) { navigation.navigate('Auth'); return; }
    try {
      await joinGroup({ variables: { groupId } });
      navigation.navigate('GroupDetail', { groupId });
    } catch (e) { alert(e.message); }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🔗 HobbyOrigin</Text>
        <TextInput style={s.searchInput} placeholder="Search groups…" placeholderTextColor="#8888aa" value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categories} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[s.catBtn, category === c && s.catBtnActive]} onPress={() => setCategory(c)}>
            <Text style={[s.catBtnText, category === c && s.catBtnTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !data ? (
        <View style={s.center}><ActivityIndicator color="#6366f1" size="large" /></View>
      ) : (
        <FlatList
          data={data?.groups || []}
          keyExtractor={g => g.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#6366f1" />}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              currentUserId={currentUser?.id}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
              onJoin={() => handleJoin(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}><Text style={s.emptyIcon}>🌱</Text><Text style={s.emptyText}>No groups found</Text></View>
          }
        />
      )}

      {currentUser && (
        <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#16162a', borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  headerTitle: { color: '#e8e8f5', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  searchInput: { backgroundColor: '#1e1e35', color: '#e8e8f5', borderRadius: 10, padding: 10, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, borderColor: '#2a2a4a' },
  categories: { flexGrow: 0, paddingVertical: 12, backgroundColor: '#16162a' },
  catBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16162a', borderWidth: 1, borderColor: '#2a2a4a' },
  catBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  catBtnText: { color: '#8888aa', fontSize: 13, fontWeight: '500' },
  catBtnTextActive: { color: '#fff' },
  card: { backgroundColor: '#16162a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2a2a4a' },
  cardTop: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { color: '#e8e8f5', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#8888aa', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  progressBar: { height: 4, backgroundColor: '#252545', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberCount: { color: '#8888aa', fontSize: 12 },
  joinBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  joinBtnDisabled: { backgroundColor: '#2a2a4a' },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  memberBadge: { backgroundColor: '#10b98122', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  memberBadgeText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#8888aa', fontSize: 16 },
  fab: { position: 'absolute', bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
