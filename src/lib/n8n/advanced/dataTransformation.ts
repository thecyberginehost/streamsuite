/**
 * Advanced Data Transformation
 */

export const N8N_ADVANCED_DATA_TRANSFORMATION = {
  description: 'Complex data manipulation, advanced aggregation, data science operations, and ETL patterns',

  // Complex data manipulation
  complexDataManipulation: {
    nestedDataProcessing: {
      description: 'Handle deeply nested and complex data structures',
      techniques: [
        'Recursive flattening of nested objects',
        'Selective property extraction',
        'Conditional transformation based on data structure',
        'Type-safe data access patterns'
      ],
      implementation: `// Advanced nested data processing
const processNestedData = (data, schema) => {
  const flatten = (obj, prefix = '', result = {}) => {
    Object.keys(obj).forEach(key => {
      const newKey = prefix ? \`\${prefix}.\${key}\` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flatten(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    });
    return result;
  };

  const transform = (item) => {
    // Flatten nested structure
    const flattened = flatten(item);
    
    // Apply schema-based transformations
    const transformed = {};
    Object.keys(schema).forEach(field => {
      const mapping = schema[field];
      if (mapping.source) {
        transformed[field] = flattened[mapping.source];
      }
      if (mapping.transform) {
        transformed[field] = mapping.transform(transformed[field]);
      }
    });
    
    return transformed;
  };

  return Array.isArray(data) ? data.map(transform) : transform(data);
};

// Usage in n8n expressions
const nestedExpression = \`{{ 
  $json.user?.profile?.contact?.email || 
  $json.contact?.primary?.email || 
  $json.email || 
  'no-email@example.com' 
}}\`;`
    },

    dynamicFieldMapping: {
      description: 'Map fields dynamically based on runtime configuration',
      implementation: `// Dynamic field mapping system
const dynamicMapper = {
  // Mapping configuration stored in workflow static data
  mappingConfig: {
    "user_data": {
      "firstName": { "source": "first_name", "default": "" },
      "lastName": { "source": "last_name", "default": "" },
      "email": { "source": "email_address", "validate": "email" },
      "phone": { "source": "phone_number", "format": "international" },
      "age": { "source": "birth_date", "transform": "calculateAge" }
    }
  },

  // Transformation functions
  transforms: {
    calculateAge: (birthDate) => {
      const birth = new Date(birthDate);
      const today = new Date();
      return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
    },
    formatPhone: (phone, format) => {
      // Implementation for phone formatting
      return phone.replace(/\\D/g, '').replace(/(\\d{3})(\\d{3})(\\d{4})/, '($1) $2-$3');
    },
    validateEmail: (email) => {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      return emailRegex.test(email) ? email : null;
    }
  },

  // Apply mapping
  applyMapping: (data, mappingType) => {
    const config = dynamicMapper.mappingConfig[mappingType];
    const result = {};

    Object.keys(config).forEach(targetField => {
      const fieldConfig = config[targetField];
      let value = data[fieldConfig.source] || fieldConfig.default;

      // Apply transformations
      if (fieldConfig.transform && dynamicMapper.transforms[fieldConfig.transform]) {
        value = dynamicMapper.transforms[fieldConfig.transform](value);
      }

      // Apply validation
      if (fieldConfig.validate && dynamicMapper.transforms[fieldConfig.validate]) {
        value = dynamicMapper.transforms[fieldConfig.validate](value);
      }

      result[targetField] = value;
    });

    return result;
  }
};`
    },

    conditionalTransformation: {
      description: 'Apply different transformations based on data conditions',
      implementation: `// Conditional transformation engine
const conditionalTransform = {
  rules: [
    {
      condition: (data) => data.country === 'US',
      transforms: {
        phone: (phone) => formatUSPhone(phone),
        address: (addr) => normalizeUSAddress(addr),
        currency: () => 'USD'
      }
    },
    {
      condition: (data) => data.type === 'premium',
      transforms: {
        discount: (price) => price * 0.9,
        priority: () => 'high',
        features: (features) => [...features, 'premium-support']
      }
    },
    {
      condition: (data) => data.created_at && new Date(data.created_at) < new Date('2023-01-01'),
      transforms: {
        status: () => 'legacy',
        migrationRequired: () => true,
        archiveDate: (created) => new Date(new Date(created).getTime() + 365 * 24 * 60 * 60 * 1000)
      }
    }
  ],

  apply: (data) => {
    let transformed = { ...data };
    
    conditionalTransform.rules.forEach(rule => {
      if (rule.condition(data)) {
        Object.keys(rule.transforms).forEach(field => {
          transformed[field] = rule.transforms[field](data[field]);
        });
      }
    });

    return transformed;
  }
};

// n8n implementation using Function node
const conditionalTransformN8n = \`
const rules = [
  {
    condition: item => item.amount > 1000,
    transform: item => ({ ...item, category: 'high-value', requiresApproval: true })
  },
  {
    condition: item => item.urgency === 'high',
    transform: item => ({ ...item, priority: 1, escalate: true })
  }
];

return items.map(item => {
  let transformed = item.json;
  rules.forEach(rule => {
    if (rule.condition(transformed)) {
      transformed = rule.transform(transformed);
    }
  });
  return { json: transformed };
});
\`;`
    }
  },

  // Advanced aggregation
  advancedAggregation: {
    groupByMultipleFields: {
      description: 'Group data by multiple fields with complex aggregations',
      implementation: `// Multi-field grouping with aggregations
const advancedGroupBy = (data, groupFields, aggregations) => {
  const groups = {};
  
  data.forEach(item => {
    // Create composite key
    const key = groupFields.map(field => item[field]).join('||');
    
    if (!groups[key]) {
      groups[key] = {
        groupKey: key,
        groupValues: {},
        items: [],
        aggregates: {}
      };
      
      // Store group field values
      groupFields.forEach(field => {
        groups[key].groupValues[field] = item[field];
      });
    }
    
    groups[key].items.push(item);
  });
  
  // Calculate aggregations
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    
    Object.keys(aggregations).forEach(aggField => {
      const aggConfig = aggregations[aggField];
      const values = group.items.map(item => item[aggConfig.field]).filter(v => v != null);
      
      switch (aggConfig.function) {
        case 'sum':
          group.aggregates[aggField] = values.reduce((sum, val) => sum + Number(val), 0);
          break;
        case 'avg':
          group.aggregates[aggField] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
          break;
        case 'count':
          group.aggregates[aggField] = group.items.length;
          break;
        case 'min':
          group.aggregates[aggField] = Math.min(...values.map(Number));
          break;
        case 'max':
          group.aggregates[aggField] = Math.max(...values.map(Number));
          break;
        case 'concatenate':
          group.aggregates[aggField] = values.join(aggConfig.separator || ', ');
          break;
        case 'unique_count':
          group.aggregates[aggField] = new Set(values).size;
          break;
      }
    });
  });
  
  return Object.values(groups);
};

// Usage example
const salesData = [
  { region: 'North', product: 'A', sales: 100, date: '2023-01-01' },
  { region: 'North', product: 'B', sales: 150, date: '2023-01-01' },
  { region: 'South', product: 'A', sales: 200, date: '2023-01-02' }
];

const grouped = advancedGroupBy(
  salesData,
  ['region', 'product'],
  {
    totalSales: { field: 'sales', function: 'sum' },
    avgSales: { field: 'sales', function: 'avg' },
    salesCount: { field: 'sales', function: 'count' },
    dateRange: { field: 'date', function: 'concatenate', separator: ' to ' }
  }
);`
    },

    pivotTransformation: {
      description: 'Transform rows to columns (pivot) and columns to rows (unpivot)',
      implementation: `// Pivot and unpivot operations
const pivotOperations = {
  pivot: (data, indexField, columnField, valueField, aggregateFunction = 'sum') => {
    const result = {};
    const columns = new Set();
    
    // Collect all unique column values
    data.forEach(row => {
      columns.add(row[columnField]);
    });
    
    // Group by index field
    data.forEach(row => {
      const index = row[indexField];
      if (!result[index]) {
        result[index] = { [indexField]: index };
        columns.forEach(col => {
          result[index][col] = 0;
        });
      }
      
      const colValue = row[columnField];
      const value = Number(row[valueField]) || 0;
      
      // Apply aggregation
      switch (aggregateFunction) {
        case 'sum':
          result[index][colValue] += value;
          break;
        case 'count':
          result[index][colValue] += 1;
          break;
        case 'avg':
          // For avg, we need to track sum and count separately
          if (!result[index]._counts) result[index]._counts = {};
          result[index]._counts[colValue] = (result[index]._counts[colValue] || 0) + 1;
          result[index][colValue] += value;
          break;
      }
    });
    
    // Finalize averages
    if (aggregateFunction === 'avg') {
      Object.keys(result).forEach(index => {
        columns.forEach(col => {
          const count = result[index]._counts[col] || 1;
          result[index][col] = result[index][col] / count;
        });
        delete result[index]._counts;
      });
    }
    
    return Object.values(result);
  },

  unpivot: (data, indexFields, valueFields, keyColumnName = 'metric', valueColumnName = 'value') => {
    const result = [];
    
    data.forEach(row => {
      valueFields.forEach(field => {
        const newRow = {};
        
        // Copy index fields
        indexFields.forEach(indexField => {
          newRow[indexField] = row[indexField];
        });
        
        // Add metric name and value
        newRow[keyColumnName] = field;
        newRow[valueColumnName] = row[field];
        
        result.push(newRow);
      });
    });
    
    return result;
  }
};

// Usage examples
const salesData = [
  { month: 'Jan', region: 'North', sales: 100 },
  { month: 'Jan', region: 'South', sales: 150 },
  { month: 'Feb', region: 'North', sales: 120 },
  { month: 'Feb', region: 'South', sales: 180 }
];

// Pivot: regions as columns
const pivoted = pivotOperations.pivot(salesData, 'month', 'region', 'sales', 'sum');
// Result: [{ month: 'Jan', North: 100, South: 150 }, { month: 'Feb', North: 120, South: 180 }]

// Unpivot: convert back to long format
const unpivoted = pivotOperations.unpivot(pivoted, ['month'], ['North', 'South'], 'region', 'sales');`
    },

    timeSeriesAggregation: {
      description: 'Specialized aggregations for time-series data',
      implementation: `// Time-series aggregation functions
const timeSeriesAggregation = {
  // Group by time intervals
  groupByTimeInterval: (data, timestampField, interval, timezone = 'UTC') => {
    const groups = {};
    
    data.forEach(item => {
      const timestamp = new Date(item[timestampField]);
      const key = timeSeriesAggregation.getIntervalKey(timestamp, interval, timezone);
      
      if (!groups[key]) {
        groups[key] = {
          interval: key,
          timestamp: timeSeriesAggregation.getIntervalStart(timestamp, interval),
          items: []
        };
      }
      
      groups[key].items.push(item);
    });
    
    return Object.values(groups);
  },

  // Calculate moving averages
  movingAverage: (data, field, windowSize, timestampField) => {
    const sorted = [...data].sort((a, b) => 
      new Date(a[timestampField]) - new Date(b[timestampField])
    );
    
    return sorted.map((item, index) => {
      const start = Math.max(0, index - windowSize + 1);
      const window = sorted.slice(start, index + 1);
      const avg = window.reduce((sum, w) => sum + Number(w[field]), 0) / window.length;
      
      return {
        ...item,
        [\`\${field}_ma\${windowSize}\`]: avg
      };
    });
  },

  // Detect trends and patterns
  detectTrends: (data, field, timestampField) => {
    const sorted = [...data].sort((a, b) => 
      new Date(a[timestampField]) - new Date(b[timestampField])
    );
    
    const trends = [];
    for (let i = 1; i < sorted.length; i++) {
      const current = Number(sorted[i][field]);
      const previous = Number(sorted[i-1][field]);
      const change = current - previous;
      const percentChange = previous !== 0 ? (change / previous) * 100 : 0;
      
      trends.push({
        ...sorted[i],
        change: change,
        percentChange: percentChange,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
      });
    }
    
    return trends;
  },

  // Utility functions
  getIntervalKey: (timestamp, interval, timezone) => {
    const date = new Date(timestamp);
    
    switch (interval) {
      case 'hour':
        return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')} \${String(date.getHours()).padStart(2, '0')}:00\`;
      case 'day':
        return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')}\`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return \`\${weekStart.getFullYear()}-W\${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}\`;
      case 'month':
        return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}\`;
      default:
        return date.toISOString();
    }
  }
};`
    }
  }
} as const;