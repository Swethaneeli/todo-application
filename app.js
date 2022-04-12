const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Database Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}'
                    AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(
    data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            * 
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todo));
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO 
        todo (id, todo, priority, status)
    VALUES ( ${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const getPreviousTodo = `
    SELECT 
        * 
    FROM 
        todo
    WHERE 
        id = ${todoId};`;
  const previousTodo = await db.get(getPreviousTodo);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updatePreviousTodo = `
    UPDATE 
        todo
    SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE 
        id = ${todoId};`;
  await db.run(updatePreviousTodo);
  response.send(`${updateColumn} Updated`);
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE
        FROM todo
        WHERE 
            id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
