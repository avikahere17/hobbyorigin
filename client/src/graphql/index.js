import { gql } from '@apollo/client';

const USER_FIELDS = `id name email bio interests avatarColor age ageGroup theme role language currency locale unreadCount tipsEarned walletCoins createdAt
  location { building neighborhood city country lat lng }
  children { id name age ageGroup avatarColor walletCoins }`;

const GROUP_FIELDS = `id name description category tags maxMembers memberCount isOpen isMember isPrivate isGroupAdmin createdAt
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
    messages { id content messageType videoUrl createdAt groupId sender { id name avatarColor ageGroup } }
    events { ${EVENT_FIELDS} }
    products { ${PRODUCT_FIELDS} }
    campaigns { ${CAMPAIGN_FIELDS} }
    webinars { id title description meetingUrl startsAt durationMins status rewardTotal attendeeCount isAttending host { id name avatarColor } }
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

export const REGISTER_MUTATION = gql`mutation Register($name:String!,$email:String!,$password:String!,$age:Int,$city:String,$country:String,$building:String,$neighborhood:String,$currency:String,$locale:String) {
  register(name:$name,email:$email,password:$password,age:$age,city:$city,country:$country,building:$building,neighborhood:$neighborhood,currency:$currency,locale:$locale) {
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

export const SEND_MESSAGE_MUTATION = gql`mutation SendMessage($groupId:ID!,$content:String!,$messageType:MessageType,$videoUrl:String) {
  sendMessage(groupId:$groupId,content:$content,messageType:$messageType,videoUrl:$videoUrl) { id content messageType videoUrl createdAt groupId sender { id name avatarColor } }
}`;

export const UPDATE_PROFILE_MUTATION = gql`mutation UpdateProfile($bio:String,$interests:[String!],$age:Int,$building:String,$neighborhood:String,$city:String,$country:String,$language:String,$theme:Theme,$currency:String,$locale:String,$lat:Float,$lng:Float) {
  updateProfile(bio:$bio,interests:$interests,age:$age,building:$building,neighborhood:$neighborhood,city:$city,country:$country,language:$language,theme:$theme,currency:$currency,locale:$locale,lat:$lat,lng:$lng) {
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
  messageSent(groupId:$groupId) { id content messageType videoUrl createdAt groupId sender { id name avatarColor } }
}`;

export const GROUP_MEMBER_SUBSCRIPTION = gql`subscription GroupMemberChanged($groupId:ID!) {
  groupMemberChanged(groupId:$groupId) { id memberCount isOpen members { id name avatarColor } }
}`;

export const NOTIFICATION_SUBSCRIPTION = gql`subscription NotificationReceived {
  notificationReceived { id type title message isRead groupId createdAt }
}`;

/* ═══════════════════════════════════════ EXPERT NETWORK ══════════════════════ */

const EXPERT_FIELDS = `id userId headline bio skills serviceType hourlyRate currency
  languages countries isElderSupport isVerified ratingAvg ratingCount totalSessions availability createdAt
  user { id name avatarColor ageGroup age location { city country building } }
  reviews { id rating comment createdAt reviewer { id name avatarColor } }`;

const BOOKING_FIELDS = `id skill serviceType scheduledAt durationMins amount currency status notes meetingUrl createdAt
  expert { id userId headline skills ratingAvg user { id name avatarColor } }
  user { id name avatarColor }`;

export const SEARCH_EXPERTS_QUERY = gql`query SearchExperts($skill:String,$isElderSupport:Boolean,$country:String,$serviceType:ServiceType) {
  searchExperts(skill:$skill,isElderSupport:$isElderSupport,country:$country,serviceType:$serviceType) { ${EXPERT_FIELDS} }
}`;

export const EXPERT_QUERY = gql`query Expert($id:ID!) { expert(id:$id) { ${EXPERT_FIELDS} } }`;

export const MY_EXPERT_PROFILE_QUERY = gql`query MyExpertProfile { myExpertProfile { ${EXPERT_FIELDS} } }`;

export const MY_BOOKINGS_QUERY = gql`query MyBookings { myBookings { ${BOOKING_FIELDS} } }`;

export const EXPERT_BOOKINGS_QUERY = gql`query ExpertBookings { expertBookings { ${BOOKING_FIELDS} } }`;

export const REGISTER_AS_SELLER_MUTATION = gql`mutation RegisterAsSeller($storeName:String!,$description:String) {
  registerAsSeller(storeName:$storeName,description:$description) { ${USER_FIELDS} joinedGroups { id name } }
}`;

export const REGISTER_AS_EXPERT_MUTATION = gql`mutation RegisterAsExpert($headline:String!,$bio:String,$skills:[String!]!,$serviceType:ServiceType,$hourlyRate:Int,$currency:String,$languages:[String!],$countries:[String!],$isElderSupport:Boolean,$availability:String) {
  registerAsExpert(headline:$headline,bio:$bio,skills:$skills,serviceType:$serviceType,hourlyRate:$hourlyRate,currency:$currency,languages:$languages,countries:$countries,isElderSupport:$isElderSupport,availability:$availability) { ${EXPERT_FIELDS} }
}`;

export const UPDATE_EXPERT_PROFILE_MUTATION = gql`mutation UpdateExpertProfile($headline:String,$bio:String,$skills:[String!],$serviceType:ServiceType,$hourlyRate:Int,$currency:String,$languages:[String!],$countries:[String!],$isElderSupport:Boolean,$availability:String) {
  updateExpertProfile(headline:$headline,bio:$bio,skills:$skills,serviceType:$serviceType,hourlyRate:$hourlyRate,currency:$currency,languages:$languages,countries:$countries,isElderSupport:$isElderSupport,availability:$availability) { ${EXPERT_FIELDS} }
}`;

export const BOOK_EXPERT_MUTATION = gql`mutation BookExpert($expertId:ID!,$skill:String!,$serviceType:ServiceType,$scheduledAt:String!,$durationMins:Int,$notes:String) {
  bookExpert(expertId:$expertId,skill:$skill,serviceType:$serviceType,scheduledAt:$scheduledAt,durationMins:$durationMins,notes:$notes) { ${BOOKING_FIELDS} }
}`;

export const CONFIRM_BOOKING_MUTATION = gql`mutation ConfirmBooking($bookingId:ID!,$meetingUrl:String) {
  confirmBooking(bookingId:$bookingId,meetingUrl:$meetingUrl) { ${BOOKING_FIELDS} }
}`;

export const CANCEL_BOOKING_MUTATION = gql`mutation CancelBooking($bookingId:ID!) {
  cancelBooking(bookingId:$bookingId) { ${BOOKING_FIELDS} }
}`;

export const COMPLETE_BOOKING_MUTATION = gql`mutation CompleteBooking($bookingId:ID!) {
  completeBooking(bookingId:$bookingId) { ${BOOKING_FIELDS} }
}`;

export const REVIEW_EXPERT_MUTATION = gql`mutation ReviewExpert($expertId:ID!,$bookingId:ID!,$rating:Int!,$comment:String) {
  reviewExpert(expertId:$expertId,bookingId:$bookingId,rating:$rating,comment:$comment) { id ratingAvg ratingCount reviews { id rating comment createdAt reviewer { id name } } }
}`;

/* ═══════════════════════════════════════ ADMIN / SELLER ══════════════════════ */

export const ADMIN_STATS_QUERY = gql`query AdminStats {
  adminStats {
    totalUsers totalGroups totalMessages totalExperts totalBookings totalCoupons
    recentUsers { id name email role createdAt avatarColor ageGroup location { city country } }
    recentGroups { id name category memberCount maxMembers createdAt }
  }
}`;

export const ADMIN_USERS_QUERY = gql`query AdminUsers($search:String,$role:UserRole) {
  adminUsers(search:$search,role:$role) { id name email role ageGroup createdAt avatarColor location { city country } }
}`;

export const SET_USER_ROLE_MUTATION = gql`mutation SetUserRole($userId:ID!,$role:UserRole!) {
  setUserRole(userId:$userId,role:$role) { id name email role }
}`;

export const SEED_GROUPS_MUTATION = gql`mutation SeedGroups { seedGroups }`;

const COUPON_FIELDS = `id code description discountPct maxUses usedCount groupId expiresAt isActive createdAt seller { id name avatarColor }`;

export const MY_COUPONS_QUERY = gql`query MyCoupons { myCoupons { ${COUPON_FIELDS} } }`;

export const COUPON_QUERY = gql`query Coupon($code:String!) { coupon(code:$code) { ${COUPON_FIELDS} } }`;

export const CREATE_COUPON_MUTATION = gql`mutation CreateCoupon($code:String!,$description:String!,$discountPct:Int!,$maxUses:Int!,$groupId:ID,$expiresAt:String) {
  createCoupon(code:$code,description:$description,discountPct:$discountPct,maxUses:$maxUses,groupId:$groupId,expiresAt:$expiresAt) { ${COUPON_FIELDS} }
}`;

export const DELETE_COUPON_MUTATION = gql`mutation DeleteCoupon($id:ID!) { deleteCoupon(id:$id) }`;

/* ═══════════════════════════════════════ LEARNING LIBRARY ════════════════════ */

const LC_FIELDS = `id contentType title body mediaUrl thumbnailUrl category tags viewCount createdAt author { id name avatarColor role }`;

export const LEARNING_CONTENT_QUERY = gql`query LearningContent($category:String,$contentType:ContentType,$search:String) {
  learningContent(category:$category,contentType:$contentType,search:$search) { ${LC_FIELDS} }
}`;

export const LEARNING_CONTENT_ITEM_QUERY = gql`query LearningContentItem($id:ID!) {
  learningContentItem(id:$id) { ${LC_FIELDS} }
}`;

export const CREATE_LEARNING_CONTENT_MUTATION = gql`mutation CreateLearningContent($contentType:ContentType!,$title:String!,$body:String,$mediaUrl:String,$thumbnailUrl:String,$category:String,$tags:[String!]) {
  createLearningContent(contentType:$contentType,title:$title,body:$body,mediaUrl:$mediaUrl,thumbnailUrl:$thumbnailUrl,category:$category,tags:$tags) { ${LC_FIELDS} }
}`;

export const DELETE_LEARNING_CONTENT_MUTATION = gql`mutation DeleteLearningContent($id:ID!) { deleteLearningContent(id:$id) }`;

/* ═══════════════════════════════════════ WEBINARS ════════════════════════════ */

const WEBINAR_FIELDS = `id groupId title description meetingUrl startsAt durationMins maxAttendees status rewardTotal attendeeCount isAttending createdAt
  host { id name avatarColor ageGroup tipsEarned }
  attendees { id name avatarColor }`;

export const GROUP_WEBINARS_QUERY = gql`query GroupWebinars($groupId:ID!) {
  groupWebinars(groupId:$groupId) { ${WEBINAR_FIELDS} }
}`;

export const CREATE_WEBINAR_MUTATION = gql`mutation CreateWebinar($groupId:ID!,$title:String!,$description:String,$meetingUrl:String,$startsAt:String!,$durationMins:Int,$maxAttendees:Int) {
  createWebinar(groupId:$groupId,title:$title,description:$description,meetingUrl:$meetingUrl,startsAt:$startsAt,durationMins:$durationMins,maxAttendees:$maxAttendees) { ${WEBINAR_FIELDS} }
}`;

export const JOIN_WEBINAR_MUTATION = gql`mutation JoinWebinar($webinarId:ID!) { joinWebinar(webinarId:$webinarId) { ${WEBINAR_FIELDS} } }`;
export const LEAVE_WEBINAR_MUTATION = gql`mutation LeaveWebinar($webinarId:ID!) { leaveWebinar(webinarId:$webinarId) { ${WEBINAR_FIELDS} } }`;
export const START_WEBINAR_MUTATION = gql`mutation StartWebinar($webinarId:ID!,$meetingUrl:String) { startWebinar(webinarId:$webinarId,meetingUrl:$meetingUrl) { ${WEBINAR_FIELDS} } }`;
export const END_WEBINAR_MUTATION = gql`mutation EndWebinar($webinarId:ID!) { endWebinar(webinarId:$webinarId) { ${WEBINAR_FIELDS} } }`;
export const REWARD_HOST_MUTATION = gql`mutation RewardHost($webinarId:ID!,$amount:Int!,$message:String) { rewardWebinarHost(webinarId:$webinarId,amount:$amount,message:$message) { ${WEBINAR_FIELDS} } }`;

/* ═══════════════════════════════════════ PRIVACY / COMPLIANCE ════════════ */

const PRIVACY_FIELDS = `userId termsAcceptedAt privacyAcceptedAt marketingConsent analyticsConsent doNotSell dataProcessingConsent lastUpdated
  cookiePreferences { necessary analytics marketing }`;

export const MY_PRIVACY_SETTINGS_QUERY = gql`query MyPrivacySettings {
  myPrivacySettings { ${PRIVACY_FIELDS} }
}`;

export const UPDATE_PRIVACY_SETTINGS_MUTATION = gql`mutation UpdatePrivacySettings($marketingConsent:Boolean,$analyticsConsent:Boolean,$doNotSell:Boolean,$dataProcessingConsent:Boolean,$cookiePreferences:String) {
  updatePrivacySettings(marketingConsent:$marketingConsent,analyticsConsent:$analyticsConsent,doNotSell:$doNotSell,dataProcessingConsent:$dataProcessingConsent,cookiePreferences:$cookiePreferences) { ${PRIVACY_FIELDS} }
}`;

export const REQUEST_DATA_EXPORT_MUTATION = gql`mutation RequestDataExport { requestDataExport }`;
export const DELETE_MY_ACCOUNT_MUTATION = gql`mutation DeleteMyAccount($password:String!) { deleteMyAccount(password:$password) }`;
export const RECORD_CONSENT_MUTATION = gql`mutation RecordConsent($termsAccepted:Boolean,$privacyAccepted:Boolean) {
  recordConsent(termsAccepted:$termsAccepted,privacyAccepted:$privacyAccepted) { ${PRIVACY_FIELDS} }
}`;

/* ═══════════════════════════════════════ GROUP ADMIN ═════════════════════ */

export const DELETE_GROUP_MUTATION = gql`mutation DeleteGroup($groupId:ID!) { deleteGroup(groupId:$groupId) }`;
export const MAKE_GROUP_PRIVATE_MUTATION = gql`mutation MakeGroupPrivate($groupId:ID!,$isPrivate:Boolean!) {
  makeGroupPrivate(groupId:$groupId,isPrivate:$isPrivate) { id isPrivate isGroupAdmin }
}`;
export const ASSIGN_GROUP_ADMIN_MUTATION = gql`mutation AssignGroupAdmin($groupId:ID!,$userId:ID!) {
  assignGroupAdmin(groupId:$groupId,userId:$userId) { id isGroupAdmin members { id name avatarColor } }
}`;

/* ═══════════════════════════════════════ PAYMENTS ════════════════════════ */

export const CREATE_PAYMENT_INTENT_MUTATION = gql`mutation CreatePaymentIntent($amount:Int!,$currency:String,$description:String) {
  createPaymentIntent(amount:$amount,currency:$currency,description:$description) { clientSecret paymentIntentId amount currency }
}`;
export const CONFIRM_TIP_PAYMENT_MUTATION = gql`mutation ConfirmTipPayment($paymentIntentId:String!,$toUserId:ID!,$groupId:ID,$amount:Int!,$message:String) {
  confirmTipPayment(paymentIntentId:$paymentIntentId,toUserId:$toUserId,groupId:$groupId,amount:$amount,message:$message) { id amount message }
}`;

/* ═══════════════════════════════════════ WALLET / ORDERS ═════════════════════ */

export const MY_WALLET_FULL_QUERY = gql`query MyWalletFull {
  myWallet { userId coins coinValueLocal coinCurrency }
  myOrders { id productId quantity totalCoins totalAmount currency paymentMethod status deliveryAddress createdAt product { id name imageEmoji price productType } }
}`;

export const BUY_WITH_COINS_MUTATION = gql`mutation BuyWithCoins($productId:ID!,$quantity:Int,$deliveryAddress:String) {
  buyProductWithCoins(productId:$productId,quantity:$quantity,deliveryAddress:$deliveryAddress) {
    id totalCoins totalAmount currency paymentMethod status product { id name imageEmoji }
  }
}`;

export const BUY_WITH_CARD_MUTATION = gql`mutation BuyWithCard($productId:ID!,$quantity:Int,$paymentIntentId:String!,$deliveryAddress:String) {
  buyProductWithCard(productId:$productId,quantity:$quantity,paymentIntentId:$paymentIntentId,deliveryAddress:$deliveryAddress) {
    id totalCoins totalAmount currency paymentMethod status product { id name imageEmoji }
  }
}`;

export const CASHOUT_COINS_MUTATION = gql`mutation CashoutCoins($coins:Int!) {
  cashoutCoins(coins:$coins) { id coins amount currency status createdAt }
}`;
