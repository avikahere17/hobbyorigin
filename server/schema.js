export const typeDefs = `#graphql
  enum AgeGroup { KIDS TEENS ADULTS SENIORS }
  enum Theme { PLAYFUL STANDARD ACCESSIBLE }
  enum ProductType { PHYSICAL DIGITAL }
  enum CampaignGoal { AWARENESS SIGNUPS DONATIONS }
  enum EventStatus { UPCOMING LIVE ENDED }
  enum Currency { GBP USD INR }
  enum SupportedLocale { en_GB en_US en_IN hi_IN }
  enum ServiceType { CHARITY PAID BOTH }
  enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED }
  enum UserRole { USER EXPERT SELLER ADMIN }
  enum MessageType { TEXT VIDEO IMAGE LINK AUDIO }
  enum ContentType { ARTICLE VIDEO AUDIO }
  enum WebinarStatus { SCHEDULED LIVE ENDED CANCELLED }

  type Location {
    building: String
    neighborhood: String
    city: String
    country: String
    lat: Float
    lng: Float
  }

  type Schedule {
    day: String
    time: String
    frequency: String
    duration: Int
    nextSession: String
  }

  type NotificationPrefs {
    session_reminder: Boolean
    new_member: Boolean
    new_buddy: Boolean
  }

  type User {
    id: ID!
    name: String!
    email: String!
    bio: String!
    interests: [String!]!
    avatarColor: String!
    age: Int
    ageGroup: AgeGroup!
    theme: Theme!
    role: UserRole!
    location: Location!
    language: String!
    currency: String!
    locale: String!
    joinedGroups: [Group!]!
    unreadCount: Int!
    tipsEarned: Int!
    walletCoins: Int!
    children: [User!]!
    createdAt: String!
  }

  type Group {
    id: ID!
    name: String!
    description: String!
    category: String!
    tags: [String!]!
    maxMembers: Int!
    memberCount: Int!
    ageGroups: [AgeGroup!]!
    location: Location!
    schedule: Schedule
    members: [User!]!
    messages: [Message!]!
    creator: User!
    isOpen: Boolean!
    isMember: Boolean!
    isPrivate: Boolean!
    isGroupAdmin: Boolean!
    events: [Event!]!
    products: [Product!]!
    campaigns: [Campaign!]!
    isSeeded: Boolean!
    webinars: [Webinar!]!
    createdAt: String!
  }

  type Message {
    id: ID!
    content: String!
    messageType: MessageType!
    videoUrl: String
    sender: User!
    groupId: ID!
    createdAt: String!
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    message: String!
    isRead: Boolean!
    groupId: ID
    actorId: ID
    scheduledFor: String
    createdAt: String!
  }

  type FolkResult {
    user: User!
    sharedInterests: [String!]!
    proximity: String!
    buddyStatus: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Tip {
    id: ID!
    fromId: ID!
    toId: ID!
    groupId: ID
    amount: Int!
    message: String!
    createdAt: String!
  }

  type Event {
    id: ID!
    groupId: ID!
    title: String!
    description: String!
    videoUrl: String!
    startsAt: String!
    durationMins: Int!
    capacity: Int!
    ticketPrice: Int!
    status: EventStatus!
    registrationCount: Int!
    isRegistered: Boolean!
    creator: User!
    createdAt: String!
  }

  type Product {
    id: ID!
    groupId: ID!
    name: String!
    description: String!
    price: Int!
    productType: ProductType!
    imageEmoji: String!
    stock: Int!
    creator: User!
    createdAt: String!
  }

  type Campaign {
    id: ID!
    groupId: ID!
    title: String!
    goal: CampaignGoal!
    description: String!
    targetAgeGroups: [AgeGroup!]!
    targetCity: String!
    startDate: String!
    endDate: String!
    creator: User!
    createdAt: String!
  }

  type Expert {
    id: ID!
    user: User!
    headline: String!
    bio: String!
    skills: [String!]!
    serviceType: ServiceType!
    hourlyRate: Int!
    currency: String!
    languages: [String!]!
    countries: [String!]!
    isElderSupport: Boolean!
    isVerified: Boolean!
    ratingAvg: Float
    ratingCount: Int!
    totalSessions: Int!
    availability: String!
    reviews: [ExpertReview!]!
    createdAt: String!
  }

  type ExpertReview {
    id: ID!
    expertId: ID!
    userId: ID!
    bookingId: ID!
    rating: Int!
    comment: String!
    reviewer: User!
    createdAt: String!
  }

  type ExpertBooking {
    id: ID!
    expert: Expert!
    user: User!
    skill: String!
    serviceType: ServiceType!
    scheduledAt: String!
    durationMins: Int!
    amount: Int!
    currency: String!
    status: BookingStatus!
    notes: String!
    meetingUrl: String!
    createdAt: String!
  }

  type Wallet {
    userId: ID!
    coins: Int!
    # Coin value in user's local currency (e.g. £0.01 per coin)
    coinValueLocal: Float!
    coinCurrency: String!
  }

  type ProductOrder {
    id: ID!
    productId: ID!
    userId: ID!
    quantity: Int!
    totalCoins: Int!
    totalAmount: Int!       # in smallest currency unit (pence/cents)
    currency: String!
    paymentMethod: String!  # "coins" | "card"
    status: String!         # "pending" | "confirmed" | "delivered" | "cancelled"
    deliveryAddress: String
    createdAt: String!
    product: Product
  }

  type CoinCashout {
    id: ID!
    userId: ID!
    coins: Int!
    amount: Int!            # in smallest currency unit
    currency: String!
    status: String!         # "pending" | "paid" | "failed"
    createdAt: String!
  }

  type Coupon {
    id: ID!
    code: String!
    description: String!
    discountPct: Int!
    maxUses: Int!
    usedCount: Int!
    groupId: ID
    expiresAt: String
    isActive: Boolean!
    seller: User!
    createdAt: String!
  }

  type LearningContent {
    id: ID!
    contentType: ContentType!
    title: String!
    body: String!
    mediaUrl: String!
    thumbnailUrl: String!
    category: String!
    tags: [String!]!
    author: User!
    isPublished: Boolean!
    viewCount: Int!
    createdAt: String!
  }

  type Webinar {
    id: ID!
    groupId: ID!
    title: String!
    description: String!
    meetingUrl: String!
    startsAt: String!
    durationMins: Int!
    maxAttendees: Int!
    status: WebinarStatus!
    rewardTotal: Int!
    attendeeCount: Int!
    isAttending: Boolean!
    host: User!
    attendees: [User!]!
    createdAt: String!
  }

  type CookiePreferences {
    necessary: Boolean!
    analytics: Boolean!
    marketing: Boolean!
  }

  type PrivacySettings {
    userId: ID!
    termsAcceptedAt: String
    privacyAcceptedAt: String
    marketingConsent: Boolean!
    analyticsConsent: Boolean!
    doNotSell: Boolean!
    dataProcessingConsent: Boolean!
    cookiePreferences: CookiePreferences!
    lastUpdated: String!
  }

  type AdminStats {
    totalUsers: Int!
    totalGroups: Int!
    totalMessages: Int!
    totalExperts: Int!
    totalBookings: Int!
    totalCoupons: Int!
    recentUsers: [User!]!
    recentGroups: [Group!]!
  }

  type Query {
    me: User
    groups(category: String, search: String, city: String, building: String, ageGroup: AgeGroup): [Group!]!
    group(id: ID!): Group
    user(id: ID!): User
    findFolks(interests: [String!], city: String, building: String, neighborhood: String, ageGroup: AgeGroup): [FolkResult!]!
    myNotifications: [Notification!]!
    myWallet: Wallet!
    myOrders: [ProductOrder!]!
    groupEvents(groupId: ID!): [Event!]!
    groupProducts(groupId: ID!): [Product!]!
    groupCampaigns(groupId: ID!): [Campaign!]!
    searchExperts(skill: String, isElderSupport: Boolean, country: String, serviceType: ServiceType): [Expert!]!
    expert(id: ID!): Expert
    myExpertProfile: Expert
    myBookings: [ExpertBooking!]!
    expertBookings: [ExpertBooking!]!
    myCoupons: [Coupon!]!
    coupon(code: String!): Coupon
    adminStats: AdminStats!
    adminUsers(search: String, role: UserRole): [User!]!
    myPrivacySettings: PrivacySettings
    learningContent(category: String, contentType: ContentType, search: String): [LearningContent!]!
    learningContentItem(id: ID!): LearningContent
    groupWebinars(groupId: ID!): [Webinar!]!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, age: Int, city: String, country: String, building: String, neighborhood: String, currency: String, locale: String, lat: Float, lng: Float): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(bio: String, interests: [String!], age: Int, building: String, neighborhood: String, city: String, country: String, language: String, theme: Theme, currency: String, locale: String, lat: Float, lng: Float): User!
    createGroup(name: String!, description: String!, category: String!, tags: [String!], maxMembers: Int!, ageGroups: [AgeGroup!], city: String, building: String, neighborhood: String, scheduleDay: String, scheduleTime: String, scheduleFrequency: String, scheduleDuration: Int): Group!
    joinGroup(groupId: ID!): Group!
    leaveGroup(groupId: ID!): Group!
    deleteGroup(groupId: ID!): Boolean!
    makeGroupPrivate(groupId: ID!, isPrivate: Boolean!): Group!
    assignGroupAdmin(groupId: ID!, userId: ID!): Group!
    createPaymentIntent(amount: Int!, currency: String, description: String): PaymentIntent!
    confirmTipPayment(paymentIntentId: String!, toUserId: ID!, groupId: ID, amount: Int!, message: String): Tip!
    buyProductWithCoins(productId: ID!, quantity: Int, deliveryAddress: String): ProductOrder!
    buyProductWithCard(productId: ID!, quantity: Int, paymentIntentId: String!, deliveryAddress: String): ProductOrder!
    cashoutCoins(coins: Int!): CoinCashout!
    sendMessage(groupId: ID!, content: String!, messageType: MessageType, videoUrl: String): Message!
    sendBuddyRequest(toUserId: ID!): Boolean!
    markNotificationsRead: Boolean!
    sendTip(toUserId: ID!, groupId: ID, amount: Int!, message: String): Tip!
    createEvent(groupId: ID!, title: String!, description: String, videoUrl: String, startsAt: String!, durationMins: Int, capacity: Int, ticketPrice: Int): Event!
    registerForEvent(eventId: ID!): Event!
    unregisterFromEvent(eventId: ID!): Event!
    createProduct(groupId: ID!, name: String!, description: String, price: Int!, productType: ProductType, imageEmoji: String, stock: Int): Product!
    createCampaign(groupId: ID!, title: String!, goal: CampaignGoal, description: String, targetAgeGroups: [AgeGroup!], targetCity: String, startDate: String!, endDate: String!): Campaign!
    addCoins(userId: ID!, amount: Int!): Wallet!
    linkChild(childEmail: String!): User!
    registerAsExpert(headline: String!, bio: String, skills: [String!]!, serviceType: ServiceType, hourlyRate: Int, currency: String, languages: [String!], countries: [String!], isElderSupport: Boolean, availability: String): Expert!
    updateExpertProfile(headline: String, bio: String, skills: [String!], serviceType: ServiceType, hourlyRate: Int, currency: String, languages: [String!], countries: [String!], isElderSupport: Boolean, availability: String): Expert!
    bookExpert(expertId: ID!, skill: String!, serviceType: ServiceType, scheduledAt: String!, durationMins: Int, notes: String): ExpertBooking!
    confirmBooking(bookingId: ID!, meetingUrl: String): ExpertBooking!
    cancelBooking(bookingId: ID!): ExpertBooking!
    completeBooking(bookingId: ID!): ExpertBooking!
    reviewExpert(expertId: ID!, bookingId: ID!, rating: Int!, comment: String): Expert!
    registerAsSeller(storeName: String!, description: String): User!
    createCoupon(code: String!, description: String!, discountPct: Int!, maxUses: Int!, groupId: ID, expiresAt: String): Coupon!
    deleteCoupon(id: ID!): Boolean!
    setUserRole(userId: ID!, role: UserRole!): User!
    seedGroups: Boolean!
    createLearningContent(contentType: ContentType!, title: String!, body: String, mediaUrl: String, thumbnailUrl: String, category: String, tags: [String!]): LearningContent!
    deleteLearningContent(id: ID!): Boolean!
    createWebinar(groupId: ID!, title: String!, description: String, meetingUrl: String, startsAt: String!, durationMins: Int, maxAttendees: Int): Webinar!
    joinWebinar(webinarId: ID!): Webinar!
    leaveWebinar(webinarId: ID!): Webinar!
    startWebinar(webinarId: ID!, meetingUrl: String): Webinar!
    endWebinar(webinarId: ID!): Webinar!
    rewardWebinarHost(webinarId: ID!, amount: Int!, message: String): Webinar!
    updatePrivacySettings(marketingConsent: Boolean, analyticsConsent: Boolean, doNotSell: Boolean, dataProcessingConsent: Boolean, cookiePreferences: String): PrivacySettings!
    requestDataExport: String!
    deleteMyAccount(password: String!): Boolean!
    recordConsent(termsAccepted: Boolean, privacyAccepted: Boolean): PrivacySettings!
  }

  type PaymentIntent {
    clientSecret: String!
    paymentIntentId: String!
    amount: Int!
    currency: String!
  }

  type Subscription {
    messageSent(groupId: ID!): Message!
    groupMemberChanged(groupId: ID!): Group!
    notificationReceived: Notification!
  }
`;
