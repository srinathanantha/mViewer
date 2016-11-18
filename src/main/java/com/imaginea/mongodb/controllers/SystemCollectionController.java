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
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;
import org.bson.Document;

/**
 * Defines resources for performing create/delete/update operations on users & Indexes present
 * inside collections in databases in Mongo we are currently connected to. Also provide resources to
 * get list of all Users & Indexes present inside a collection in a database in mongo.
 * <p/>
 * These resources map different HTTP requests made by the client to access these resources to
 * services file which performs these operations. The resources also form a JSON response using the
 * output received from the services files. GET and POST request resources for documents are defined
 * here.
 *
 * @author Sanjay Chaluvadi
 * @since 9 september 2012
 */

import com.imaginea.mongodb.services.SystemCollectionService;
import com.imaginea.mongodb.services.impl.SystemCollectionServiceImpl;

import io.swagger.annotations.Api;


@Path("/{dbName}/usersIndexes")
@Api(value="/{dbName}/usersIndexes" , description="To add or drop users and indexes to mongo database")
public class SystemCollectionController extends BaseController {
  private final static Logger logger = Logger.getLogger(SystemCollectionController.class);

  /**
   * Maps POST request for adding the user for a particular database present in the mongo db.
   * <p/>
   * Also forms the JSON response for this request and sent it to client. In case of any exception
   * from the service files an error object if formed.
   *
   * @param dbName Name of the database
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param username username of the user being added to the database
   * @param password password of the user being added to the database
   * @param roles The optional parameter for creating the user
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("addUser")
  public String addUserRequest(@PathParam("dbName") final String dbName,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @FormParam("user_name") final String username,
      @FormParam("password") final String password,
      @FormParam("roles") final String roles,@FormParam("dbSource") final String dbSource,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {

            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);

            return systemCollectionService.addUser(dbName, username, password, roles, dbSource);
          }
        });
    return response;
  }

  /**
     * Maps POST request for modifying the user for a particular database present in the mongo db.
     * <p/>
     * Also forms the JSON response for this request and sent it to client. In case of any exception
     * from the service files an error object if formed.
     *
     * @param dbName Name of the database
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param username username of the user being modifies to the database
     * @param password password of the user being modified to the database
     * @param revokedRoles The parameter for modifying the user roles
     * @param grantNewRoles The parameter for modifying the user roles
     * @param request Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("modifyUser")
    public String modifyUserRequest(@PathParam("dbName") final String dbName,
        @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
        @FormParam("user_name") final String username,
        @FormParam("password") final String password,
        @FormParam("removedRoles") final String revokedRoles,@FormParam("newRoles") final String grantNewRoles,
                                    @FormParam("dbSource") final String dbSource,
        @Context final HttpServletRequest request) {

      String response =
          new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {

              SystemCollectionService systemCollectionService =
                  new SystemCollectionServiceImpl(connectionId);

              return systemCollectionService.modifyUser(dbName, username, password, revokedRoles , grantNewRoles ,dbSource);
            }
          });
      return response;
    }


  /**
   * Maps POST request for removing the user from a particular database present in the mongo db.
   *
   * @param dbName Name of the database
   * @param username username of the user being deleted from the database
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("removeUser")
  public String removeUserRequest(@PathParam("dbName") final String dbName,
      @FormParam("username") final String username,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.removeUser(dbName, username);
          }
        });

    return response;
  }
  
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("users")
  public String getUsers(@PathParam("dbName") final String dbName,@QueryParam("connectionId") final String connectionId,
                         @Context final HttpServletRequest request){
    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.getUsers(dbName);
          }
        });

    return response;
  }

  /**
   * Maps POST request for removing all the users from a particular database present in the mongo
   * db.
   *
   * @param dbName Name of the database
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("removeAllUsers")
  public String removeAllUserRequest(@PathParam("dbName") final String dbName,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.removeAllUsers(dbName);
          }
        });

    return response;
  }

  /**
   * Maps to the POST request for adding an index to a collection in a database present in mongo db
   *
   * @param dbName Name of the database
   * @param index_keys keys of the index to be added
   * @param collectionName Name of the collection for which the index is added
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("addIndex")
  public String addIndex(@PathParam("dbName") final String dbName,
      @FormParam("index_keys") final String index_keys,
      @FormParam("index_colname") final String collectionName,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {


    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            // Convert the json keys into a DB object
            Document keys = Document.parse(index_keys);
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.addIndex(dbName, collectionName, keys);
          }

        });

    return response;
  }

  /**
   * Maps to the POST request for updating an index to a collection in a database present in mongo db
   *
   * @param dbName Name of the database
   * @param index_keys keys of the index to be updated
   * @param collectionName Name of the collection for which the index is updated
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("updateIndex")
  public String updateIndex(@PathParam("dbName") final String dbName,
      @FormParam("index_keys") final String index_keys,
      @FormParam("index_colname") final String collectionName,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {


    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            // Convert the json keys into a DB object
            Document keys = Document.parse(index_keys);
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.updateIndex(dbName, collectionName, keys);
          }

        });

    return response;
  }


  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("getIndex")
  public String getIndex(@PathParam("dbName") final String dbName,
      @QueryParam("index_colname") final String collectionName,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {


    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            // Convert the keys into json object
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.getIndex(dbName, collectionName);
          }

        });

    return response;
  }

  /**
   * Maps to the POST request for dropping all the indexes in all collection from a give database.
   *
   * @param dbName Name of the database
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("dropAllIndexes")
  public String dropIndexes(@PathParam("dbName") final String dbName,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {
    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          @Override
          public Object execute() throws Exception {
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            return systemCollectionService.removeIndexes(dbName);
          }
        });
    return response;

  }

  /**
   * Maps to the POST request of dropping an index from a collection in the given database
   *
   * @param dbName Name of the database
   * @param nameSpace namespace of the index to be deleted. Colleciton name is extracted from the
   *        nameSpace
   * @param indexName Name of the index to be deleted
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("dropIndex")
  public String dropIndex(@PathParam("dbName") final String dbName,
      @FormParam("nameSpace") final String nameSpace,
      @FormParam("indexName") final String indexName,
      @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {
    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          @Override
          public Object execute() throws Exception {
            SystemCollectionService systemCollectionService =
                new SystemCollectionServiceImpl(connectionId);
            // The collection name is obtained by removing the DB name from the namespace.
            String collectionName = nameSpace.replace(dbName + ".", "");
            return systemCollectionService.removeIndex(dbName, collectionName, indexName);
          }
        });
    return response;

  }

}
