import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ApolloProvider, useQuery } from '@apollo/client';
import { client } from './apollo';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ME_QUERY } from './graphql';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import GroupDetail from './pages/GroupDetail';
import Profile from './pages/Profile';
import FindFolks from './pages/FindFolks';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import SellerDashboard from './pages/SellerDashboard';
import Learn from './pages/Learn';
import Wallet from './pages/Wallet';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieConsent from './components/CookieConsent';
import './App.css';

// Handles ?join=true / ?login=true / ?role=expert deep-links from the marketing site
function DeepLinkHandler({ openAuth }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) return; // already logged in, nothing to do
    const params = new URLSearchParams(window.location.search);
    const join = params.get('join');
    const login = params.get('login');
    if (join === 'true') {
      openAuth('register');
    } else if (login === 'true') {
      openAuth('login');
    }
    // Clean the query string from the URL without a page reload
    if (join || login) {
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Keeps currentUser in localStorage in sync with the DB — runs on every page load and every 5 min
function UserRefresher() {
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const { data } = useQuery(ME_QUERY, {
    skip: !currentUser,
    fetchPolicy: 'network-only',
    pollInterval: 5 * 60 * 1000, // refresh every 5 min
  });
  useEffect(() => {
    if (data?.me) {
      updateCurrentUser(data.me); // sync fresh data from DB into auth context + localStorage
    } else if (data && data.me === null && currentUser) {
      // Token is no longer valid — clear stale session
      logout();
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function AppContent() {
  const [authModal, setAuthModal] = useState(null);
  const openAuth = (mode = 'login') => setAuthModal(mode);
  const closeAuth = () => setAuthModal(null);

  return (
    <BrowserRouter>
      <UserRefresher />
      <DeepLinkHandler openAuth={openAuth} />
      <Navbar onAuthClick={openAuth} />
      <Routes>
        <Route path="/" element={<Home onAuthRequired={openAuth} />} />
        <Route path="/group/:id" element={<GroupDetail onAuthRequired={openAuth} />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/find-folks" element={<FindFolks onAuthRequired={openAuth} />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/expert" element={<ExpertDashboard />} />
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/wallet" element={<Wallet onAuthRequired={openAuth} />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
      {authModal && <AuthModal mode={authModal} onClose={closeAuth} />}
      <CookieConsent />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ApolloProvider>
  );
}
