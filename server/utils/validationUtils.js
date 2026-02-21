import { body, validationResult } from 'express-validator';

export const validate = (validations) => {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      
      const extractedErrors = [];
      errors.array().map(err => extractedErrors.push({ 
        [err.path]: err.msg 
      }));

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: extractedErrors
      });
    }
  ];
};