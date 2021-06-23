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

  describe('GET /todos', () => {
    it('we should have got all the todo items', async () => {
      const res = await chai.request(expressApp).get('/todos')

      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array')
    })
  })
})
