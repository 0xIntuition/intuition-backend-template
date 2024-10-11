import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  ChainlinkPrice: p.createTable({
    id: p.bigint(),
    usd: p.float(),
  }),

  Stats: p.createTable({
    id: p.int(),
    totalAccounts: p.int(),
    totalAtoms: p.int(),
    totalTriples: p.int(),
    totalPositions: p.int(),
    totalSignals: p.int(),
    totalFees: p.bigint(),
    contractBalance: p.bigint(),
  }),

  StatsHour: p.createTable({
    id: p.int(),
    totalAccounts: p.int(),
    totalAtoms: p.int(),
    totalTriples: p.int(),
    totalPositions: p.int(),
    totalSignals: p.int(),
    totalFees: p.bigint(),
    contractBalance: p.bigint(),
  }),

  EventType: p.createEnum([
    "AtomCreated",
    "TripleCreated",
    "Deposited",
    "Redeemed",
    "FeesTransfered"
  ]),

  Event: p.createTable({
    id: p.string(),
    type: p.enum("EventType"),

    atomId: p.bigint().references("Atom.id").optional(),
    atom: p.one("atomId"),

    tripleId: p.bigint().references("Triple.id").optional(),
    triple: p.one("tripleId"),

    feeTransferId: p.string().references("FeeTransfer.id").optional(),
    feeTransfer: p.one("feeTransferId"),

    depositId: p.string().references("Deposit.id").optional(),
    deposit: p.one("depositId"),

    redemptionId: p.string().references("Redemption.id").optional(),
    redemption: p.one("redemptionId"),

    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    typeIndex: p.index("type"),
    atomIndex: p.index("atomId"),
    tripleIndex: p.index("tripleId"),
    blockNumberIndex: p.index("blockNumber"),
    blockTimestampIndex: p.index("blockTimestamp"),
    transactionHashIndex: p.index("transactionHash"),
  }),

  AccountType: p.createEnum([
    "Default",
    "AtomWallet",
    "ProtocolVault",
  ]),

  Account: p.createTable({
    id: p.string(),
    atomId: p.bigint().references("Atom.id").optional(),
    atom: p.one("atomId"),
    label: p.string(),
    image: p.string().optional(),
    type: p.enum("AccountType"),
    // TODO: add aggregate fields
    // followingCount
    // folowersCount
    createdAtoms: p.many("Atom.creatorId"),
    createdTriples: p.many("Triple.creatorId"),
    feeTransfers: p.many("FeeTransfer.senderId"),
    deposits: p.many("Deposit.senderId"),
    redemptions: p.many("Redemption.senderId"),
    positions: p.many("Position.accountId"),
    signals: p.many("Signal.accountId"),
    claims: p.many("Claim.accountId"),
  }),

  AtomType: p.createEnum([
    "Unknown",
    "Account",
    "Thing",
    "ThingPredicate",
    "Person",
    "PersonPredicate",
    "Organization",
    "OrganizationPredicate",
    "Book",
    "LikeAction",
    "FollowAction",
    "Keywords",
  ]),

  Atom: p.createTable({
    id: p.bigint(),
    walletId: p.string().references("Account.id"),

    creatorId: p.string().references("Account.id"),
    creator: p.one("creatorId"),

    vaultId: p.bigint().references("Vault.id"),
    vault: p.one("vaultId"),

    data: p.string(),
    type: p.enum("AtomType"),
    emoji: p.string().optional(),
    label: p.string().optional(),
    image: p.string().optional(),

    valueId: p.bigint().references("AtomValue.id").optional(),
    value: p.one("valueId"),

    asSubject: p.many("Triple.subjectId"),
    asPredicate: p.many("Triple.predicateId"),
    asObject: p.many("Triple.objectId"),

    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    creatorIndex: p.index("creatorId"),
    vaultIndex: p.index("vaultId"),
  }),

  Triple: p.createTable({
    id: p.bigint(),
    creatorId: p.string().references("Account.id"),
    subjectId: p.bigint().references("Atom.id"),
    predicateId: p.bigint().references("Atom.id"),
    objectId: p.bigint().references("Atom.id"),

    label: p.string().optional(),

    vaultId: p.bigint().references("Vault.id"),
    counterVaultId: p.bigint().references("Vault.id"),

    creator: p.one("creatorId"),
    subject: p.one("subjectId"),
    predicate: p.one("predicateId"),
    object: p.one("objectId"),
    vault: p.one("vaultId"),
    counterVault: p.one("counterVaultId"),

    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    creatorIndex: p.index("creatorId"),
    subjectIndex: p.index("subjectId"),
    predicateIndex: p.index("predicateId"),
    objectIndex: p.index("objectId"),
    vaultIndex: p.index("vaultId"),
  }),

  Vault: p.createTable({
    id: p.bigint(),

    atomId: p.bigint().references("Atom.id").optional(),
    atom: p.one("atomId"),

    tripleId: p.bigint().references("Triple.id").optional(),
    triple: p.one("tripleId"),

    totalShares: p.bigint(),
    currentSharePrice: p.bigint(),
    positionCount: p.int(),
    positions: p.many("Position.vaultId"),
    deposits: p.many("Deposit.vaultId"),
    redemptions: p.many("Redemption.vaultId"),
  }, {
    atomIndex: p.index("atomId"),
    tripleIndex: p.index("tripleId"),
  }),

  FeeTransfer: p.createTable({
    id: p.string(),
    senderId: p.string().references("Account.id"),
    sender: p.one("senderId"),
    receiverId: p.string().references("Account.id"),
    receiver: p.one("receiverId"),
    amount: p.bigint(),
    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    senderIndex: p.index("senderId"),
    receiverIndex: p.index("receiverId"),
  }),

  Deposit: p.createTable({
    id: p.string(),

    senderId: p.string().references("Account.id"),
    sender: p.one("senderId"),

    receiverId: p.string().references("Account.id"),
    receiver: p.one("receiverId"),

    receiverTotalSharesInVault: p.bigint(),
    senderAssetsAfterTotalFees: p.bigint(),
    sharesForReceiver: p.bigint(),
    entryFee: p.bigint(),

    vaultId: p.bigint().references("Vault.id"),
    vault: p.one("vaultId"),

    isTriple: p.boolean(),
    isAtomWallet: p.boolean(),

    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    senderIndex: p.index("senderId"),
    receiverIndex: p.index("receiverId"),
    vaultIndex: p.index("vaultId"),
  }),

  Redemption: p.createTable({
    id: p.string(),

    senderId: p.string().references("Account.id"),
    sender: p.one("senderId"),

    receiverId: p.string().references("Account.id"),
    receiver: p.one("receiverId"),

    senderTotalSharesInVault: p.bigint(),
    assetsForReceiver: p.bigint(),
    sharesRedeemedBySender: p.bigint(),
    exitFee: p.bigint(),

    vaultId: p.bigint().references("Vault.id"),
    vault: p.one("vaultId"),

    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    senderIndex: p.index("senderId"),
    receiverIndex: p.index("receiverId"),
    vaultIndex: p.index("vaultId"),
  }),

  Position: p.createTable({
    id: p.string(),

    accountId: p.string().references("Account.id"),
    account: p.one("accountId"),

    vaultId: p.bigint().references("Vault.id"),
    vault: p.one("vaultId"),

    shares: p.bigint(),
  }, {
    accountIndex: p.index("accountId"),
    vaultIndex: p.index("vaultId"),
  }),

  Claim: p.createTable({
    // triple.id + '-' + account.id
    id: p.string(),
    accountId: p.string().references("Account.id"),
    tripleId: p.bigint().references("Triple.id"),
    subjectId: p.bigint().references("Atom.id"),
    predicateId: p.bigint().references("Atom.id"),
    objectId: p.bigint().references("Atom.id"),

    shares: p.bigint(),
    counterShares: p.bigint(),

    vaultId: p.bigint().references("Vault.id"),
    counterVaultId: p.bigint().references("Vault.id"),

    account: p.one("accountId"),
    triple: p.one("tripleId"),
    subject: p.one("subjectId"),
    predicate: p.one("predicateId"),
    object: p.one("objectId"),
    vault: p.one("vaultId"),
    counterVault: p.one("counterVaultId"),

  }, {
    accountIndex: p.index("accountId"),
    subjectIndex: p.index("subjectId"),
    predicateIndex: p.index("predicateId"),
    objectIndex: p.index("objectId"),
    vaultIndex: p.index("vaultId"),
    tripleIndex: p.index("tripleId"),
  }),

  PredicateObject: p.createTable({
    id: p.string(),
    predicateId: p.bigint().references("Atom.id"),
    predicate: p.one("predicateId"),
    objectId: p.bigint().references("Atom.id"),
    object: p.one("objectId"),
    tripleCount: p.int(),
    claimCount: p.int(),
  }, {
    predicateIndex: p.index("predicateId"),
    objectIndex: p.index("objectId"),
  }),

  Signal: p.createTable({
    id: p.string(),
    delta: p.bigint(),
    relativeStrength: p.bigint(),

    accountId: p.string().references("Account.id"),
    account: p.one("accountId"),

    atomId: p.bigint().references("Atom.id").optional(),
    atom: p.one("atomId"),

    tripleId: p.bigint().references("Triple.id").optional(),
    triple: p.one("tripleId"),

    depositId: p.string().references("Deposit.id").optional(),
    deposit: p.one("depositId"),

    redemptionId: p.string().references("Redemption.id").optional(),
    redemption: p.one("redemptionId"),

    blockNumber: p.bigint(),
    blockTimestamp: p.bigint(),
    transactionHash: p.hex(),
  }, {
    accountIndex: p.index("accountId"),
    atomIndex: p.index("atomId"),
    tripleIndex: p.index("tripleId"),
  }),


  AtomValue: p.createTable({
    id: p.bigint(),
    atomId: p.bigint().references("Atom.id"),

    accountId: p.string().references("Account.id").optional(),
    account: p.one("accountId"),

    thingId: p.bigint().references("Thing.id").optional(),
    thing: p.one("thingId"),

    personId: p.bigint().references("Person.id").optional(),
    person: p.one("personId"),

    organizationId: p.bigint().references("Organization.id").optional(),
    organization: p.one("organizationId"),

    bookId: p.bigint().references("Book.id").optional(),
    book: p.one("bookId"),

  }, {
    atomIndex: p.index("atomId"),
    accountIndex: p.index("accountId"),
    thingIndex: p.index("thingId"),
    personIndex: p.index("personId"),
    organizationIndex: p.index("organizationId"),
    bookIndex: p.index("bookId"),
  }),

  Thing: p.createTable({
    id: p.bigint(),
    atomId: p.bigint().references("Atom.id"),
    atom: p.one("atomId"),

    name: p.string().optional(),
    description: p.string().optional(),
    image: p.string().optional(),
    url: p.string().optional(),
  }, {
    nameIndex: p.index("name"),
    descriptionIndex: p.index("description"),
    urlIndex: p.index("url"),
  }),

  Person: p.createTable({
    id: p.bigint(),
    atomId: p.bigint().references("Atom.id"),
    atom: p.one("atomId"),

    identifier: p.string().optional(),
    name: p.string().optional(),
    description: p.string().optional(),
    image: p.string().optional(),
    url: p.string().optional(),
    email: p.string().optional(),
  }, {
    nameIndex: p.index("name"),
    descriptionIndex: p.index("description"),
    urlIndex: p.index("url"),
  }),

  Organization: p.createTable({
    id: p.bigint(),
    atomId: p.bigint().references("Atom.id"),
    atom: p.one("atomId"),

    name: p.string().optional(),
    description: p.string().optional(),
    image: p.string().optional(),
    url: p.string().optional(),
    email: p.string().optional(),
  }, {
    nameIndex: p.index("name"),
    descriptionIndex: p.index("description"),
    urlIndex: p.index("url"),
  }),

  Book: p.createTable({
    id: p.bigint(),
    atomId: p.bigint().references("Atom.id"),
    atom: p.one("atomId"),

    name: p.string().optional(),
    description: p.string().optional(),
    genre: p.string().optional(),
    url: p.string().optional(),
  }),

}));
