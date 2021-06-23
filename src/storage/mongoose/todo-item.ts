import { model, Schema } from 'mongoose'

const todoItemSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
  },
  {
    collection: 'todo-items',
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  }
)
const todoItems = model('TodoItem', todoItemSchema)
export default todoItems
