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

const hasProrityProperty = (requestQuery) => {
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
    case hasProrityProperty(request.query):
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
                    todo LIKE '%${search_q}';`;
  }
  data = await db.all(getTodoQuery);
  response.send(
    data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});
