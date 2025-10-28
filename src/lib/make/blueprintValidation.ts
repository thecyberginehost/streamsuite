/**
 * Make.com Blueprint Validation
 * Use this to validate generated blueprints before returning to user
 * Catches common errors that cause import failures
 */

import { VERIFIED_MODULE_NAMES } from './moduleValidation';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixes?: BlueprintFix[];
}

export interface ValidationError {
  type: 'structure' | 'module_name' | 'parameters' | 'connections' | 'metadata';
  message: string;
  location?: string;
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: 'best_practice' | 'optimization' | 'compatibility';
  message: string;
  location?: string;
}

export interface BlueprintFix {
  type: string;
  description: string;
  oldValue: any;
  newValue: any;
  applied: boolean;
}

/**
 * Main validation function for Make.com blueprints
 */
export const validateMakeBlueprint = (blueprint: any): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const fixes: BlueprintFix[] = [];

  // 1. Validate top-level structure
  if (!blueprint.flow || !Array.isArray(blueprint.flow)) {
    errors.push({
      type: 'structure',
      message: 'Blueprint must have a "flow" array at the root level',
      suggestedFix: 'Ensure blueprint has { "flow": [...], "metadata": {...} } structure'
    });
    return { isValid: false, errors, warnings };
  }

  if (!blueprint.metadata) {
    errors.push({
      type: 'structure',
      message: 'Blueprint must have a "metadata" object at the root level',
      suggestedFix: 'Add metadata object with version and scenario settings'
    });
  }

  // 2. Validate each module in flow
  blueprint.flow.forEach((module: any, index: number) => {
    const moduleErrors = validateModule(module, index);
    errors.push(...moduleErrors);

    // Check for module name corrections
    const moduleFix = attemptModuleNameFix(module);
    if (moduleFix) {
      fixes.push(moduleFix);
      warnings.push({
        type: 'compatibility',
        message: `Module "${module.module}" might be incorrect. Suggested: "${moduleFix.newValue}"`,
        location: `flow[${index}].module`
      });
    }
  });

  // 3. Validate module IDs are sequential
  const idErrors = validateModuleIds(blueprint.flow);
  errors.push(...idErrors);

  // 4. Validate metadata structure
  if (blueprint.metadata) {
    const metadataErrors = validateMetadata(blueprint.metadata);
    errors.push(...metadataErrors);
  }

  // 5. Validate connections (if any exist)
  const connectionWarnings = validateConnections(blueprint.flow);
  warnings.push(...connectionWarnings);

  // 6. Best practice warnings
  const bestPracticeWarnings = checkBestPractices(blueprint);
  warnings.push(...bestPracticeWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixes: fixes.length > 0 ? fixes : undefined
  };
};

/**
 * Validate individual module structure
 */
const validateModule = (module: any, index: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields
  if (!module.id) {
    errors.push({
      type: 'structure',
      message: `Module at index ${index} is missing required "id" field`,
      location: `flow[${index}]`
    });
  }

  if (!module.module) {
    errors.push({
      type: 'structure',
      message: `Module at index ${index} is missing required "module" field`,
      location: `flow[${index}]`
    });
  } else {
    // Validate module name format
    const moduleNameError = validateModuleName(module.module, index);
    if (moduleNameError) {
      errors.push(moduleNameError);
    }
  }

  if (module.version === undefined) {
    errors.push({
      type: 'structure',
      message: `Module at index ${index} is missing required "version" field`,
      location: `flow[${index}]`,
      suggestedFix: 'Add "version": 1'
    });
  }

  if (!module.metadata) {
    errors.push({
      type: 'structure',
      message: `Module at index ${index} is missing required "metadata" field`,
      location: `flow[${index}]`,
      suggestedFix: 'Add "metadata": { "designer": { "x": 0, "y": 0 } }'
    });
  }

  if (!module.metadata?.designer) {
    errors.push({
      type: 'metadata',
      message: `Module at index ${index} is missing designer coordinates`,
      location: `flow[${index}].metadata`,
      suggestedFix: 'Add "designer": { "x": 0, "y": 0 }'
    });
  }

  // Mapper and parameters should exist (can be empty objects)
  if (module.mapper === undefined) {
    errors.push({
      type: 'structure',
      message: `Module at index ${index} is missing "mapper" field`,
      location: `flow[${index}]`,
      suggestedFix: 'Add "mapper": {}'
    });
  }

  if (module.parameters === undefined) {
    errors.push({
      type: 'structure',
      message: `Module at index ${index} is missing "parameters" field`,
      location: `flow[${index}]`,
      suggestedFix: 'Add "parameters": {}'
    });
  }

  return errors;
};

/**
 * Validate module name against known good names
 */
const validateModuleName = (moduleName: string, index: number): ValidationError | null => {
  // Check if module name exists in verified list
  const isVerified = VERIFIED_MODULE_NAMES.some(verified =>
    verified.correct === moduleName
  );

  if (!isVerified) {
    // Check if it's a common mistake
    const commonMistake = VERIFIED_MODULE_NAMES.find(verified =>
      verified.common_mistakes.includes(moduleName)
    );

    if (commonMistake) {
      return {
        type: 'module_name',
        message: `Module "${moduleName}" is incorrect. Use "${commonMistake.correct}" instead.`,
        location: `flow[${index}].module`,
        suggestedFix: commonMistake.correct
      };
    }

    // Unknown module - might be valid but warn
    return {
      type: 'module_name',
      message: `Module "${moduleName}" is not in the verified module list. This may cause import errors.`,
      location: `flow[${index}].module`,
      suggestedFix: 'Verify module name against Make.com documentation'
    };
  }

  return null;
};

/**
 * Attempt to automatically fix module names
 */
const attemptModuleNameFix = (module: any): BlueprintFix | null => {
  const moduleName = module.module;

  // Check common mistakes
  const correction = VERIFIED_MODULE_NAMES.find(verified =>
    verified.common_mistakes.includes(moduleName)
  );

  if (correction) {
    return {
      type: 'module_name_correction',
      description: `Corrected module name from "${moduleName}" to "${correction.correct}"`,
      oldValue: moduleName,
      newValue: correction.correct,
      applied: false
    };
  }

  return null;
};

/**
 * Validate module IDs are sequential starting from 1
 */
const validateModuleIds = (flow: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const ids = flow.map(m => m.id);

  // Check if IDs are sequential
  for (let i = 0; i < ids.length; i++) {
    const expectedId = i + 1;
    if (ids[i] !== expectedId) {
      errors.push({
        type: 'structure',
        message: `Module IDs must be sequential. Expected ${expectedId} at index ${i}, got ${ids[i]}`,
        location: `flow[${i}].id`,
        suggestedFix: `Change id to ${expectedId}`
      });
    }
  }

  // Check for duplicate IDs
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    errors.push({
      type: 'structure',
      message: 'Duplicate module IDs found. Each module must have a unique sequential ID.',
      suggestedFix: 'Renumber modules starting from 1'
    });
  }

  return errors;
};

/**
 * Validate metadata structure
 */
const validateMetadata = (metadata: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!metadata.version) {
    errors.push({
      type: 'metadata',
      message: 'Metadata is missing "version" field',
      location: 'metadata.version',
      suggestedFix: 'Add "version": 1'
    });
  }

  if (!metadata.scenario) {
    errors.push({
      type: 'metadata',
      message: 'Metadata is missing "scenario" field',
      location: 'metadata.scenario',
      suggestedFix: 'Add scenario settings object'
    });
  } else {
    // Validate scenario settings
    const requiredScenarioFields = [
      'roundtrips', 'maxErrors', 'autoCommit', 'autoCommitTriggerLast',
      'sequential', 'confidential', 'dataloss', 'dlq', 'freshVariables'
    ];

    requiredScenarioFields.forEach(field => {
      if (metadata.scenario[field] === undefined) {
        errors.push({
          type: 'metadata',
          message: `Scenario settings missing "${field}" field`,
          location: `metadata.scenario.${field}`,
          suggestedFix: `Add "${field}": ${getDefaultScenarioValue(field)}`
        });
      }
    });
  }

  if (!metadata.designer) {
    errors.push({
      type: 'metadata',
      message: 'Metadata is missing "designer" field',
      location: 'metadata.designer',
      suggestedFix: 'Add "designer": { "orphans": [] }'
    });
  }

  return errors;
};

/**
 * Get default value for scenario field
 */
const getDefaultScenarioValue = (field: string): any => {
  const defaults: Record<string, any> = {
    roundtrips: 1,
    maxErrors: 3,
    autoCommit: true,
    autoCommitTriggerLast: true,
    sequential: false,
    confidential: false,
    dataloss: false,
    dlq: false,
    freshVariables: false
  };
  return defaults[field];
};

/**
 * Validate connections between modules
 */
const validateConnections = (flow: any[]): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  // Check if modules have proper sequence (each module should have input from previous)
  // This is a warning, not an error, as some scenarios have parallel branches

  if (flow.length > 1) {
    const hasRouter = flow.some(m => m.module === 'builtin:BasicRouter');

    if (!hasRouter && flow.length > 5) {
      warnings.push({
        type: 'best_practice',
        message: 'Large linear workflow detected. Consider using router for better organization.',
        location: 'flow'
      });
    }
  }

  return warnings;
};

/**
 * Check for best practices
 */
const checkBestPractices = (blueprint: any): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  // Check for description
  if (!blueprint.description || blueprint.description.trim().length < 10) {
    warnings.push({
      type: 'best_practice',
      message: 'Blueprint should have a detailed description for better usability',
      location: 'description'
    });
  }

  // Check for name
  if (!blueprint.name || blueprint.name.trim().length < 3) {
    warnings.push({
      type: 'best_practice',
      message: 'Blueprint should have a descriptive name',
      location: 'name'
    });
  }

  // Check module spacing
  const flow = blueprint.flow || [];
  if (flow.length > 1) {
    const xCoordinates = flow.map((m: any) => m.metadata?.designer?.x || 0);
    const hasOverlap = xCoordinates.some((x: number, i: number) =>
      i > 0 && Math.abs(x - xCoordinates[i - 1]) < 100
    );

    if (hasOverlap) {
      warnings.push({
        type: 'best_practice',
        message: 'Module visual spacing is too tight. Increase x-coordinates for better readability.',
        location: 'flow[].metadata.designer'
      });
    }
  }

  return warnings;
};

/**
 * Auto-fix common issues in blueprints
 */
export const autoFixBlueprint = (blueprint: any): { blueprint: any; fixes: BlueprintFix[] } => {
  const fixes: BlueprintFix[] = [];
  const fixedBlueprint = JSON.parse(JSON.stringify(blueprint)); // Deep clone

  // Fix 1: Correct module names
  if (fixedBlueprint.flow) {
    fixedBlueprint.flow.forEach((module: any, index: number) => {
      const correction = VERIFIED_MODULE_NAMES.find(verified =>
        verified.common_mistakes.includes(module.module)
      );

      if (correction) {
        fixes.push({
          type: 'module_name_correction',
          description: `Corrected module name at flow[${index}]`,
          oldValue: module.module,
          newValue: correction.correct,
          applied: true
        });
        module.module = correction.correct;
      }
    });
  }

  // Fix 2: Add missing metadata
  if (!fixedBlueprint.metadata) {
    fixedBlueprint.metadata = {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      }
    };
    fixes.push({
      type: 'add_metadata',
      description: 'Added missing metadata object',
      oldValue: null,
      newValue: fixedBlueprint.metadata,
      applied: true
    });
  }

  // Fix 3: Renumber module IDs
  if (fixedBlueprint.flow) {
    const needsRenumbering = fixedBlueprint.flow.some((m: any, i: number) => m.id !== i + 1);

    if (needsRenumbering) {
      const oldIds = fixedBlueprint.flow.map((m: any) => m.id);
      fixedBlueprint.flow.forEach((module: any, index: number) => {
        module.id = index + 1;
      });
      fixes.push({
        type: 'renumber_ids',
        description: 'Renumbered module IDs to be sequential',
        oldValue: oldIds,
        newValue: fixedBlueprint.flow.map((m: any) => m.id),
        applied: true
      });
    }
  }

  // Fix 4: Add missing designer coordinates
  if (fixedBlueprint.flow) {
    fixedBlueprint.flow.forEach((module: any, index: number) => {
      if (!module.metadata) {
        module.metadata = {};
      }
      if (!module.metadata.designer) {
        module.metadata.designer = {
          x: index * 300,
          y: 0
        };
        fixes.push({
          type: 'add_designer_coords',
          description: `Added designer coordinates to module ${index + 1}`,
          oldValue: null,
          newValue: module.metadata.designer,
          applied: true
        });
      }
    });
  }

  return { blueprint: fixedBlueprint, fixes };
};

/**
 * Example validation usage
 */
export const VALIDATION_EXAMPLES = {
  valid_blueprint: {
    name: "Valid Example",
    description: "This blueprint will pass validation",
    flow: [
      {
        id: 1,
        module: "webhook",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 0, y: 0 }
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: { orphans: [] }
    }
  },

  invalid_module_name: {
    name: "Invalid Module Name",
    flow: [
      {
        id: 1,
        module: "openai", // WRONG - should be "openai-gpt-3"
        version: 1,
        parameters: {},
        mapper: {},
        metadata: { designer: { x: 0, y: 0 } }
      }
    ]
  },

  missing_metadata: {
    name: "Missing Metadata",
    flow: [
      {
        id: 1,
        module: "webhook",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: { designer: { x: 0, y: 0 } }
      }
    ]
    // Missing metadata object - will cause error
  },

  wrong_structure: {
    name: "Wrong Structure",
    scenario: { // WRONG - should be "flow"
      modules: [
        {
          id: 1,
          module: "webhook"
        }
      ]
    }
  }
};
