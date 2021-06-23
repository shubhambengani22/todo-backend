import { BaseRepository } from './base-repository'
import { ModelFactory, TodoItem } from '@models'
import { RepositoryContext } from './repository-context'

export class TodoItemRepository extends BaseRepository<TodoItem> {
  constructor(context: RepositoryContext) {
    super(context)
  }

  protected modelFactory(): ModelFactory<TodoItem> {
    return {
      getType() {
        return typeof TodoItem
      },
      create(json: any) {
        return new TodoItem(json)
      },
    }
  }
}
