/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd.
 * Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.imaginea.mongodb.controllers;

import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidHTTPRequestException;
import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.impl.AuthServiceImpl;
import com.imaginea.mongodb.services.impl.CollectionServiceImpl;
import com.mongodb.Mongo;
import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import java.util.Set;

/**
 * Defines resources for performing create/drop operations on collections
 * present inside databases in Mongo we are currently connected to. Also provide
 * resources to get list of all collections in a database present in mongo and
 * also statistics of a particular collection.
 * <p/>
 * These resources map different HTTP requests made by the client to access these
 * resources to services file which performs these operations. The resources
 * also form a JSON response using the output received from the services files.
 * GET and POST request resources for collections are defined here. For PUT and
 * DELETE functionality , a POST request with an action parameter taking values
 * PUT and DELETE is made.
 *
 * @author Rachit Mittal
 * @since 4 July 2011
 */
@Path("/{dbName}/collection")
public class CollectionController extends BaseController {
    private final static Logger logger = Logger.getLogger(CollectionController.class);

    /**
     * Maps GET Request to get list of collections inside databases present in
     * mongo db to a service function that returns the list. Also forms the JSON
     * response for this request and sent it to client. In case of any exception
     * from the service files an error object if formed.
     *
     * @param dbName             Name of database
     * @param selectedCollection Name of selected Collection
     * @param connectionId       Mongo Db Configuration provided by user to connect to.
     * @param request            Get the HTTP request context to extract session parameters
     * @return String of JSON Format with list of all collections.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{collectionName}/isCapped")
    public String isCappedCollection(@PathParam("dbName") final String dbName, @PathParam("collectionName") final String selectedCollection,
                                     @QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                Mongo mongoInstance = AuthServiceImpl.getInstance().getMongoInstance(connectionId);
                return mongoInstance.getDB(dbName).getCollection(selectedCollection).isCapped();
            }
        });
        return response;
    }

    /**
     * Maps GET Request to get list of collections inside databases present in
     * mongo db to a service function that returns the list. Also forms the JSON
     * response for this request and sent it to client. In case of any exception
     * from the service files an error object if formed.
     *
     * @param dbName       Name of database
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param request      Get the HTTP request context to extract session parameters
     * @return String of JSON Format with list of all collections.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String getCollList(@PathParam("dbName") final String dbName, @QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                CollectionService collectionService = new CollectionServiceImpl(connectionId);
                return collectionService.getCollList(dbName);
            }
        });
        return response;
    }

    /**
     * Maps POST Request to perform create/drop on collections inside databases
     * present in mongo db to a service function that returns the list. Also
     * forms the JSON response for this request and sent it to client. In case
     * of any exception from the service files an error object if formed.
     *
     * @param dbName             Name of Database
     * @param isCapped           Specify if the collection is capped
     * @param capSize            Specify the capSize of collection
     * @param maxDocs            specify maximum no of documents in the collection
     * @param selectedCollection Name of collection for which to perform create/drop operation
     *                           depending on action parameter
     * @param action             Query Parameter with value PUT for identifying a create
     *                           database request and value DELETE for dropping a database.
     * @param request            Get the HTTP request context to extract session parameters
     * @param connectionId       MongoDB Configuration provided by user to connect to.
     * @return String with status of operation performed.
     */
    @POST
    @Path("/{collectionName}")
    @Produces(MediaType.APPLICATION_JSON)
    public String postCollRequest(@PathParam("dbName") final String dbName, @PathParam("collectionName") final String selectedCollection,
                                  @FormParam("newCollName") final String newCollName, @FormParam("updateColl") final String updateColl,
                                  @FormParam("isCapped") final String isCapped, @FormParam("capSize") final int capSize,
                                  @FormParam("maxDocs") final int maxDocs, @FormParam("autoIndexId") final String autoIndexId,
                                  @QueryParam("connectionId") final String connectionId, @QueryParam("action") final String action,
                                  @Context final HttpServletRequest request) {

        if (action == null) {
            InvalidHTTPRequestException e = new InvalidHTTPRequestException(ErrorCodes.ACTION_PARAMETER_ABSENT, "ACTION_PARAMETER_ABSENT");
            return formErrorResponse(logger, e);
        }

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                CollectionService collectionService = new CollectionServiceImpl(connectionId);
                String status = null;
                RequestMethod method = null;
                for (RequestMethod m : RequestMethod.values()) {
                    if ((m.toString()).equals(action)) {
                        method = m;
                        break;
                    }
                }
                switch (method) {
                    case PUT: {
                        if (updateColl.equals("false")) {
                            status = collectionService.insertCollection(dbName, newCollName, (isCapped != null && isCapped.equals("on")), capSize, maxDocs, (autoIndexId != null && autoIndexId.equals("on")));
                        } else {
                            status = collectionService.updateCollection(dbName, selectedCollection, newCollName, (isCapped != null && isCapped.equals("on")), capSize, maxDocs, (autoIndexId != null && autoIndexId.equals("on")));
                        }
                        break;
                    }
                    case DELETE: {
                        status = collectionService.deleteCollection(dbName, selectedCollection);
                        break;
                    }
                    default: {
                        status = "Action parameter value is wrong";
                        break;
                    }
                }
                return status;
            }
        });
        return response;
    }
}
