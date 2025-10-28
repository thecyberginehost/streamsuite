/**
 * Comprehensive n8n Expressions and Patterns
 */

import { N8N_AUTH_TYPES } from './nodes';

export const N8N_EXPRESSIONS = {
  syntax: '{{ expression }}',
  
  // Data access patterns
  dataAccess: {
    currentItem: '$json',
    specificField: '$json.fieldName',
    nestedField: '$json.user.profile.name',
    arrayAccess: '$json.items[0]',
    nodeData: '$node["Node Name"].json',
    allItems: '$items',
    firstItem: '$items()[0].json',
    lastItem: '$items()[$items().length - 1].json',
    specificItemIndex: '$items()[2].json',
  },

  // Built-in variables
  variables: {
    currentTime: '$now',
    today: '$today',
    workflow: '$workflow',
    execution: '$execution',
    runIndex: '$runIndex',
    itemIndex: '$itemIndex',
    resumeUrl: '$resumeWebhookUrl',
  },

  // String manipulation
  stringFunctions: {
    toLowerCase: '{{ $json.name.toLowerCase() }}',
    toUpperCase: '{{ $json.name.toUpperCase() }}',
    trim: '{{ $json.text.trim() }}',
    split: '{{ $json.text.split(",") }}',
    replace: '{{ $json.text.replace("old", "new") }}',
    substring: '{{ $json.text.substring(0, 10) }}',
    length: '{{ $json.text.length }}',
    includes: '{{ $json.text.includes("search") }}',
    startsWith: '{{ $json.text.startsWith("prefix") }}',
    endsWith: '{{ $json.text.endsWith("suffix") }}',
  },

  // Date and time functions
  dateTimeFunctions: {
    currentISO: '{{ $now.toISO() }}',
    currentFormatted: '{{ $now.toFormat("yyyy-MM-dd HH:mm:ss") }}',
    addTime: '{{ $now.plus({ hours: 1, minutes: 30 }) }}',
    subtractTime: '{{ $now.minus({ days: 7 }) }}',
    parseDate: '{{ DateTime.fromISO($json.date_string) }}',
    formatDate: '{{ DateTime.fromISO($json.created_at).toFormat("MMM dd, yyyy") }}',
    timeAgo: '{{ DateTime.fromISO($json.created_at).toRelative() }}',
    businessHours: '{{ $now.set({ hour: 9, minute: 0, second: 0 }) }}',
    weekStart: '{{ $now.startOf("week") }}',
    monthEnd: '{{ $now.endOf("month") }}',
  },

  // Mathematical operations
  mathFunctions: {
    add: '{{ $json.price + $json.tax }}',
    subtract: '{{ $json.total - $json.discount }}',
    multiply: '{{ $json.quantity * $json.price }}',
    divide: '{{ $json.total / $json.quantity }}',
    percentage: '{{ Math.round(($json.completed / $json.total) * 100) }}',
    round: '{{ Math.round($json.value) }}',
    floor: '{{ Math.floor($json.value) }}',
    ceil: '{{ Math.ceil($json.value) }}',
    min: '{{ Math.min($json.val1, $json.val2) }}',
    max: '{{ Math.max($json.val1, $json.val2) }}',
    absolute: '{{ Math.abs($json.value) }}',
    random: '{{ Math.random() }}',
  },

  // Array operations
  arrayFunctions: {
    length: '{{ $json.items.length }}',
    join: '{{ $json.tags.join(", ") }}',
    map: '{{ $json.items.map(item => item.name) }}',
    filter: '{{ $json.items.filter(item => item.active) }}',
    find: '{{ $json.items.find(item => item.id === "123") }}',
    includes: '{{ $json.tags.includes("urgent") }}',
    slice: '{{ $json.items.slice(0, 5) }}',
    sort: '{{ $json.items.sort((a, b) => a.name.localeCompare(b.name)) }}',
    reduce: '{{ $json.items.reduce((sum, item) => sum + item.price, 0) }}',
    flatten: '{{ $json.nestedArray.flat() }}',
    unique: '{{ [...new Set($json.items)] }}',
  },

  // Conditional logic
  conditionalLogic: {
    ternary: '{{ $json.status === "active" ? "✅ Active" : "❌ Inactive" }}',
    nullCoalescing: '{{ $json.name || "Unknown" }}',
    andCondition: '{{ $json.active && $json.verified }}',
    orCondition: '{{ $json.role === "admin" || $json.role === "moderator" }}',
    complexCondition: '{{ $json.score > 80 ? "Excellent" : $json.score > 60 ? "Good" : "Needs Improvement" }}',
    existence: '{{ $json.email && $json.email.includes("@") }}',
  },

  // Object manipulation
  objectFunctions: {
    keys: '{{ Object.keys($json) }}',
    values: '{{ Object.values($json) }}',
    entries: '{{ Object.entries($json) }}',
    assign: '{{ Object.assign({}, $json, { newField: "value" }) }}',
    hasProperty: '{{ $json.hasOwnProperty("email") }}',
    destructure: '{{ const { name, email } = $json; return { name, email, processed: true } }}',
  },

  // Advanced patterns
  advancedPatterns: {
    safeAccess: '{{ $json.user?.profile?.name || "No name" }}',
    emailDomain: '{{ $json.email.split("@")[1] }}',
    slugify: '{{ $json.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }}',
    formatCurrency: '{{ new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format($json.amount) }}',
    randomId: '{{ Math.random().toString(36).substring(2, 15) }}',
    initials: '{{ $json.name.split(" ").map(n => n[0]).join("").toUpperCase() }}',
    isWeekend: '{{ [0, 6].includes($now.weekday) }}',
    quarterOfYear: '{{ Math.ceil($now.month / 3) }}',
  },

  // Loop and batch expressions
  loopExpressions: {
    allLoopItems: '{{ $("Loop Over Items").all() }}',
    currentBatchIndex: '{{ $runIndex }}',
    totalBatches: '{{ Math.ceil($items().length / 10) }}',
    isLastBatch: '{{ $runIndex === Math.ceil($items().length / 10) - 1 }}',
    batchProgress: '{{ Math.round((($runIndex + 1) / Math.ceil($items().length / 10)) * 100) }}',
    itemsInCurrentBatch: '{{ $items().length }}',
  },

  // Error handling expressions
  errorHandling: {
    hasError: '{{ $json.error !== undefined }}',
    errorMessage: '{{ $json.error?.message || "Unknown error" }}',
    httpSuccess: '{{ $statusCode >= 200 && $statusCode < 300 }}',
    httpError: '{{ $statusCode >= 400 }}',
    validateEmail: '{{ /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($json.email) }}',
    validatePhone: '{{ /^\+?[\d\s\-\(\)]+$/.test($json.phone) }}',
    notEmpty: '{{ $json.field && $json.field.trim().length > 0 }}',
  },
} as const;

export const N8N_PARAMETER_PATTERNS = {
  resource: {
    description: 'The main resource type to operate on (e.g., message, user, file)',
    type: 'options',
    required: true,
    examples: ['message', 'user', 'channel', 'file', 'issue', 'order']
  },
  operation: {
    description: 'The operation to perform on the resource',
    type: 'options',
    required: true,
    examples: ['create', 'get', 'getAll', 'update', 'delete', 'send', 'list']
  },
  authentication: {
    description: 'Authentication method to use for API calls',
    type: 'options',
    options: Object.keys(N8N_AUTH_TYPES),
  },
  url: {
    description: 'The URL to make the request to',
    type: 'string',
    required: true,
    validation: 'Must be a valid URL starting with http:// or https://'
  },
  method: {
    description: 'HTTP method to use for the request',
    type: 'options',
    options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    default: 'GET'
  },
} as const;