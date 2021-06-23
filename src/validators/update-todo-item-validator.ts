import lodash from 'lodash'
import { check, param, ValidationChain } from 'express-validator'
import { AppContext } from '@typings'

const updateTodoItemValidator = (appContext: AppContext): ValidationChain[] => [
  check('id', 'VALIDATION_ERRORS.INVALID_ID').isMongoId(),
  check('title', 'VALIDATION_ERRORS.INVALID_TITLE').notEmpty().isString(),
]

export default updateTodoItemValidator
