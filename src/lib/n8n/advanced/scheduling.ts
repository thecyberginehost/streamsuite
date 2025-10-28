/**
 * Advanced Scheduling & Timing
 */

export const N8N_ADVANCED_SCHEDULING_TIMING = {
  description: 'Complex cron patterns, timezone handling, delay strategies, batch processing schedules',

  // Complex cron expressions
  cronPatterns: {
    basic: {
      everyMinute: '* * * * *',
      everyHour: '0 * * * *',
      everyDay: '0 0 * * *',
      everyWeek: '0 0 * * 0',
      everyMonth: '0 0 1 * *'
    },

    businessHours: {
      weekdaysOnly: '0 9-17 * * 1-5',  // 9 AM to 5 PM, Monday to Friday
      businessDays: '*/15 8-18 * * 1-5',  // Every 15 minutes during business hours
      lunchBreakExcluded: '0 9-12,14-17 * * 1-5',  // Excluding lunch hour
      endOfMonth: '0 0 28-31 * *',  // Last few days of month
      quarterlyReports: '0 0 1 1,4,7,10 *'  // First day of quarters
    },

    advanced: {
      workingDaysOnly: '0 9 * * 1-5',  // 9 AM on weekdays
      biWeekly: '0 0 * * 1/2',  // Every other Monday
      monthlyFirstWorkday: '0 9 1-7 * 1',  // First Monday of month
      yearEnd: '0 0 31 12 *',  // December 31st
      leapYearHandling: '0 0 29 2 *',  // February 29th (leap years only)
      complexQuarterly: '0 0 1 1,4,7,10 *'  // Quarterly on specific months
    },

    seasonal: {
      summerSchedule: '0 8-20 * 6-8 *',  // Summer hours (June-August)
      holidayAware: '0 9 * * 1-5 ! 0 9 25 12 *',  // Weekdays except Christmas
      timeZoneSpecific: '0 9 * * 1-5',  // With timezone context
      daylightSavingAware: 'TZ=America/New_York 0 9 * * 1-5'
    }
  },

  // Timezone handling strategies
  timezoneHandling: {
    concepts: {
      utcDefault: 'n8n runs all schedules in UTC by default',
      timezoneConversion: 'Convert between timezones for business logic',
      daylightSaving: 'Handle DST transitions automatically',
      multiTimezone: 'Support workflows across multiple timezones'
    },

    implementation: {
      utcScheduling: `// Schedule in UTC, convert for display
{
  "scheduleExpression": "0 9 * * 1-5",  // 9 AM UTC
  "timezone": "UTC",
  "displayTimezone": "America/New_York",
  "description": "9 AM UTC (5 AM EST / 4 AM EDT)"
}`,

      timezoneSpecific: `// Business hours in specific timezone
const scheduleInTimezone = (cronExpression, timezone) => ({
  expression: cronExpression,
  timezone: timezone,
  adjustForDST: true,
  examples: {
    "America/New_York": "Handles EST/EDT transitions",
    "Europe/London": "Handles GMT/BST transitions", 
    "Asia/Tokyo": "Fixed offset, no DST"
  }
});`,

      multipleRegions: `// Global business schedule
const globalSchedule = {
  "americas": {
    "cron": "0 9 * * 1-5",
    "timezone": "America/New_York",
    "description": "9 AM Eastern Time"
  },
  "europe": {
    "cron": "0 9 * * 1-5", 
    "timezone": "Europe/London",
    "description": "9 AM London Time"
  },
  "asia": {
    "cron": "0 9 * * 1-5",
    "timezone": "Asia/Tokyo", 
    "description": "9 AM Japan Time"
  }
};`
    },

    expressions: {
      timezoneConversion: '{{ DateTime.fromISO($json.timestamp, {zone: "UTC"}).setZone("America/New_York").toFormat("yyyy-MM-dd HH:mm:ss") }}',
      businessHours: '{{ DateTime.now().setZone("America/New_York").hour >= 9 && DateTime.now().setZone("America/New_York").hour < 17 }}',
      weekendCheck: '{{ [6, 7].includes(DateTime.now().setZone("UTC").weekday) }}',
      holidayCheck: '{{ DateTime.now().setZone("UTC").toFormat("MM-dd") === "12-25" }}'
    }
  },

  // Intelligent delay strategies
  delayStrategies: {
    exponentialBackoff: {
      description: 'Increase delay exponentially after failures',
      implementation: `// Exponential backoff with jitter
const calculateBackoffDelay = (attempt, baseDelay = 1000, maxDelay = 30000) => {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.floor(exponentialDelay + jitter);
};

// Usage in n8n workflow
const delayExpression = \`{{ Math.min(1000 * Math.pow(2, $runIndex), 30000) + Math.random() * 0.1 * 1000 * Math.pow(2, $runIndex) }}\`;`
    },

    linearBackoff: {
      description: 'Increase delay linearly for gradual throttling',
      implementation: `// Linear backoff strategy
const linearDelay = (attempt, increment = 5000, maxDelay = 60000) => {
  return Math.min(attempt * increment, maxDelay);
};

// n8n expression
const linearDelayExpression = \`{{ Math.min($runIndex * 5000, 60000) }}\`;`
    },

    adaptiveThrottling: {
      description: 'Adjust delay based on system load or API response',
      implementation: `// Adaptive throttling based on response time
const adaptiveDelay = (responseTime, errorRate) => {
  let baseDelay = 1000;
  
  // Increase delay if response time is high
  if (responseTime > 5000) baseDelay *= 2;
  if (responseTime > 10000) baseDelay *= 3;
  
  // Increase delay if error rate is high
  if (errorRate > 0.1) baseDelay *= 2;  // >10% error rate
  if (errorRate > 0.25) baseDelay *= 3; // >25% error rate
  
  return Math.min(baseDelay, 30000);
};

// n8n implementation using static data
const staticDataKey = 'adaptiveDelay';
const currentDelay = $workflow.staticData[staticDataKey] || 1000;
const newDelay = responseTime > 5000 ? currentDelay * 1.5 : currentDelay * 0.9;
$workflow.staticData[staticDataKey] = Math.max(500, Math.min(newDelay, 30000));`
    },

    timeBasedThrottling: {
      description: 'Adjust delays based on time of day or day of week',
      implementation: `// Time-based throttling
const timeBasedDelay = () => {
  const now = DateTime.now().setZone("UTC");
  const hour = now.hour;
  const weekday = now.weekday;
  
  // Lower delays during off-peak hours
  if (hour >= 22 || hour < 6) return 2000;  // Night time
  if (weekday >= 6) return 1500;           // Weekends
  if (hour >= 12 && hour < 14) return 3000; // Lunch time
  
  return 1000; // Peak hours
};

// n8n expression
const timeBasedExpression = \`{{ 
  $now.hour >= 22 || $now.hour < 6 ? 2000 :
  $now.weekday >= 6 ? 1500 :
  $now.hour >= 12 && $now.hour < 14 ? 3000 : 1000
}}\`;`
    }
  },

  // Batch processing schedules
  batchProcessing: {
    fixedSizeBatches: {
      description: 'Process data in fixed-size chunks',
      implementation: `// Fixed batch size processing
const batchSize = 100;
const totalItems = data.length;
const totalBatches = Math.ceil(totalItems / batchSize);

const processBatch = (batchIndex) => {
  const startIndex = batchIndex * batchSize;
  const endIndex = Math.min(startIndex + batchSize, totalItems);
  return data.slice(startIndex, endIndex);
};

// Schedule batch processing every 5 minutes
const batchSchedule = {
  expression: "*/5 * * * *",
  batchSize: 100,
  concurrentBatches: 3,
  maxProcessingTime: "4 minutes"
};`
    },

    timeBasedBatches: {
      description: 'Process batches based on time windows',
      implementation: `// Time window batch processing
const timeWindowBatch = {
  hourlyWindow: {
    expression: "0 * * * *",  // Every hour
    description: "Process all data from previous hour",
    dataFilter: "created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)"
  },
  
  dailyWindow: {
    expression: "0 2 * * *",  // 2 AM daily
    description: "Process all data from previous day", 
    dataFilter: "DATE(created_at) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))"
  },
  
  businessHoursWindow: {
    expression: "0 18 * * 1-5",  // 6 PM weekdays
    description: "Process business hours data",
    dataFilter: "created_at >= CONCAT(CURDATE(), ' 09:00:00') AND created_at < CONCAT(CURDATE(), ' 18:00:00')"
  }
};`
    },

    adaptiveBatching: {
      description: 'Dynamic batch sizing based on system performance',
      implementation: `// Adaptive batch sizing
const adaptiveBatchSize = (systemLoad, processingTime, errorRate) => {
  let batchSize = 100; // Base batch size
  
  // Reduce batch size if system is under load
  if (systemLoad > 0.8) batchSize = Math.floor(batchSize * 0.5);
  else if (systemLoad > 0.6) batchSize = Math.floor(batchSize * 0.7);
  
  // Adjust based on processing time
  if (processingTime > 300000) batchSize = Math.floor(batchSize * 0.8); // >5 minutes
  else if (processingTime < 60000) batchSize = Math.floor(batchSize * 1.2); // <1 minute
  
  // Reduce if error rate is high
  if (errorRate > 0.05) batchSize = Math.floor(batchSize * 0.6); // >5% errors
  
  return Math.max(10, Math.min(batchSize, 500)); // Keep within bounds
};

// Dynamic schedule adjustment
const adaptiveSchedule = {
  baseExpression: "*/10 * * * *",  // Every 10 minutes
  adaptiveInterval: true,
  adjustmentFactors: {
    systemLoad: 0.3,
    errorRate: 0.4,
    processingTime: 0.3
  }
};`
    }
  },

  // Advanced rate limiting
  rateLimiting: {
    tokenBucket: {
      description: 'Token bucket algorithm for rate limiting',
      implementation: `// Token bucket rate limiter
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }
  
  consume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
  
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Usage in workflow static data
const bucketKey = 'rateLimitBucket';
if (!$workflow.staticData[bucketKey]) {
  $workflow.staticData[bucketKey] = {
    capacity: 100,
    tokens: 100,
    refillRate: 10, // 10 tokens per second
    lastRefill: Date.now()
  };
}`
    },

    slidingWindow: {
      description: 'Sliding window rate limiting for precise control',
      implementation: `// Sliding window rate limiter
const slidingWindowCheck = (requestCount, windowSizeMs, maxRequests) => {
  const now = Date.now();
  const windowStart = now - windowSizeMs;
  
  // Get requests in current window from static data
  const requests = $workflow.staticData.requests || [];
  const windowRequests = requests.filter(time => time > windowStart);
  
  if (windowRequests.length < maxRequests) {
    // Add current request and clean old ones
    windowRequests.push(now);
    $workflow.staticData.requests = windowRequests;
    return true;
  }
  
  return false;
};

// Usage example: 100 requests per hour
const canProceed = slidingWindowCheck(100, 3600000, 100);`
    }
  }
} as const;