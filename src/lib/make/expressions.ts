/**
 * Make.com Functions & Expressions
 * Comprehensive reference for all Make.com functions and expression patterns
 */

export const MAKE_EXPRESSIONS = {
  string_functions: {
    description: "Functions for manipulating text and string data",
    functions: {
      ascii: {
        syntax: "ascii(text; index)",
        description: "Returns the ASCII code of a character at the specified position",
        examples: [
          'ascii("A"; 1) // Returns 65',
          'ascii("Hello"; 2) // Returns 101 (character "e")'
        ],
        use_cases: ["Character validation", "Data encoding", "Text processing"]
      },
      base64: {
        syntax: "base64(text)",
        description: "Encodes text to Base64 format",
        examples: [
          'base64("Hello World") // Returns "SGVsbG8gV29ybGQ="',
          'base64({{data}}) // Encode dynamic content'
        ],
        use_cases: ["API authentication", "File encoding", "Data transmission"]
      },
      capitalize: {
        syntax: "capitalize(text)",
        description: "Capitalizes the first letter of each word",
        examples: [
          'capitalize("hello world") // Returns "Hello World"',
          'capitalize({{contact.name}}) // Capitalize contact name'
        ],
        use_cases: ["Name formatting", "Title case conversion", "Data cleanup"]
      },
      contains: {
        syntax: "contains(text; substring)",
        description: "Checks if text contains a substring",
        examples: [
          'contains("Hello World"; "World") // Returns true',
          'contains({{email}}; "@gmail.com") // Check email provider'
        ],
        use_cases: ["Text validation", "Content filtering", "Search functionality"]
      },
      length: {
        syntax: "length(text)",
        description: "Returns the length of a string",
        examples: [
          'length("Hello") // Returns 5',
          'length({{description}}) // Get description length'
        ],
        use_cases: ["Validation", "Text limits", "Data analysis"]
      },
      lower: {
        syntax: "lower(text)",
        description: "Converts text to lowercase",
        examples: [
          'lower("HELLO WORLD") // Returns "hello world"',
          'lower({{email}}) // Normalize email case'
        ],
        use_cases: ["Email normalization", "Search consistency", "Data standardization"]
      },
      replace: {
        syntax: "replace(text; pattern; replacement; flags)",
        description: "Replaces text using regular expressions",
        examples: [
          'replace("Hello World"; "World"; "Make") // Returns "Hello Make"',
          'replace({{phone}}; "[^0-9]"; ""; "g") // Remove non-digits',
          'replace({{text}}; "\\s+"; " "; "g") // Replace multiple spaces'
        ],
        use_cases: ["Data cleaning", "Format standardization", "Text transformation"]
      },
      split: {
        syntax: "split(text; separator)",
        description: "Splits text into an array using a separator",
        examples: [
          'split("apple,banana,orange"; ",") // Returns ["apple", "banana", "orange"]',
          'split({{full_name}}; " ") // Split name into parts',
          'split({{tags}}; ",") // Convert comma-separated tags to array'
        ],
        use_cases: ["Data parsing", "Array creation", "Tag processing"]
      },
      substring: {
        syntax: "substring(text; start; length)",
        description: "Extracts a portion of text",
        examples: [
          'substring("Hello World"; 7; 5) // Returns "World"',
          'substring({{description}}; 1; 100) // First 100 characters',
          'substring({{phone}}; 1; 3) // Area code extraction'
        ],
        use_cases: ["Text truncation", "Data extraction", "Preview generation"]
      },
      trim: {
        syntax: "trim(text)",
        description: "Removes whitespace from the beginning and end",
        examples: [
          'trim("  Hello World  ") // Returns "Hello World"',
          'trim({{user_input}}) // Clean user input'
        ],
        use_cases: ["Data cleaning", "Input sanitization", "Format standardization"]
      },
      upper: {
        syntax: "upper(text)",
        description: "Converts text to uppercase",
        examples: [
          'upper("hello world") // Returns "HELLO WORLD"',
          'upper({{country_code}}) // Standardize country codes'
        ],
        use_cases: ["Code standardization", "Display formatting", "Data consistency"]
      }
    }
  },

  array_functions: {
    description: "Functions for working with arrays and collections",
    functions: {
      add: {
        syntax: "add(array; value)",
        description: "Adds an item to an array",
        examples: [
          'add(["apple", "banana"]; "orange") // Returns ["apple", "banana", "orange"]',
          'add({{existing_tags}}; {{new_tag}}) // Add new tag to existing list'
        ],
        use_cases: ["List building", "Tag management", "Data accumulation"]
      },
      get: {
        syntax: "get(array; index)",
        description: "Gets an item from an array at the specified index",
        examples: [
          'get(["apple", "banana", "orange"]; 2) // Returns "banana" (0-indexed)',
          'get({{names}}; 1) // Get first name',
          'get(split({{full_name}}; " "); 1) // Get first name from full name'
        ],
        use_cases: ["Data extraction", "Array navigation", "Specific item retrieval"]
      },
      join: {
        syntax: "join(array; separator)",
        description: "Joins array elements into a string",
        examples: [
          'join(["apple", "banana", "orange"]; ", ") // Returns "apple, banana, orange"',
          'join({{tags}}; " #") // Create hashtag string',
          'join({{skills}}; " | ") // Format skills list'
        ],
        use_cases: ["String generation", "Display formatting", "Data export"]
      },
      length: {
        syntax: "length(array)",
        description: "Returns the number of items in an array",
        examples: [
          'length(["apple", "banana", "orange"]) // Returns 3',
          'length({{order_items}}) // Count order items',
          'length(split({{tags}}; ",")) // Count comma-separated tags'
        ],
        use_cases: ["Counting", "Validation", "Conditional logic"]
      },
      remove: {
        syntax: "remove(array; index)",
        description: "Removes an item from an array at the specified index",
        examples: [
          'remove(["apple", "banana", "orange"]; 2) // Returns ["apple", "orange"]',
          'remove({{items}}; 1) // Remove first item'
        ],
        use_cases: ["List management", "Data filtering", "Item removal"]
      },
      reverse: {
        syntax: "reverse(array)",
        description: "Reverses the order of array elements",
        examples: [
          'reverse(["apple", "banana", "orange"]) // Returns ["orange", "banana", "apple"]',
          'reverse({{recent_orders}}) // Show oldest first'
        ],
        use_cases: ["Order manipulation", "Display formatting", "Data sorting"]
      },
      slice: {
        syntax: "slice(array; start; end)",
        description: "Extracts a section of an array",
        examples: [
          'slice(["a", "b", "c", "d", "e"]; 1; 3) // Returns ["b", "c"]',
          'slice({{items}}; 1; 5) // Get first 5 items',
          'slice({{recent_orders}}; -3) // Get last 3 orders'
        ],
        use_cases: ["Pagination", "Data limiting", "Range selection"]
      },
      sort: {
        syntax: "sort(array)",
        description: "Sorts array elements alphabetically",
        examples: [
          'sort(["orange", "apple", "banana"]) // Returns ["apple", "banana", "orange"]',
          'sort({{tags}}) // Alphabetize tags',
          'sort({{names}}) // Sort names list'
        ],
        use_cases: ["Data organization", "Display formatting", "Search optimization"]
      },
      unique: {
        syntax: "unique(array)",
        description: "Removes duplicate items from an array",
        examples: [
          'unique(["apple", "banana", "apple", "orange"]) // Returns ["apple", "banana", "orange"]',
          'unique({{all_tags}}) // Remove duplicate tags',
          'unique({{customer_emails}}) // Remove duplicate emails'
        ],
        use_cases: ["Data deduplication", "List cleaning", "Unique value extraction"]
      }
    }
  },

  date_functions: {
    description: "Functions for working with dates and times",
    functions: {
      addDays: {
        syntax: "addDays(date; days)",
        description: "Adds specified number of days to a date",
        examples: [
          'addDays("2024-01-01"; 30) // Returns "2024-01-31"',
          'addDays({{order_date}}; 7) // Add 7 days for delivery',
          'addDays(now; -1) // Yesterday'
        ],
        use_cases: ["Due date calculation", "Scheduling", "Date arithmetic"]
      },
      addHours: {
        syntax: "addHours(date; hours)",
        description: "Adds specified number of hours to a date",
        examples: [
          'addHours("2024-01-01T10:00:00"; 5) // Returns "2024-01-01T15:00:00"',
          'addHours(now; 2) // 2 hours from now',
          'addHours({{meeting_start}}; {{duration}}) // Calculate end time'
        ],
        use_cases: ["Time scheduling", "Duration calculation", "Timezone handling"]
      },
      dateDifference: {
        syntax: "dateDifference(date1; date2; unit)",
        description: "Calculates the difference between two dates",
        examples: [
          'dateDifference("2024-01-01"; "2024-01-31"; "days") // Returns 30',
          'dateDifference({{start_date}}; {{end_date}}; "hours") // Duration in hours',
          'dateDifference({{birth_date}}; now; "years") // Age calculation'
        ],
        use_cases: ["Age calculation", "Duration measurement", "Time tracking"]
      },
      formatDate: {
        syntax: "formatDate(date; format)",
        description: "Formats a date according to the specified pattern",
        examples: [
          'formatDate("2024-01-01"; "MM/DD/YYYY") // Returns "01/01/2024"',
          'formatDate(now; "YYYY-MM-DD") // ISO date format',
          'formatDate({{event_date}}; "MMM DD, YYYY") // Human readable format'
        ],
        use_cases: ["Display formatting", "Data export", "Localization"]
      },
      now: {
        syntax: "now",
        description: "Returns the current date and time",
        examples: [
          'now // Current timestamp',
          'formatDate(now; "YYYY-MM-DD") // Today\'s date',
          'addDays(now; 30) // 30 days from now'
        ],
        use_cases: ["Timestamp creation", "Current time reference", "Date calculations"]
      },
      parseDate: {
        syntax: "parseDate(text; format)",
        description: "Parses a text string into a date",
        examples: [
          'parseDate("01/15/2024"; "MM/DD/YYYY") // Parse US date format',
          'parseDate({{date_string}}; "DD-MM-YYYY") // Parse European format',
          'parseDate({{timestamp}}; "YYYY-MM-DD HH:mm:ss") // Parse datetime'
        ],
        use_cases: ["Data import", "Format conversion", "Date validation"]
      },
      setDate: {
        syntax: "setDate(date; day)",
        description: "Sets the day of the month for a date",
        examples: [
          'setDate("2024-01-15"; 1) // Returns "2024-01-01"',
          'setDate(now; 1) // First day of current month',
          'setDate({{payment_date}}; 15) // Set to 15th of month'
        ],
        use_cases: ["Date standardization", "Monthly processing", "Date normalization"]
      },
      startOfDay: {
        syntax: "startOfDay(date)",
        description: "Returns the start of the day (00:00:00) for a date",
        examples: [
          'startOfDay("2024-01-01T15:30:00") // Returns "2024-01-01T00:00:00"',
          'startOfDay(now) // Start of today',
          'startOfDay({{event_date}}) // Start of event date'
        ],
        use_cases: ["Date comparison", "Daily aggregation", "Time normalization"]
      }
    }
  },

  math_functions: {
    description: "Mathematical functions and calculations",
    functions: {
      abs: {
        syntax: "abs(number)",
        description: "Returns the absolute value of a number",
        examples: [
          'abs(-5) // Returns 5',
          'abs({{difference}}) // Absolute difference',
          'abs({{profit_loss}}) // Absolute value of P&L'
        ],
        use_cases: ["Distance calculation", "Error margins", "Magnitude comparison"]
      },
      average: {
        syntax: "average(array)",
        description: "Calculates the average of an array of numbers",
        examples: [
          'average([10, 20, 30]) // Returns 20',
          'average({{scores}}) // Average score',
          'average({{sales_data}}) // Average sales'
        ],
        use_cases: ["Statistical analysis", "Performance metrics", "Data summarization"]
      },
      ceil: {
        syntax: "ceil(number)",
        description: "Rounds a number up to the nearest integer",
        examples: [
          'ceil(4.2) // Returns 5',
          'ceil({{price_calculation}}) // Round up price',
          'ceil({{quantity}} / {{batch_size}}) // Calculate required batches'
        ],
        use_cases: ["Quantity calculation", "Pricing", "Resource allocation"]
      },
      floor: {
        syntax: "floor(number)",
        description: "Rounds a number down to the nearest integer",
        examples: [
          'floor(4.8) // Returns 4',
          'floor({{discount_percentage}}) // Round down discount',
          'floor({{hours_worked}}) // Full hours only'
        ],
        use_cases: ["Time calculation", "Quantity limits", "Threshold processing"]
      },
      max: {
        syntax: "max(array)",
        description: "Returns the largest number in an array",
        examples: [
          'max([10, 5, 30, 15]) // Returns 30',
          'max({{prices}}) // Highest price',
          'max({{performance_scores}}) // Best performance'
        ],
        use_cases: ["Performance analysis", "Price comparison", "Threshold detection"]
      },
      min: {
        syntax: "min(array)",
        description: "Returns the smallest number in an array",
        examples: [
          'min([10, 5, 30, 15]) // Returns 5',
          'min({{prices}}) // Lowest price',
          'min({{response_times}}) // Fastest response'
        ],
        use_cases: ["Performance optimization", "Cost analysis", "Quality metrics"]
      },
      round: {
        syntax: "round(number; decimals)",
        description: "Rounds a number to the specified decimal places",
        examples: [
          'round(4.567; 2) // Returns 4.57',
          'round({{total_price}}; 2) // Round to cents',
          'round({{percentage}}; 1) // Round to 1 decimal'
        ],
        use_cases: ["Financial calculations", "Display formatting", "Precision control"]
      },
      sum: {
        syntax: "sum(array)",
        description: "Calculates the sum of an array of numbers",
        examples: [
          'sum([10, 20, 30]) // Returns 60',
          'sum({{order_totals}}) // Total revenue',
          'sum({{quantities}}) // Total quantity'
        ],
        use_cases: ["Financial totals", "Quantity calculation", "Aggregation"]
      }
    }
  },

  general_functions: {
    description: "General utility functions for logic and control",
    functions: {
      if: {
        syntax: "if(condition; value_if_true; value_if_false)",
        description: "Returns different values based on a condition",
        examples: [
          'if({{age}} >= 18; "Adult"; "Minor") // Age classification',
          'if({{status}} = "paid"; "Complete"; "Pending") // Status check',
          'if(length({{description}}) > 100; substring({{description}}; 1; 100) + "..."; {{description}}) // Truncate long text'
        ],
        use_cases: ["Conditional logic", "Data classification", "Status management"]
      },
      switch: {
        syntax: "switch(value; case1; result1; case2; result2; default)",
        description: "Returns different values based on multiple conditions",
        examples: [
          'switch({{priority}}; "high"; "🔴"; "medium"; "🟡"; "low"; "🟢"; "⚪") // Priority icons',
          'switch({{status}}; "new"; "Processing"; "paid"; "Shipped"; "cancelled"; "Refunded"; "Unknown") // Status mapping',
          'switch({{country}}; "US"; "USD"; "EU"; "EUR"; "UK"; "GBP"; "USD") // Currency mapping'
        ],
        use_cases: ["Value mapping", "Status conversion", "Multi-condition logic"]
      },
      isEmpty: {
        syntax: "isEmpty(value)",
        description: "Checks if a value is empty or null",
        examples: [
          'isEmpty({{optional_field}}) // Check if field has value',
          'if(isEmpty({{phone}}); "No phone"; {{phone}}) // Provide default',
          'isEmpty({{description}}) // Validate required field'
        ],
        use_cases: ["Data validation", "Default value assignment", "Conditional processing"]
      },
      isNumber: {
        syntax: "isNumber(value)",
        description: "Checks if a value is a number",
        examples: [
          'isNumber("123") // Returns true',
          'isNumber({{user_input}}) // Validate numeric input',
          'if(isNumber({{quantity}}); {{quantity}}; 0) // Default to 0 if not number'
        ],
        use_cases: ["Input validation", "Data type checking", "Error prevention"]
      },
      toString: {
        syntax: "toString(value)",
        description: "Converts a value to a string",
        examples: [
          'toString(123) // Returns "123"',
          'toString({{order_id}}) // Convert ID to string',
          '"Order #" + toString({{order_number}}) // Concatenate with text'
        ],
        use_cases: ["Type conversion", "String concatenation", "Display formatting"]
      },
      toNumber: {
        syntax: "toNumber(value)",
        description: "Converts a value to a number",
        examples: [
          'toNumber("123") // Returns 123',
          'toNumber({{price_string}}) // Convert price to number',
          'toNumber({{quantity}}) * toNumber({{price}}) // Calculate total'
        ],
        use_cases: ["Mathematical operations", "Data conversion", "Calculation preparation"]
      }
    }
  },

  expression_patterns: {
    description: "Common patterns and combinations of functions",
    patterns: {
      data_validation: {
        description: "Validate and clean incoming data",
        examples: [
          'if(isEmpty({{email}}); ""; lower(trim({{email}}))) // Clean email',
          'if(isNumber({{quantity}}); toNumber({{quantity}}); 1) // Default quantity',
          'if(length({{phone}}) < 10; ""; replace({{phone}}; "[^0-9]"; ""; "g")) // Clean phone'
        ]
      },
      conditional_formatting: {
        description: "Format data based on conditions",
        examples: [
          'if({{status}} = "urgent"; "🚨 " + {{title}}; {{title}}) // Add urgency indicator',
          'if({{amount}} > 1000; "$" + formatNumber({{amount}}; 0); "$" + toString({{amount}})) // Format large amounts',
          'switch({{priority}}; "high"; "❗ HIGH"; "medium"; "⚠️ MEDIUM"; "🔹 LOW") // Priority formatting'
        ]
      },
      text_processing: {
        description: "Advanced text manipulation patterns",
        examples: [
          'join(map(split({{tags}}; ","); trim({{item}})); ", ") // Clean tag list',
          'capitalize(lower(trim({{name}}))) // Normalize names',
          'substring({{description}}; 1; 100) + if(length({{description}}) > 100; "..."; "") // Smart truncation'
        ]
      },
      date_calculations: {
        description: "Complex date and time calculations",
        examples: [
          'addDays(startOfDay(now); 7) // Next week start',
          'formatDate(addDays({{order_date}}; 14); "MMM DD") // Delivery estimate',
          'if(dateDifference({{due_date}}; now; "days") < 0; "OVERDUE"; "ON TIME") // Status check'
        ]
      },
      array_processing: {
        description: "Working with arrays and lists",
        examples: [
          'join(slice(sort({{tags}}); 1; 5); ", ") // Top 5 sorted tags',
          'length(unique({{customer_emails}})) // Count unique customers',
          'get(split({{full_name}}; " "); 1) // Extract first name'
        ]
      }
    }
  },

  best_practices: {
    description: "Best practices for using Make.com expressions",
    guidelines: [
      "Always validate data before processing to prevent errors",
      "Use meaningful variable names in complex expressions",
      "Break complex expressions into multiple steps for readability",
      "Use conditional logic to handle edge cases and null values",
      "Test expressions with various data types and edge cases",
      "Comment complex expressions for future maintenance",
      "Use helper variables to store intermediate calculations",
      "Consider performance impact of complex nested functions"
    ],
    common_mistakes: [
      "Not handling null or empty values",
      "Forgetting to escape special characters in regex",
      "Using wrong data types in mathematical operations",
      "Not considering timezone differences in date calculations",
      "Overcomplicated single expressions instead of multi-step processing"
    ]
  }
};

export const MAKE_EXPRESSION_EXAMPLES = {
  e_commerce: {
    description: "Common e-commerce automation expressions",
    examples: {
      order_total: 'sum(map({{order_items}}; toNumber({{item.quantity}}) * toNumber({{item.price}})))',
      shipping_estimate: 'formatDate(addDays(now; if({{shipping_type}} = "express"; 1; 5)); "MMM DD")',
      customer_tier: 'switch({{total_spent}}; 0; "New"; 500; "Silver"; 1000; "Gold"; 5000; "Platinum"; "VIP")',
      discount_code: 'upper(substring({{customer_name}}; 1; 3) + toString({{order_id}}))',
      inventory_status: 'if({{stock_quantity}} <= {{reorder_level}}; "REORDER"; if({{stock_quantity}} = 0; "OUT_OF_STOCK"; "IN_STOCK"))'
    }
  },
  
  crm: {
    description: "Customer relationship management expressions",
    examples: {
      lead_score: 'min([100; {{email_opens}} * 10 + {{website_visits}} * 5 + {{downloads}} * 15])',
      follow_up_date: 'formatDate(addDays(now; switch({{lead_status}}; "hot"; 1; "warm"; 3; "cold"; 7; 14)); "YYYY-MM-DD")',
      contact_name: 'trim({{first_name}}) + " " + trim({{last_name}})',
      phone_formatted: 'if(length({{phone}}) = 10; "(" + substring({{phone}}; 1; 3) + ") " + substring({{phone}}; 4; 3) + "-" + substring({{phone}}; 7; 4); {{phone}})',
      account_health: 'if({{last_contact_days}} > 90; "At Risk"; if({{last_contact_days}} > 30; "Needs Attention"; "Healthy"))'
    }
  },
  
  hr: {
    description: "Human resources automation expressions",
    examples: {
      employee_id: 'upper(substring({{first_name}}; 1; 1) + substring({{last_name}}; 1; 1)) + toString({{hire_year}}) + toString({{employee_number}})',
      vacation_balance: '{{annual_allowance}} - {{days_used}} - {{days_pending}}',
      performance_rating: 'switch({{score}}; 90; "Exceeds"; 80; "Meets"; 70; "Needs Improvement"; "Below Expectations")',
      next_review: 'formatDate(addDays({{hire_date}}; 365); "MMM DD, YYYY")',
      tenure_years: 'floor(dateDifference({{hire_date}}; now; "days") / 365)'
    }
  }
};