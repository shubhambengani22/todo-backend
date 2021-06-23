import { BaseController } from './base-controller'
import { NextFunction, Response, Router } from 'express'
import { Validation } from '@helpers'
import { TodoItem } from '@models'
import {
  AppContext,
  Errors,
  ExtendedRequest,
  ValidationFailure,
} from '@typings'
import { createTodoItemValidator } from '@validators'

export class TodoItemController extends BaseController {
  public basePath: string = '/todos'
  public router: Router = Router()

  constructor(ctx: AppContext) {
    super(ctx)
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(
      `${this.basePath}`,
      createTodoItemValidator(this.appContext),
      this.createTodoItem
    )
  }

  private createTodoItem = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req)
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__('DEFAULT_ERRORS.VALIDATION_FAILED'),
        failures
      )
      return next(valError)
    }

    const { title } = req.body
    console.log(title)
    const todoItem = await this.appContext.todoItemRepository.save(
      new TodoItem({ title })
    )
    res.status(201).json(todoItem.serialize())
  }
}
