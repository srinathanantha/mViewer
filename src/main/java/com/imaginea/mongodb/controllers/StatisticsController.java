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

import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.DatabaseService;
import com.imaginea.mongodb.services.impl.AuthServiceImpl;
import com.imaginea.mongodb.services.impl.CollectionServiceImpl;
import com.imaginea.mongodb.services.impl.DatabaseServiceImpl;
import com.mongodb.CommandResult;
import com.mongodb.Mongo;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

/**
 * Defines resources for getting statistics of mongo Server and statistics of a
 * particualr database present in mongo and statistics of a collection present
 * inside a database.
 * <p/>
 * The resources also form a error JSON response when any exception occur while
 * performing the operation.
 *
 * @author Rachit Mittal
 * @since 7 July 2011
 */
@Path("/stats")
public class StatisticsController extends BaseController {
    private final static Logger logger = Logger.getLogger(StatisticsController.class);

    private AuthService authService = AuthServiceImpl.getInstance();

    /**
     * Default Constructor
     */
    public StatisticsController() {
    }

    /**
     * Get Statistics of Mongo Server.
     *
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param request      Get the HTTP request context to extract session parameters
     * @return String of JSON Format with server Stats.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String getServerStats(@QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) throws JSONException {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                Mongo mongoInstance = authService.getMongoInstance(connectionId);
                // Get Server Stats
                return mongoInstance.getDB("admin").command("serverStatus");
            }
        });
        return response;
    }

    /**
     * GET Statistics of a particular database.
     *
     * @param dbName       : Name of Database for which to get DbStats.
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @return : String of JSON Format with Db Stats.
     */
    @GET
    @Path("/db/{dbName}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getDbStats(@PathParam("dbName") final String dbName, @QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) throws JSONException {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                DatabaseService databaseService = new DatabaseServiceImpl(connectionId);
                return databaseService.getDbStats(dbName);
            }
        });
        return response;
    }

    /**
     * GET Statistics of Collections in a Database present in mongo.
     *
     * @param dbName         : Name of Database
     * @param collectionName : Name of Collection
     * @param request        : Get the HTTP request context to extract session parameters
     * @param connectionId   Mongo Db Configuration provided by user to connect to.
     * @return : A String of JSON Format with key <result> and value Collection
     *         Stats.
     */
    @GET
    @Path("/db/{dbName}/collection/{collectionName}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getCollStats(@PathParam("dbName") final String dbName, @PathParam("collectionName") final String collectionName, @QueryParam("connectionId") final String connectionId,
                               @Context final HttpServletRequest request) throws JSONException {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {

                CollectionService collectionService = new CollectionServiceImpl(connectionId);
                // Get the result;
                return collectionService.getCollStats(dbName, collectionName);
            }
        });
        return response;
    }
}
