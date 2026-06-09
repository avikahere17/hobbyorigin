import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION, LOGIN_MUTATION } from '../graphql';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const [register, { loading: rLoading }] = useMutation(REGISTER_MUTATION);
  const [loginMutation, { loading: lLoading }] = useMutation(LOGIN_MUTATION);
  const loading = rLoading || lLoading;

  const handleSubmit = async () => {
    try {
      if (mode === 'register') {
        const { data } = await register({ variables: { name, email, password } });
        await login(data.register.token, data.register.user);
      } else {
        const { data } = await loginMutation({ variables: { email, password } });
        await login(data.login.token, data.login.user);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.logo}>🔗</Text>
      <Text style={s.title}>{mode === 'register' ? 'Join HobbyOrigin' : 'Welcome back'}</Text>
      <Text style={s.subtitle}>{mode === 'register' ? 'Find your people, build together.' : 'Sign in to continue.'}</Text>

      {mode === 'register' && (
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#5a5a7a" autoCapitalize="words" />
      )}
      <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#5a5a7a" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#5a5a7a" secureTextEntry />

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</Text>
      </TouchableOpacity>

      <View style={s.switchRow}>
        <Text style={s.switchText}>{mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}</Text>
        <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
          <Text style={s.switchLink}>{mode === 'register' ? 'Sign in' : 'Join free'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  content: { padding: 32, paddingTop: 80 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#e8e8f5', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#8888aa', textAlign: 'center', marginBottom: 32, fontSize: 15 },
  input: { backgroundColor: '#1e1e35', color: '#e8e8f5', borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 14 },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { color: '#8888aa', fontSize: 14 },
  switchLink: { color: '#6366f1', fontWeight: '700', fontSize: 14 },
});
