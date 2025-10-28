/**
 * Make.com Complete Functions Library
 * Comprehensive coverage of all Make.com functions for data manipulation
 */

export const MAKE_FUNCTIONS_LIBRARY = {
  // String Functions (50+ functions)
  string_functions: {
    basic_manipulation: {
      "ascii": "Remove non-ASCII characters and diacritics",
      "base64": "Encode/decode base64 strings",
      "capitalize": "Capitalize first letter of each word",
      "lower": "Convert to lowercase",
      "upper": "Convert to uppercase",
      "trim": "Remove whitespace from beginning and end",
      "ltrim": "Remove whitespace from left",
      "rtrim": "Remove whitespace from right"
    },
    text_processing: {
      "length": "Get string length",
      "substring": "Extract portion of string",
      "replace": "Replace text patterns",
      "split": "Split string into array",
      "join": "Join array into string",
      "contains": "Check if string contains text",
      "startsWith": "Check if string starts with text",
      "endsWith": "Check if string ends with text"
    },
    formatting: {
      "md5": "Generate MD5 hash",
      "sha1": "Generate SHA1 hash", 
      "sha256": "Generate SHA256 hash",
      "encodeURL": "URL encode string",
      "decodeURL": "URL decode string",
      "escapeHTML": "Escape HTML characters",
      "unescapeHTML": "Unescape HTML characters",
      "escapeMarkdown": "Escape Markdown syntax"
    },
    regex: {
      "match": "Extract matches using regex",
      "matchAll": "Extract all matches using regex",
      "test": "Test if string matches regex pattern",
      "replace": "Replace using regex patterns"
    }
  },

  // Mathematical Functions (30+ functions)
  math_functions: {
    basic_operations: {
      "abs": "Absolute value",
      "ceil": "Round up to nearest integer",
      "floor": "Round down to nearest integer", 
      "round": "Round to specified decimal places",
      "max": "Maximum value from array",
      "min": "Minimum value from array",
      "sum": "Sum all values in array",
      "average": "Calculate average of array"
    },
    advanced_math: {
      "pow": "Power calculation (x^y)",
      "sqrt": "Square root",
      "log": "Natural logarithm",
      "sin": "Sine function",
      "cos": "Cosine function", 
      "tan": "Tangent function",
      "random": "Generate random number",
      "parseNumber": "Convert string to number"
    },
    formatting: {
      "formatNumber": "Format number with separators",
      "toCurrency": "Format as currency",
      "toPercentage": "Format as percentage"
    }
  },

  // Date and Time Functions (40+ functions)
  datetime_functions: {
    creation: {
      "now": "Current date and time",
      "today": "Today's date at midnight",
      "parseDate": "Parse string to date",
      "setDate": "Create date from components",
      "timestamp": "Unix timestamp"
    },
    formatting: {
      "formatDate": "Format date with custom pattern",
      "formatDateInTimezone": "Format date in specific timezone",
      "toISOString": "Convert to ISO string format"
    },
    manipulation: {
      "addDays": "Add days to date",
      "addHours": "Add hours to date",
      "addMinutes": "Add minutes to date",
      "addMonths": "Add months to date",
      "addYears": "Add years to date",
      "startOfDay": "Beginning of day",
      "endOfDay": "End of day",
      "startOfWeek": "Beginning of week",
      "endOfWeek": "End of week"
    },
    calculation: {
      "dateDifference": "Calculate difference between dates",
      "dayOfWeek": "Get day of week (0-6)",
      "dayOfYear": "Get day of year (1-366)",
      "weekOfYear": "Get week of year",
      "isWeekend": "Check if date is weekend",
      "isBusinessDay": "Check if date is business day"
    },
    timezone: {
      "convertTimezone": "Convert between timezones",
      "getTimezone": "Get timezone from date",
      "listTimezones": "Available timezone list"
    }
  },

  // Array Functions (25+ functions)
  array_functions: {
    manipulation: {
      "add": "Add item to array",
      "remove": "Remove item from array",
      "slice": "Extract portion of array",
      "reverse": "Reverse array order",
      "sort": "Sort array",
      "unique": "Remove duplicates",
      "flatten": "Flatten nested arrays",
      "chunk": "Split array into chunks"
    },
    filtering: {
      "filter": "Filter array by condition",
      "map": "Transform each array item",
      "reduce": "Reduce array to single value",
      "find": "Find first matching item",
      "findIndex": "Find index of item"
    },
    analysis: {
      "length": "Get array length",
      "isEmpty": "Check if array is empty",
      "contains": "Check if array contains item",
      "every": "Check if all items match condition",
      "some": "Check if any item matches condition"
    }
  },

  // General Functions (20+ functions)
  general_functions: {
    data_access: {
      "get": "Get value from object/array by path",
      "set": "Set value in object/array",
      "has": "Check if object has property",
      "keys": "Get object keys as array",
      "values": "Get object values as array"
    },
    conditional: {
      "if": "Conditional logic (if-then-else)",
      "switch": "Multi-condition switch statement",
      "ifempty": "Return value if empty",
      "emptyarray": "Return empty array",
      "emptyobject": "Return empty object"
    },
    conversion: {
      "toString": "Convert to string",
      "toNumber": "Convert to number",
      "toBool": "Convert to boolean",
      "toArray": "Convert to array",
      "toObject": "Convert to object"
    },
    validation: {
      "isEmpty": "Check if value is empty",
      "isNumber": "Check if value is number",
      "isString": "Check if value is string",
      "isArray": "Check if value is array",
      "isObject": "Check if value is object"
    }
  }
};

export const MAKE_ADVANCED_EXPRESSIONS = {
  // Complex data path expressions
  data_paths: {
    nested_access: "{{data.user.profile.addresses[0].street}}",
    conditional_access: "{{if(get(data; 'user.profile'); data.user.profile.name; 'Unknown')}}",
    array_filtering: "{{filter(data.orders; 'item.status = completed')}}",
    dynamic_keys: "{{get(data; 'user.' + userId + '.profile')}}"
  },

  // Business logic expressions
  business_logic: {
    scoring: "{{if(data.revenue > 10000; 'Enterprise'; if(data.revenue > 1000; 'Business'; 'Starter'))}}",
    date_validation: "{{if(dateDifference(now; data.created_at; 'days') > 30; 'Expired'; 'Active')}}",
    percentage_calc: "{{round((data.completed / data.total) * 100; 2)}}%",
    priority_logic: "{{if(contains(lower(data.title); 'urgent'); 'High'; if(data.due_date < addDays(now; 3); 'Medium'; 'Low'))}}"
  },

  // Data transformation patterns
  transformations: {
    name_formatting: "{{capitalize(trim(data.first_name)) + ' ' + capitalize(trim(data.last_name))}}",
    phone_formatting: "{{replace(replace(data.phone; '[^0-9]'; ''); '^1?([0-9]{3})([0-9]{3})([0-9]{4})$'; '($1) $2-$3')}}",
    email_domain: "{{split(data.email; '@')[1]}}",
    slug_creation: "{{lower(replace(trim(data.title); '[^a-zA-Z0-9\\s]'; ''))}}"
  }
};