/**
 * Binary File Processing and Data Manipulation
 */

export const N8N_BINARY_FILE_PROCESSING = {
  description: 'File-type data handling including images, documents, and media files',
  
  // Core binary data nodes
  nodes: {
    'n8n-nodes-base.readwritefile': {
      description: 'Read/write files from local filesystem (self-hosted only)',
      operations: ['read', 'write'],
      parameters: {
        operation: 'read | write',
        filePath: 'Path to file (supports patterns like *.txt)',
        fileName: 'Name for output file',
        binaryData: 'Binary property name'
      }
    },
    
    'n8n-nodes-base.converttofile': {
      description: 'Convert JSON data to various file formats',
      supportedFormats: ['CSV', 'Excel', 'JSON', 'HTML', 'PDF', 'RTF', 'ICS', 'ODS'],
      parameters: {
        operation: 'csv | xlsx | json | html | pdf | rtf | ics | ods',
        fileName: 'Output filename with extension',
        options: 'Format-specific options (delimiter, headers, etc.)'
      }
    },
    
    'n8n-nodes-base.extractfromfile': {
      description: 'Extract data from files to JSON format',
      supportedFormats: ['CSV', 'Excel', 'JSON', 'HTML', 'PDF', 'RTF', 'ICS'],
      parameters: {
        operation: 'csv | xlsx | json | html | pdf | rtf | ics',
        binaryPropertyName: 'Property containing the file data',
        options: 'Format-specific parsing options'
      }
    },
    
    'n8n-nodes-base.editimage': {
      description: 'Manipulate and edit images',
      operations: ['blur', 'border', 'composite', 'create', 'crop', 'draw', 'resize', 'rotate', 'text', 'transparent'],
      requirements: 'GraphicsMagick (included in Docker)',
      parameters: {
        operation: 'Image manipulation operation',
        binaryPropertyName: 'Property containing image data',
        operationSpecific: 'Parameters specific to chosen operation'
      }
    },
  },

  // File format handling
  formatHandling: {
    csv: {
      reading: 'delimiter, skipHeaders, encoding',
      writing: 'delimiter, includeHeaders, encoding',
      examples: {
        read: 'Extract customer data from uploaded CSV',
        write: 'Export sales report to CSV file'
      }
    },
    
    excel: {
      reading: 'sheetName, headerRow, range',
      writing: 'sheetName, includeHeaders, formatting',
      examples: {
        read: 'Process inventory data from Excel file',
        write: 'Create formatted financial report'
      }
    },
    
    images: {
      formats: ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WebP'],
      operations: 'resize, crop, rotate, blur, text overlay, watermark',
      examples: {
        processing: 'Resize user avatars, add watermarks to uploads',
        generation: 'Create charts, thumbnails, social media images'
      }
    },
    
    pdf: {
      reading: 'Extract text content from PDF documents',
      writing: 'Generate PDF reports from HTML/data',
      examples: {
        extract: 'Parse invoice data from PDF uploads',
        create: 'Generate customer reports, certificates'
      }
    },
  },

  // Common binary data patterns
  patterns: {
    fileUploadProcessing: {
      description: 'Handle user file uploads',
      flow: 'Webhook (file upload) → Extract From File → Process Data → Store Results',
      example: 'CSV upload → Extract data → Validate → Import to database'
    },
    
    reportGeneration: {
      description: 'Create downloadable reports',
      flow: 'Data Collection → Format Data → Convert to File → Email/Store',
      example: 'Gather sales data → Format as table → Create Excel → Email to manager'
    },
    
    imageProcessing: {
      description: 'Automatic image optimization',
      flow: 'Image Upload → Edit Image → Multiple Sizes → Store/CDN',
      example: 'User avatar → Resize to 100x100, 200x200 → Upload to storage'
    },
    
    documentGeneration: {
      description: 'Dynamic document creation',
      flow: 'Template + Data → HTML Generation → Convert to PDF → Delivery',
      example: 'Invoice template + order data → HTML → PDF → Email to customer'
    },
  },

  // Binary data expressions
  expressions: {
    fileName: '{{ $binary.data.fileName }}',
    fileSize: '{{ $binary.data.fileSize }}',
    mimeType: '{{ $binary.data.mimeType }}',
    hasFile: '{{ $binary.data !== undefined }}',
    fileExtension: '{{ $binary.data.fileName.split(".").pop() }}',
    fileSizeHuman: '{{ ($binary.data.fileSize / 1024 / 1024).toFixed(2) + " MB" }}',
  },
} as const;