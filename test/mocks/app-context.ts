import { Repositories } from '../../src/storage'
import { AppContext } from '../../src/typings'
import { MockLogger } from './mock-logger'
import { InMemoryMongoStore } from './in-memory-mongo-store'

const mockStore = new InMemoryMongoStore()
const mockLogger = new MockLogger()

export const respositoryContext = {
  logger: mockLogger,
  store: mockStore,
  translate: (value: string) => value,
}

export const testAppContext: AppContext = {
  logger: mockLogger,
  accountRepository: new Repositories.AccountRepository(respositoryContext),
  todoItemRepository: new Repositories.TodoItemRepository(respositoryContext),
}
