require('module-alias/register')

import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
import chaiHttp from 'chai-http'
import { Application } from 'express'
import { respositoryContext, testAppContext } from '../../mocks/app-context'

import { App } from '../../../src/server'
import { TodoItem } from '../../../src/models'

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

    expect(res).to.have.status(400)
  })

  it('should return a validation error if title is not string', async () => {
    const res = await chai
      .request(expressApp)
      .post('/todos')
      .send({
        title: { field: 'title' },
      })

    expect(res).to.have.status(400)
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
    expect(res).to.have.status(400)
  })
})
