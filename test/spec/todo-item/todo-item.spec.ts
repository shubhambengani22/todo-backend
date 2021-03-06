require("module-alias/register");

import chai from "chai";
import spies from "chai-spies";
chai.use(spies);
import chaiHttp from "chai-http";
import { Application } from "express";
import { respositoryContext, testAppContext } from "../../mocks/app-context";

import { App } from "../../../src/server";
import { TodoItem } from "../../../src/models";
import { todoItems } from "../../../src/storage/mongoose";
import lodash from "lodash";

chai.use(chaiHttp);
const expect = chai.expect;
let expressApp: Application;

before(async () => {
  await respositoryContext.store.connect();
  const app = new App(testAppContext);
  app.initializeMiddlewares();
  app.initializeControllers();
  app.initializeErrorHandling();
  expressApp = app.expressApp;
});

describe("POST /todos", () => {
  it("should create a new todo item", async () => {
    const res = await chai.request(expressApp).post("/todos").send({
      title: "First Title",
    });

    expect(res).to.have.status(201);
    expect(res.body).to.have.property("id");
    expect(res.body).to.have.property("title");
  });

  it("should return a validation error if empty title is specified", async () => {
    const res = await chai.request(expressApp).post("/todos").send({
      title: "",
    });

    const checkIfRecordInserted =
      await testAppContext.todoItemRepository.findOne({
        title: "",
      });

    if (lodash.isEmpty(checkIfRecordInserted)) {
      expect(res).to.have.status(400);
      expect(res.body)
        .to.have.nested.property("failures[0].message")
        .to.equal("The title is empty or the title is not a string.");
    }
  });

  it("should return a validation error if title is not string", async () => {
    const res = await chai
      .request(expressApp)
      .post("/todos")
      .send({
        title: { field: "title" },
      });

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.nested.property("failures[0].message")
      .to.equal("The title is empty or the title is not a string.");
  });

  it("should return a validation error if title is already present in the Database", async () => {
    await testAppContext.todoItemRepository.save(
      new TodoItem({
        title: "First Title",
      })
    );

    const res = await chai.request(expressApp).post("/todos").send({
      title: "First Title",
    });

    const checkIfRecordInserted =
      await testAppContext.todoItemRepository.findOne({
        title: "First Title",
      });

    if (lodash.isEmpty(checkIfRecordInserted)) {
      expect(res).to.have.status(400);
      expect(res.body)
        .to.have.nested.property("failures[0].message")
        .to.equal("The title is empty or the title is not a string.");
    }
  });
});

describe("GET /todos/:id", () => {
  it("should fetch a todo item if it exists and if id is valid mongo id", async () => {
    const todoItem = await testAppContext.todoItemRepository.save(
      new TodoItem({ title: "Fetching an item" })
    );

    const res = await chai.request(expressApp).get(`/todos/${todoItem._id}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("id");
    expect(res.body).to.have.property("title");
  });

  it("Should return a validation error if id is invalid mongo id", async () => {
    const res = await chai.request(expressApp).get("/todos/jlkm129e2nk");

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.nested.property("failures[0].message")
      .to.equal(
        "The specified todo ID is not a valid one. Please provide a valid one."
      );
  });

  it("should return a 404 if todo item does not exists", async () => {
    const res = await chai
      .request(expressApp)
      .get("/todos/605bb3efc93d78b7f4388c2c");

    expect(res).to.have.status(404);
  });

  it("the id mentioned in the request should be equal to the id of the todo in the database", async () => {
    const todoItem = await testAppContext.todoItemRepository.save(
      new TodoItem({ title: "Check ID" })
    );
    const res = await chai.request(expressApp).get(`/todos/${todoItem._id}`);

    expect(res).to.have.status(200);
    expect(res.body.id).to.deep.equal(todoItem._id.toString());
  });
});

describe("DELETE /todos/:id", () => {
  it("should delete a todo item if it exists and if ID it is valid.", async () => {
    const todoItem = await testAppContext.todoItemRepository.save(
      new TodoItem({ title: "Title to be deleted" })
    );
    const res = await chai.request(expressApp).delete(`/todos/${todoItem._id}`);

    expect(res).to.have.status(204);
  });

  it("should return a validation error if todo item does not exists and if id is a valid.", async () => {
    const res = await chai
      .request(expressApp)
      .delete("/todos/60d2fe74bd99a211407165e9");

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.nested.property("failures[0].message")
      .to.equal(
        "The item with the specified ID could not be found. Please enter a valid ID."
      );
  });

  it("should return a validation error if id is not a valid ID.", async () => {
    const res = await chai.request(expressApp).delete("/todos/2114071");

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.nested.property("failures[0].message")
      .to.equal(
        "The specified todo ID is not a valid one. Please provide a valid one."
      );
  });
});

describe("PUT /todos/:id", () => {
  it("should update a todo item if it exists, if id is valid mongo id and if title is valid non-empty string", async () => {
    const todoItem = await testAppContext.todoItemRepository.save(
      new TodoItem({ title: "Update TODO" })
    );

    const updatedItem = "Item Updated";

    const res = await chai
      .request(expressApp)
      .put(`/todos/${todoItem._id}`)
      .send({
        title: updatedItem,
      });

    todoItems.find({ title: updatedItem }, function (err, data) {
      expect(new TodoItem(data[0]).serialize().title).to.deep.equal(
        updatedItem
      );
    });

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("id");
    expect(res.body).to.have.property("title");
    expect(res.body.id).to.deep.equal(todoItem._id.toString());
    expect(res.body.title).to.deep.equal(updatedItem);
  });

  it("should return a validation error if empty title is specified", async () => {
    const todoitem = await testAppContext.todoItemRepository.save(
      new TodoItem({ title: "TODO_TO_BE_UPDATED" })
    );

    const res = await chai
      .request(expressApp)
      .put(`/todos/${todoitem._id}`)
      .send({
        title: "",
      });

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.nested.property("failures[0].message")
      .to.equal("The title is empty or the title is not a string.");
  });

  it("should return a validation error if id is invalid mongo id", async () => {
    const res = await chai.request(expressApp).put("/todos/hhd8882nn").send({
      title: "Update TODO",
    });

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.nested.property("failures[0].message")
      .to.equal(
        "The specified todo ID is not a valid one. Please provide a valid one."
      );
  });

  it("should return a 404 if todo item does not exists", async () => {
    const res = await chai
      .request(expressApp)
      .put("/todos/605bb3efc93d78b7f4335c2c")
      .send({
        title: "TODO_UPDATED",
      });

    expect(res).to.have.status(404);
  });
});

describe("GET /todos", () => {
  it("we should have got all the todo items", async () => {
    const res = await chai.request(expressApp).get("/todos");

    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
  });
  it("we should check if the items are returned in the same order in which they were created", async () => {
    await chai.request(expressApp).post("/todos").send({
      title: "Second Title",
    });

    await chai.request(expressApp).post("/todos").send({
      title: "Third Title",
    });

    const getTodoItemFromMongoose = (data: object) => {
      return new TodoItem(data).serialize();
    };

    const convertObjectToString = (data: any) => {
      data.id = data.id.toString();
      return data;
    };

    const res = await chai.request(expressApp).get("/todos");
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");

    todoItems.find({}, function (err, data) {
      expect(res.body).to.deep.equal(
        data.map(getTodoItemFromMongoose).map(convertObjectToString)
      );
    });
  });

  it("we should check if the array returned is empty when there are no todo items", async () => {
    await testAppContext.todoItemRepository.getAll();

    await testAppContext.todoItemRepository.deleteMany({});

    const res = await chai.request(expressApp).get("/todos");

    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body).to.deep.equal([]);
  });
});
