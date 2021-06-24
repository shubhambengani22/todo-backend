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
import mongoose from 'mongoose'
import { todoItems } from '../../../src/storage/mongoose'

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
    const ifDuplicateResponse = await testAppContext.todoItemRepository.findOne(
      {
        title: 'First Title',
      }
    )
    const res = await chai.request(expressApp).post('/todos').send({
      title: 'First Title',
    })
    if (lodash.isEmpty(ifDuplicateResponse)) {
      expect(res).to.have.status(201)
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('title')
    } else {
      expect(res).to.have.status(400)
      expect(res.body)
        .to.have.nested.property('failures[0].message')
        .to.equal(
          'The title name is already taken. Please provide a different one.'
        )
    }
  })

  it('should return a validation error if empty title is specified', async () => {
    const res = await chai.request(expressApp).post('/todos').send({
      title: '',
    })
    expect(res).to.have.status(400)
    expect(res.body)
      .to.have.nested.property('failures[0].message')
      .to.equal('The title is empty or the title is not a string.')
  })
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
  const ifResponseDuplicate = await chai
    .request(expressApp)
    .post('/todos')
    .send({
      title: 'First Title',
    })

  const res = await chai.request(expressApp).post('/todos').send({
    title: 'First Title',
  })

  expect(res).to.have.status(400)
  expect(res.body)
    .to.have.nested.property('failures[0].message')
    .to.equal(
      'The title name is already taken. Please provide a different one.'
    )
})

describe('GET /todos', () => {
  it('we should have got all the todo items', async () => {
    const res = await chai.request(expressApp).get('/todos')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('array')
  })
  it('we should check if the items are returned in the same order in which they were created', async () => {
    await chai.request(expressApp).post('/todos').send({
      title: 'Second Title',
    })

    await chai.request(expressApp).post('/todos').send({
      title: 'Third Title',
    })

    const getTodoItemFromMongoose = (data: object) => {
      return new TodoItem(data).serialize()
    }

    const convertObjectToString = (data: any) => {
      data.id = data.id.toString()
      return data
    }

    const res = await chai.request(expressApp).get('/todos')
    expect(res).to.have.status(200)
    expect(res.body).to.be.an('array')

    todoItems.find({}, function (err, data) {
      expect(res.body).to.deep.equal(
        data.map(getTodoItemFromMongoose).map(convertObjectToString)
      )
    })
  })

  it('we should check if the array returned is empty when there are no todo items', async () => {
    await testAppContext.todoItemRepository.getAll()

    await testAppContext.todoItemRepository.deleteMany({})

    const res = await chai.request(expressApp).get('/todos')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('array')
    expect(res.body).to.deep.equal([])
  })
})
