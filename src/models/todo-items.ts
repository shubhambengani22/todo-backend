import { BaseModel } from './base-model'
import { LooseObject } from '@typings'

export class TodoItems extends BaseModel {
  todoItems: LooseObject = []

  constructor(json?: LooseObject) {
    super(json)
    if (json) {
      this.todoItems = json
    }
  }

  public serialize(): LooseObject {
    return this.todoItems.map((todoItem: LooseObject) => todoItem.serialize())
  }
}
