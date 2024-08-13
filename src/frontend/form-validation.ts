import { body, CustomValidator, ValidationChain, validationResult } from 'express-validator'
import { constants } from '../constants';

/**
 * Returns a custom validator that validates the input field to be larger than the passed field.
 * The validation fails if the input field is smaller than the passed field, or if the passed
 * field cannot be found in the request body
 * @param fieldNameSmaller Field that should be smaller than the input field
 * @returns 
 */
function getCustomValidatorLessThan(fieldNameSmaller: string): CustomValidator {
  return (input, { req }) => {
    if (!(fieldNameSmaller in req.body)) {
      throw new Error(`Attribute missing: ${fieldNameSmaller}`);
    }

    let minVal, maxVal: number;

    try {
      minVal = parseInt(req.body[fieldNameSmaller]);
      maxVal = parseInt(input);
    } catch (err) {
      throw new Error(`Field ${fieldNameSmaller} cannot be converted to integer`);
    }

    if (maxVal < minVal) {
      throw new Error(`Attribute ${fieldNameSmaller} (${minVal}) may not exceed maximum value`);
    }

    return input;
  }
}

export function getValidationChains(): Array<ValidationChain> {
  let validationChains: Array<ValidationChain> = [
    body('targetPort').exists().isInt({ min: 0, max: constants.PORT_MAX }), 
    body('appCount').exists().isInt({ min: 1, max: constants.MAX_APP_COUNT }),
    body('packageDepth').exists().isInt({ min: 0, max: constants.MAX_PACKAGE_DEPTH }),
    body('minClassCount').exists().isInt({ min: 1, max: constants.MAX_CLASS_COUNT }),
    body('maxClassCount').exists().isInt({ min: 1, max: constants.MAX_CLASS_COUNT }), 
    body('minMethodCount').exists().isInt({ min: 1, max: constants.MAX_METHODS }),
    body('maxMethodCount').exists().isInt({ min: 1, max: constants.MAX_METHODS }),
    body('duration').exists().isInt({ min: 1, max: constants.MAX_TRACE_DURATION }),
    body('callCount').exists().isInt({ min: 1, max: constants.MAX_CALL_COUNT }),
    body('maxCallDepth').exists().isInt({ min: 0, max: constants.MAX_CALL_DEPTH }),
    body('balance').exists().isFloat({ min: 0, max: 1 }),
    body('communicationStyle').exists().isIn(constants.COMMUNICATION_STYLE_NAMES),
    body('targetHostname').exists().isURL({ require_tld: false, require_port: false, require_protocol: false }),

    body('maxClassCount').exists().custom(getCustomValidatorLessThan('minClassCount')),
    body('maxMethodCount').exists().custom(getCustomValidatorLessThan('minMethodCount')),
  ];

  return validationChains;
} 