import { gql } from '@apollo/client';

const USER_FIELDS = `id name email bio interests avatarColor age ageGroup theme language unreadCount tipsEarned walletCoins createdAt
  location { building neighborhood city country }
  children { id name age ageGroup avatarColor walletCoins }`;

const GROUP_FIELDS = `id name description category tags maxMembers memberCount isOpen isMember createdAt
  ageGroups
  location { building neighborhood city country }
  schedule { day time frequency duration nextSession }
  creator { id name avatarColor ageGroup tipsEarned }
  members { id name avatarColor ageGroup age bio interests }`;

const EVENT_FIELDS = `id groupId title description videoUrl startsAt durationMins capacity ticketPrice status registrationCount isRegistered createdAt
  creator { id name avatarColor }`;

const PRODUCT_FIELDS = `id groupId name description price productType imageEmoji stock createdAt
  creator { id name avatarColor }`;

const CAMPAIGN_FIELDS = `id groupId title goal description targetAgeGroups targetCity startDate endDate createdAt
  creator { id name avatarColor }`;

export const ME_QUERY = gql`query Me { me { ${USER_FIELDS} joinedGroups { id name category memberCount maxMembers isOpen } } }`;

export const GROUPS_QUERY = gql`query Groups($category:String,$search:String,$city:String,$building:String,$ageGroup:AgeGroup) {
  groups(category:$category,search:$search,city:$city,building:$building,ageGroup:$ageGroup) { ${GROUP_FIELDS} }
}`;

export const GROUP_QUERY = gql`query Group($id:ID!) {
  group(id:$id) {
    ${GROUP_FIELDS}
    messages { id content createdAt groupId sender { id name avatarColor ageGroup } }
    events { ${EVENT_FIELDS} }
    products { ${PRODUCT_FIELDS} }
    campaigns { ${CAMPAIGN_FIELDS} }
  }
}`;

export const USER_QUERY = gql`query User($id:ID!) {
  user(id:$id) { ${USER_FIELDS} joinedGroups { id name category memberCount maxMembers isOpen } }
}`;

export const FIND_FOLKS_QUERY = gql`query FindFolks($interests:[String!],$city:String,$building:String,$neighborhood:String,$ageGroup:AgeGroup) {
  findFolks(interests:$interests,city:$city,building:$building,neighborhood:$neighborhood,ageGroup:$ageGroup) {
    sharedInterests proximity buddyStatus
    user { id name bio interests avatarColor age ageGroup tipsEarned location { building neighborhood city } joinedGroups { id name } }
  }
}`;

export const MY_NOTIFICATIONS_QUERY = gql`query MyNotifications {
  myNotifications { id type title message isRead groupId actorId scheduledFor createdAt }
}`;

export const MY_WALLET_QUERY = gql`query MyWallet { myWallet { userId coins } }`;

export const GROUP_EVENTS_QUERY = gql`query GroupEvents($groupId:ID!) {
  groupEvents(groupId:$groupId) { ${EVENT_FIELDS} }
}`;

export const GROUP_PRODUCTS_QUERY = gql`query GroupProducts($groupId:ID!) {
  groupProducts(groupId:$groupId) { ${PRODUCT_FIELDS} }
}`;

export const GROUP_CAMPAIGNS_QUERY = gql`query GroupCampaigns($groupId:ID!) {
  groupCampaigns(groupId:$groupId) { ${CAMPAIGN_FIELDS} }
}`;

export const REGISTER_MUTATION = gql`mutation Register($name:String!,$email:String!,$password:String!,$age:Int,$city:String,$country:String,$building:String,$neighborhood:String) {
  register(name:$name,email:$email,password:$password,age:$age,city:$city,country:$country,building:$building,neighborhood:$neighborhood) {
    token user { ${USER_FIELDS} joinedGroups { id name } }
  }
}`;

export const LOGIN_MUTATION = gql`mutation Login($email:String!,$password:String!) {
  login(email:$email,password:$password) { token user { ${USER_FIELDS} joinedGroups { id name } } }
}`;

export const CREATE_GROUP_MUTATION = gql`mutation CreateGroup($name:String!,$description:String!,$category:String!,$tags:[String!],$maxMembers:Int!,$ageGroups:[AgeGroup!],$city:String,$building:String,$neighborhood:String,$scheduleDay:String,$scheduleTime:String,$scheduleFrequency:String,$scheduleDuration:Int) {
  createGroup(name:$name,description:$description,category:$category,tags:$tags,maxMembers:$maxMembers,ageGroups:$ageGroups,city:$city,building:$building,neighborhood:$neighborhood,scheduleDay:$scheduleDay,scheduleTime:$scheduleTime,scheduleFrequency:$scheduleFrequency,scheduleDuration:$scheduleDuration) {
    ${GROUP_FIELDS}
  }
}`;

export const JOIN_GROUP_MUTATION = gql`mutation JoinGroup($groupId:ID!) {
  joinGroup(groupId:$groupId) { id memberCount isOpen isMember members { id name avatarColor } }
}`;

export const LEAVE_GROUP_MUTATION = gql`mutation LeaveGroup($groupId:ID!) {
  leaveGroup(groupId:$groupId) { id memberCount isOpen isMember members { id name avatarColor } }
}`;

export const SEND_MESSAGE_MUTATION = gql`mutation SendMessage($groupId:ID!,$content:String!) {
  sendMessage(groupId:$groupId,content:$content) { id content createdAt groupId sender { id name avatarColor } }
}`;

export const UPDATE_PROFILE_MUTATION = gql`mutation UpdateProfile($bio:String,$interests:[String!],$age:Int,$building:String,$neighborhood:String,$city:String,$country:String,$language:String,$theme:Theme) {
  updateProfile(bio:$bio,interests:$interests,age:$age,building:$building,neighborhood:$neighborhood,city:$city,country:$country,language:$language,theme:$theme) {
    ${USER_FIELDS}
  }
}`;

export const SEND_BUDDY_MUTATION = gql`mutation SendBuddy($toUserId:ID!) { sendBuddyRequest(toUserId:$toUserId) }`;
export const MARK_READ_MUTATION = gql`mutation MarkRead { markNotificationsRead }`;

export const SEND_TIP_MUTATION = gql`mutation SendTip($toUserId:ID!,$groupId:ID,$amount:Int!,$message:String) {
  sendTip(toUserId:$toUserId,groupId:$groupId,amount:$amount,message:$message) { id amount message createdAt }
}`;

export const REGISTER_FOR_EVENT_MUTATION = gql`mutation RegisterForEvent($eventId:ID!) {
  registerForEvent(eventId:$eventId) { ${EVENT_FIELDS} }
}`;

export const UNREGISTER_FROM_EVENT_MUTATION = gql`mutation UnregisterFromEvent($eventId:ID!) {
  unregisterFromEvent(eventId:$eventId) { ${EVENT_FIELDS} }
}`;

export const CREATE_EVENT_MUTATION = gql`mutation CreateEvent($groupId:ID!,$title:String!,$description:String,$videoUrl:String,$startsAt:String!,$durationMins:Int,$capacity:Int,$ticketPrice:Int) {
  createEvent(groupId:$groupId,title:$title,description:$description,videoUrl:$videoUrl,startsAt:$startsAt,durationMins:$durationMins,capacity:$capacity,ticketPrice:$ticketPrice) { ${EVENT_FIELDS} }
}`;

export const CREATE_PRODUCT_MUTATION = gql`mutation CreateProduct($groupId:ID!,$name:String!,$description:String,$price:Int!,$productType:ProductType,$imageEmoji:String,$stock:Int) {
  createProduct(groupId:$groupId,name:$name,description:$description,price:$price,productType:$productType,imageEmoji:$imageEmoji,stock:$stock) { ${PRODUCT_FIELDS} }
}`;

export const CREATE_CAMPAIGN_MUTATION = gql`mutation CreateCampaign($groupId:ID!,$title:String!,$goal:CampaignGoal,$description:String,$targetAgeGroups:[AgeGroup!],$targetCity:String,$startDate:String!,$endDate:String!) {
  createCampaign(groupId:$groupId,title:$title,goal:$goal,description:$description,targetAgeGroups:$targetAgeGroups,targetCity:$targetCity,startDate:$startDate,endDate:$endDate) { ${CAMPAIGN_FIELDS} }
}`;

export const ADD_COINS_MUTATION = gql`mutation AddCoins($userId:ID!,$amount:Int!) {
  addCoins(userId:$userId,amount:$amount) { userId coins }
}`;

export const LINK_CHILD_MUTATION = gql`mutation LinkChild($childEmail:String!) {
  linkChild(childEmail:$childEmail) { id name age ageGroup avatarColor walletCoins }
}`;

export const MESSAGE_SUBSCRIPTION = gql`subscription MessageSent($groupId:ID!) {
  messageSent(groupId:$groupId) { id content createdAt groupId sender { id name avatarColor } }
}`;

export const GROUP_MEMBER_SUBSCRIPTION = gql`subscription GroupMemberChanged($groupId:ID!) {
  groupMemberChanged(groupId:$groupId) { id memberCount isOpen members { id name avatarColor } }
}`;

export const NOTIFICATION_SUBSCRIPTION = gql`subscription NotificationReceived {
  notificationReceived { id type title message isRead groupId createdAt }
}`;
