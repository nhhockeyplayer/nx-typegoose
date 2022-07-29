import { Severity } from './internal/constants';
import { globalOptions } from './internal/data';
import { ExpectedTypeError } from './internal/errors';
import { assertion, isNullOrUndefined } from './internal/utils';
import { logger } from './logSettings';
import type { IGlobalOptions } from './types';
import {MergeService} from './internal/merge.service'

/**
 * Set Typegoose's global Options
 */
export function setGlobalOptions(options: IGlobalOptions) {
  assertion(!isNullOrUndefined(options) && typeof options === 'object', () => new ExpectedTypeError('options', 'object', options));

  logger.info('"setGlobalOptions" got called with', options);

  // for (const key of Object.keys(options)) {
  //   globalOptions[key] = Object.assign({}, globalOptions[key], options[key]);
  // }
  MergeService.deepMerge(globalOptions, options, { clone: true });

  logger.info('new Global Options:', options);
}

/**
 * Parse Typegoose Environment Variables and apply them
 */
export function parseENV(): void {
  logger.info('"parseENV" got called');

  const options: IGlobalOptions = {
    globalOptions: {},
    options: {
      allowMixed:
        process.env['TG_ALLOW_MIXED'] && process.env['TG_ALLOW_MIXED'] in Severity
          ? mapValueToSeverity(process.env['TG_ALLOW_MIXED'])
          : globalOptions.options?.allowMixed,
    },
  };

  setGlobalOptions(options);
}

/**
 * Maps strings to the number of "Severity"
 * -> This function is specifically build for "Severity"-Enum
 * @throws {Error} if not in range of the "Severity"-Enum
 * @example
 * ```ts
 * mapValueToSeverity("WARN") === 1
 * mapValueToSeverity("1") === 1
 * // now internal use
 * mapValueToSeverity(1) === 1
 * ```
 * @param value The Value to translate
 * @internal
 */
export function mapValueToSeverity(value: string | number): Severity {
  assertion(value in Severity, () => new Error(`"value" is not in range of "Severity"! (got: ${value})`));

  if (typeof value === 'number') {
    return value;
  }

  // @ts-ignore
  return mapValueToSeverity(Severity[value]);
}
