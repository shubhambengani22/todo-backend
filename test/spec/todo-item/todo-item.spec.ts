require('module-alias/register')

import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
import chaiHttp from 'chai-http'
import { Application } from 'express'
import { respositoryContext, testAppContext } from '../../mocks/app-context'

import { App } from '../../../src/server'
import { TodoItem } from '../../../src/models'
import lodash from 'lodash'

chai.use(chaiHttp)
const expect = chai.expect
let expressApp: Application

before(async () => {
  await respositoryContext.store.connect()
  const app = new App(testAppContext)
  app.initializeMiddlewares()
  app.initializeControllers()
  app.initializeErrorHandling()
  expressApp = app.expressApp
})

describe('POST /todos', () => {
  it('should create a new todoitem', async () => {
    const res = await chai.request(expressApp).post('/todos').send({
      title: 'First Title',
    })

    expect(res).to.have.status(201)
    expect(res.body).to.have.property('id')
    expect(res.body).to.have.property('title')
  })

  it('should return a validation error if empty title is specified', async () => {
    const res = await chai.request(expressApp).post('/todos').send({
      title: '',
    })

    const checkIfRecordInserted =
      await testAppContext.todoItemRepository.findOne({
        title: '',
      })

    if (lodash.isEmpty(checkIfRecordInserted)) {
      expect(res).to.have.status(400)
      expect(res.body).to.have.property('message')
      expect(res.body).to.have.property('failures')
      expect(res.body.failures[0].message).to.equal(
        'The title is empty or the title is not a string.'
      )
    }
  })

  it('should return a validation error if title is not string', async () => {
    const res = await chai
      .request(expressApp)
      .post('/todos')
      .send({
        title: { field: 'title' },
      })

    expect(res).to.have.status(400)
    expect(res.body)
      .to.have.nested.property('failures[0].message')
      .to.equal('The title is empty or the title is not a string.')
  })

  it('should return a validation error if title is already present in the Database', async () => {
    await testAppContext.todoItemRepository.save(
      new TodoItem({
        title: 'First Title',
      })
    )

    const res = await chai.request(expressApp).post('/todos').send({
      title: 'First Title',
    })

    const checkIfRecordInserted =
      await testAppContext.todoItemRepository.findOne({
        title: 'First Title',
      })

    if (lodash.isEmpty(checkIfRecordInserted)) {
      expect(res).to.have.status(400)
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal(
          'The title name is already taken. Please enter a different one.'
        )
    }
  })

  describe('DELETE /todos/:id', () => {
    it('should delete a todo item if it exists and if ID is valid MongoDB ID', async () => {
      const todoItem = await testAppContext.todoItemRepository.save(
        new TodoItem({ title: 'Title to be deleted' })
      )
      const res = await chai
        .request(expressApp)
        .delete(`/todos/${todoItem._id}`)

      expect(res).to.have.status(204)
    })

    it('should return a validation error if todo item does not exists and if id is a mongo id', async () => {
      const res = await chai
        .request(expressApp)
        .delete('/todos/60d2fe74bd99a211407165e9')

      expect(res).to.have.status(400)
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal(
          'The item with the specified ID could not be found. Please enter a valid ID.'
        )
    })

    it('should return a validation error if id is not a mongo id', async () => {
      const res = await chai.request(expressApp).delete('/todos/2114071')

      expect(res).to.have.status(400)
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal('The specified ID is not a MongoDB ID.')
    })
  })
})
