import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { client } from './apollo';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function AppContent() {
  const [authModal, setAuthModal] = useState(null);
  const openAuth = (mode = 'login') => setAuthModal(mode);
  const closeAuth = () => setAuthModal(null);

  return (
    <BrowserRouter>
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
      </Routes>
      {authModal && <AuthModal mode={authModal} onClose={closeAuth} />}
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
