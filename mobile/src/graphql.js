import { gql } from '@apollo/client';

export const GROUPS_QUERY = gql`
  query Groups($category: String, $search: String) {
    groups(category: $category, search: $search) {
      id name description category tags maxMembers memberCount isOpen isMember
      creator { id name avatarColor }
      members { id name avatarColor }
    }
  }
`;

export const GROUP_QUERY = gql`
  query Group($id: ID!) {
    group(id: $id) {
      id name description category tags maxMembers memberCount isOpen isMember
      creator { id name avatarColor }
      members { id name avatarColor }
      messages { id content createdAt groupId sender { id name avatarColor } }
    }
  }
`;

export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id name bio interests avatarColor createdAt
      joinedGroups { id name category memberCount maxMembers isOpen }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token user { id name email bio interests avatarColor }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token user { id name email bio interests avatarColor }
    }
  }
`;

export const JOIN_GROUP_MUTATION = gql`
  mutation JoinGroup($groupId: ID!) {
    joinGroup(groupId: $groupId) {
      id memberCount isOpen isMember members { id name avatarColor }
    }
  }
`;

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($groupId: ID!, $content: String!) {
    sendMessage(groupId: $groupId, content: $content) {
      id content createdAt groupId sender { id name avatarColor }
    }
  }
`;

export const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageSent($groupId: ID!) {
    messageSent(groupId: $groupId) {
      id content createdAt groupId sender { id name avatarColor }
    }
  }
`;
