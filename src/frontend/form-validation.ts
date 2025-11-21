import { body, CustomValidator, ValidationChain } from 'express-validator';
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
    } catch {
      throw new Error(`Field ${fieldNameSmaller} cannot be converted to integer`);
    }

    if (maxVal < minVal) {
      throw new Error(`Attribute ${fieldNameSmaller} (${minVal}) may not exceed maximum value`);
    }

    return input;
  };
}

export function getValidationChains(): Array<ValidationChain> {
  const validationChains: Array<ValidationChain> = [
    body('targetPort').exists().isInt({ min: 0, max: constants.PORT_MAX }), // PORT_MAX is a technical limit
    body('appCount').exists().isInt({ min: 1 }),
    body('packageDepth').exists().isInt({ min: 0 }),
    body('minClassCount').exists().isInt({ min: 1 }),
    body('maxClassCount').exists().isInt({ min: 1 }),
    body('minMethodCount').exists().isInt({ min: 1 }),
    body('maxMethodCount').exists().isInt({ min: 1 }),
    body('duration').exists().isInt({ min: 1 }),
    body('callCount').exists().isInt({ min: 1 }),
    body('maxCallDepth').exists().isInt({ min: 0 }),
    body('balance').exists().isFloat({ min: 0, max: 1 }), // Balance is logically 0-1
    body('communicationStyle').exists().isIn(Object.keys(constants.COMMUNICATION_STYLE_NAMES)),
    body('targetHostname').exists().isURL({
      require_tld: false,
      require_port: false,
      require_protocol: false,
    }),
    body('maxClassCount').exists().custom(getCustomValidatorLessThan('minClassCount')),
    body('maxMethodCount').exists().custom(getCustomValidatorLessThan('minMethodCount')),
  ];

  return validationChains;
}
