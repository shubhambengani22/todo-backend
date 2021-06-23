import lodash from 'lodash'
import { check, ValidationChain } from 'express-validator'
import { AppContext } from '@typings'

const createTodoItemValidator = (appContext: AppContext): ValidationChain[] => [
  check('title', 'VALIDATION_ERRORS.INVALID_TITLE').notEmpty().isString(),
  check('title')
    .custom(async (title) => {
      const todoItem = await appContext.todoItemRepository.findOne({
        title,
      })
      if (!lodash.isEmpty(todoItem)) {
        return Promise.reject()
      }
    })
    .withMessage('VALIDATION_ERRORS.DUPLICATE_TITLE'),
]

export default createTodoItemValidator
