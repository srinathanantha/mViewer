/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd. Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in
 * writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
package com.imaginea.mongodb.controllers;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;

import com.imaginea.mongodb.controllers.BaseController.ResponseCallback;
import com.imaginea.mongodb.controllers.BaseController.ResponseTemplate;
import com.imaginea.mongodb.domain.DatabaseUserQueryData;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.imaginea.mongodb.services.DatabaseService;
import com.imaginea.mongodb.services.GridFSService;
import com.imaginea.mongodb.services.impl.DatabaseServiceImpl;
import com.imaginea.mongodb.services.impl.GridFSServiceImpl;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * Defines resources for performing create/drop operations on databases present in Mongo we are
 * currently connected to. Also provide resources to get list of all databases present in mongo and
 * also statistics of a particular database.
 * <p/>
 * These resources map different HTTP requests made by the client to access these resources to
 * services file which performs these operations. The resources also form a JSON response using the
 * output received from the services files. GET and POST request resources for databases are defined
 * here. For PUT and DELETE functionality , a POST request with an action parameter taking values
 * PUT and DELETE is made.
 *
 * @author Rachit Mittal
 * @since 2 July 2011
 */
@Path("/db")
@Api(value = "/db", description = "Mongo Database Operations")
public class DatabaseController extends BaseController {
  private final static Logger logger = Logger.getLogger(DatabaseController.class);

  /**
   * Maps GET Request to get list of databases present in mongo db to a service function that
   * returns the list. Also forms the JSON response for this request and sent it to client. In case
   * of any exception from the service files an error object if formed.
   *
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return String of JSON Format with list of all Databases.
   */
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @ApiOperation(value = "Fetch mongo databases list", notes = "To fetch all the mongo databases list", position = 1)
  public String getDbList(@QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            // TODO Using Service Provider
            DatabaseService databaseService = new DatabaseServiceImpl(connectionId);
            return databaseService.getDbList();
          }
        });
    return response;
  }
  
  
  /**
   * Maps POST Request to perform create/drop operations on databases present in mongo db to a
   * service function that returns the list. Also forms the JSON response for this request and sent
   * it to client. In case of any exception from the service files an error object if formed.
   *
   * @param dbName Name of Database for which to perform create/drop operation depending on action
   *        parameter
   * @param action Query parameter with value PUT for identifying a create database request and
   *        value DELETE for dropping a database.
   * @param request Get the HTTP request context to extract session parameters
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @return : String with status of operation performed.
   */
  @POST
  @Path("/{dbName}")
  @ApiOperation(value = "craete mongo database", notes = "Create mongo database with specified name and create temp collection in order to show the database")
  @Produces(MediaType.APPLICATION_JSON)
  public String postDbRequest(@PathParam("dbName") final String dbName,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            DatabaseService databaseService = new DatabaseServiceImpl(connectionId);
            String status = null;
            status = databaseService.createDb(dbName);
            return status;
          }
        });
    return response;
  }

  @DELETE
  @Path("/{dbName}")
  @Produces(MediaType.APPLICATION_JSON)
  @ApiOperation(value = "Drop mongo database", notes = "Drop the specified Mongo Database")
  public String deleteDbRequest(@PathParam("dbName") final String dbName,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            DatabaseService databaseService = new DatabaseServiceImpl(connectionId);
            String status = null;
            status = databaseService.dropDb(dbName);
            return status;
          }
        });
    return response;
  }

  /**
   * executes the given query against a database and returns a json response.
   *
   * @param dbName
   * @param query
   * @param connectionId
   * @param fields
   * @param limit
   * @param skip
   * @param sortBy
   * @param request
   * @return
   */
  @GET
  @Path("/{dbName}")
  @Produces(MediaType.APPLICATION_JSON)
  @ApiOperation(value = "Execute Database Query", notes = "Execute Database query by query params")
  public String executeQuery(@PathParam("dbName") final String dbName,
      @QueryParam("query") final String query,
      @QueryParam("connectionId") final String connectionId,
      @QueryParam("fields") final String fields, @QueryParam("limit") final String limit,
      @QueryParam("skip") final String skip, @QueryParam("sortBy") final String sortBy,
      @Context final HttpServletRequest request) {
    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          @Override
          public Object execute() throws Exception {
            // Get query
            int startIndex = query.indexOf("("), endIndex = query.lastIndexOf(")");
            if (startIndex == -1 || endIndex == -1) {
              throw new InvalidMongoCommandException(ErrorCodes.INVALID_QUERY, "Invalid query");
            }
            String cmdStr = query.substring(0, startIndex);

            int lastIndexOfDot = cmdStr.lastIndexOf(".");
            if (lastIndexOfDot + 1 == cmdStr.length()) {
              // In this case the cmsStr = db.collectionName.
              throw new InvalidMongoCommandException(ErrorCodes.COMMAND_EMPTY, "Command is empty");
            }
            String command = cmdStr.substring(lastIndexOfDot + 1, cmdStr.length());
            DatabaseService databaseService = new DatabaseServiceImpl(connectionId);
            int docsLimit = Integer.parseInt(limit);
            int docsSkip = Integer.parseInt(skip);
            String jsonStr = query.substring(startIndex + 1, endIndex);
            return databaseService.executeQuery(dbName, command, jsonStr, fields, sortBy, docsLimit,
                docsSkip);
          }
        });

    return response;
  }

  @POST
  @Path("/{dbName}/query")
  @Produces(MediaType.APPLICATION_JSON)
  @Consumes(MediaType.APPLICATION_JSON)
  @ApiOperation(value = "Execute Database Query", notes = "Execute Database query by DatabaseUserQueryData json object")
  public String executeQuery(@PathParam("dbName") final String dbName,
      @QueryParam("connectionId") final String connectionId, final DatabaseUserQueryData queryData,
      @Context final HttpServletRequest request) {
    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          @Override
          public Object execute() throws Exception {
            // Get query
            int startIndex = queryData.getQuery().indexOf("("),
                endIndex = queryData.getQuery().lastIndexOf(")");
            if (startIndex == -1 || endIndex == -1) {
              throw new InvalidMongoCommandException(ErrorCodes.INVALID_QUERY, "Invalid query");
            }
            String cmdStr = queryData.getQuery().substring(0, startIndex);

            int lastIndexOfDot = cmdStr.lastIndexOf(".");
            if (lastIndexOfDot + 1 == cmdStr.length()) {
              // In this case the cmsStr = db.collectionName.
              throw new InvalidMongoCommandException(ErrorCodes.COMMAND_EMPTY, "Command is empty");
            }
            String command = cmdStr.substring(lastIndexOfDot + 1, cmdStr.length());
            DatabaseService databaseService = new DatabaseServiceImpl(connectionId);
            int docsLimit = Integer.parseInt(queryData.getLimit());
            int docsSkip = Integer.parseInt(queryData.getSkip());
            String jsonStr = queryData.getQuery().substring(startIndex + 1, endIndex);
            return databaseService.executeQuery(dbName, command, jsonStr, queryData.getFields(),
                queryData.getSortBy(), docsLimit, docsSkip);
          }
        });
    return response;
  }
}
