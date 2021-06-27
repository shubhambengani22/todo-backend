import { BaseController } from "./base-controller";
import { NextFunction, Response, Router } from "express";
import { Validation } from "@helpers";
import { TodoItem, TodoItems } from "@models";
import {
  AppContext,
  Errors,
  ExtendedRequest,
  ValidationFailure,
} from "@typings";

import {
  createTodoItemValidator,
  deleteTodoItemValidator,
  updateTodoItemValidator,
  fetchTodoItemValidator,
} from "@validators";

export class TodoItemController extends BaseController {
  public basePath: string = "/todos";
  public router: Router = Router();

  constructor(ctx: AppContext) {
    super(ctx);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.basePath}`,
      createTodoItemValidator(this.appContext),
      this.createTodoItem
    );

    this.router.delete(
      `${this.basePath}/:id`,
      deleteTodoItemValidator(this.appContext),
      this.deleteTodoItem
    );
    this.router.put(
      `${this.basePath}/:id`,
      updateTodoItemValidator(this.appContext),
      this.updateTodoItem
    );

    this.router.get(
      `${this.basePath}/:id`,
      fetchTodoItemValidator(this.appContext),
      this.fetchTodoItem
    );

    this.router.get(`${this.basePath}`, this.listTodoItem);
  }

  private createTodoItem = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req);
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED"),
        failures
      );
      return next(valError);
    }

    const { title } = req.body;
    const todoItem = await this.appContext.todoItemRepository.save(
      new TodoItem({ title })
    );
    res.status(201).json(todoItem.serialize());
  };

  private deleteTodoItem = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req);
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED"),
        failures
      );
      return next(valError);
    }

    const { id } = req.params;
    const deleteItem = await this.appContext.todoItemRepository.deleteMany({
      _id: id,
    });
    res.status(204).json(deleteItem);
  };

  private updateTodoItem = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req);
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED"),
        failures
      );
      return next(valError);
    }

    const { id } = req.params;
    const { title } = req.body;
    const todoItem = await this.appContext.todoItemRepository.update(
      { _id: id },
      { $set: { title } }
    );

    if (todoItem._id) {
      res.status(200).json(todoItem.serialize());
    } else {
      const valError = new Errors.NotFoundError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED")
      );
      next(valError);
    }
  };

  private fetchTodoItem = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req);
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED"),
        failures
      );
      return next(valError);
    }

    const { id } = req.params;
    const todoItem = await this.appContext.todoItemRepository.findOne({
      _id: id,
    });

    if (todoItem._id) {
      res.status(200).json(todoItem.serialize());
    } else {
      const valError = new Errors.NotFoundError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED")
      );
      next(valError);
    }
  };

  private listTodoItem = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req);
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__("DEFAULT_ERRORS.VALIDATION_FAILED"),
        failures
      );
      return next(valError);
    }

    const todoItems = new TodoItems(
      await this.appContext.todoItemRepository.getAll({})
    );

    res.status(200).json(todoItems.serialize());
  };
}
