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
  it('should create a new todo item', async () => {
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
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal('The title is empty or the title is not a string.')
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
        .to.equal('The title is empty or the title is not a string.')
    }
  })

  describe('PUT /todos/:id', () => {
    it('should update a todo item if it exists, if id is valid mongo id and if title is valid non-empty string', async () => {
      const todoitem = await testAppContext.todoItemRepository.save(
        new TodoItem({ title: 'Update TODO' })
      )

      const res = await chai
        .request(expressApp)
        .put(`/todos/${todoitem._id}`)
        .send({
          title: 'Item Updated',
        })

      expect(res).to.have.status(200)
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('title')
    })

    it('should return a validation error if empty title is specified', async () => {
      const todoitem = await testAppContext.todoItemRepository.save(
        new TodoItem({ title: 'TODO_TO_BE_UPDATED' })
      )

      const res = await chai
        .request(expressApp)
        .put(`/todos/${todoitem._id}`)
        .send({
          title: '',
        })

      expect(res).to.have.status(400)
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal('The title is empty or the title is not a string.')
    })

    it('should return a validation error if id is invalid mongo id', async () => {
      const res = await chai.request(expressApp).put('/todos/hhd8882nn').send({
        title: 'Update TODO',
      })

      expect(res).to.have.status(400)
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal('The specified ID is not a MongoDB ID.')
    })

    it('should return a 404 if todo item does not exists', async () => {
      const res = await chai
        .request(expressApp)
        .put('/todos/605bb3efc93d78b7f4335c2c')
        .send({
          title: 'TODO_UPDATED',
        })

      expect(res).to.have.status(404)
    })
  })
})
