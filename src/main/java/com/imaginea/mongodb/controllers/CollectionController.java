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
import javax.ws.rs.DELETE;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;

import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.impl.CollectionServiceImpl;

import io.swagger.annotations.Api;

/**
 * Defines resources for performing create/drop operations on collections present inside databases
 * in Mongo we are currently connected to. Also provide resources to get list of all collections in
 * a database present in mongo and also statistics of a particular collection.
 * <p/>
 * These resources map different HTTP requests made by the client to access these resources to
 * services file which performs these operations. The resources also form a JSON response using the
 * output received from the services files. GET and POST request resources for collections are
 * defined here. For PUT and DELETE functionality , a POST request with an action parameter taking
 * values PUT and DELETE is made.
 *
 * @author Rachit Mittal
 * @since 4 July 2011
 */
@Path("/{dbName}/collection")
@Api(value = "/{dbName}/collection", description = "Mongo Database Collection Operations")
public class CollectionController extends BaseController {
  private final static Logger logger = Logger.getLogger(CollectionController.class);

  /**
   * Maps GET Request to get list of collections inside databases present in mongo db to a service
   * function that returns the list. Also forms the JSON response for this request and sent it to
   * client. In case of any exception from the service files an error object if formed.
   *
   * @param dbName Name of database
   * @param selectedCollection Name of selected Collection
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return String of JSON Format with list of all collections.
   */
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/{collectionName}/isCapped")
  public String isCappedCollection(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String selectedCollection,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {

            CollectionService collectionService = new CollectionServiceImpl(connectionId);

            return collectionService.isCappedCollection(dbName, selectedCollection);
          }
        });
    return response;
  }

  /**
   * Maps GET Request to get list of collections inside databases present in mongo db to a service
   * function that returns the list. Also forms the JSON response for this request and sent it to
   * client. In case of any exception from the service files an error object if formed.
   *
   * @param dbName Name of database
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return String of JSON Format with list of all collections.
   */
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public String getCollList(@PathParam("dbName") final String dbName,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            CollectionService collectionService = new CollectionServiceImpl(connectionId);
            return collectionService.getCollList(dbName);
          }
        });
    return response;
  }

  /**
   * Maps POST Request to perform create/drop on collections inside databases present in mongo db to
   * a service function that returns the list. Also forms the JSON response for this request and
   * sent it to client. In case of any exception from the service files an error object if formed.
   *
   * @param dbName Name of Database
   * @param isCapped Specify if the collection is capped
   * @param capSize Specify the capSize of collection
   * @param maxDocs specify maximum no of documents in the collection
   * @param selectedCollection Name of collection for which to perform create/drop operation
   *        depending on action parameter
   * @param action Query Parameter with value PUT for identifying a create database request and
   *        value DELETE for dropping a database.
   * @param request Get the HTTP request context to extract session parameters
   * @param connectionId MongoDB Configuration provided by user to connect to.
   * @return String with status of operation performed.
   */
  @POST
  @Path("/{collectionName}")
  @Produces(MediaType.APPLICATION_JSON)
  public String postCollRequest(@PathParam("dbName") final String dbName,
      @FormParam("newCollName") final String newCollName,
      @FormParam("isCapped") final String isCapped, @FormParam("capSize") final long capSize,
      @FormParam("maxDocs") final int maxDocs, @FormParam("autoIndexId") final String autoIndexId,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            CollectionService collectionService = new CollectionServiceImpl(connectionId);
            String status = null;
            status = collectionService.insertCollection(dbName, newCollName,
                (isCapped != null && isCapped.equals("on")), capSize, maxDocs,
                (autoIndexId != null && autoIndexId.equals("on")));
            return status;
          }
        });
    return response;
  }

  @PUT
  @Path("/{collectionName}")
  @Produces(MediaType.APPLICATION_JSON)
  public String updateCollRequest(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String selectedCollection,
      @FormParam("newCollName") final String newCollName,
      @FormParam("isCapped") final String isCapped, @FormParam("capSize") final long capSize,
      @FormParam("maxDocs") final int maxDocs, @FormParam("autoIndexId") final String autoIndexId,
      @QueryParam("connectionId") final String connectionId,
      @QueryParam("isDbAdmin") final boolean isDbAdmin,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            CollectionService collectionService = new CollectionServiceImpl(connectionId);
            String status = null;

            status = collectionService.updateCollection(dbName, selectedCollection, newCollName,
                (isCapped != null && isCapped.equals("on")), capSize, maxDocs, isDbAdmin,
                (autoIndexId != null && autoIndexId.equals("on")));

            return status;
          }
        });
    return response;
  }

  @DELETE
  @Path("/{collectionName}")
  @Produces(MediaType.APPLICATION_JSON)
  public String deleteCollRequest(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String selectedCollection,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {
    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            CollectionService collectionService = new CollectionServiceImpl(connectionId);

            String status = null;
            status = collectionService.deleteCollection(dbName, selectedCollection);
            return status;
          }
        });
    return response;
  }
}
