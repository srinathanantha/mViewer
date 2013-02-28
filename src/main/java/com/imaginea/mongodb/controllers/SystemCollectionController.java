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

/**
 * Defines resources for performing create/delete/update operations on users & Indexes
 * present inside collections in databases in Mongo we are currently connected
 * to. Also provide resources to get list of all Users & Indexes present inside a
 * collection in a database in mongo.
 * <p/>
 * These resources map different HTTP requests made by the client to access these
 * resources to services file which performs these operations. The resources
 * also form a JSON response using the output received from the services files.
 * GET and POST request resources for documents are defined here.
 *
 * @author Sanjay Chaluvadi
 * @since 9 september 2012
 */

import com.imaginea.mongodb.services.SystemCollectionService;
import com.imaginea.mongodb.services.impl.SystemCollectionServiceImpl;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.DBObject;
import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;


@Path("/{dbName}/usersIndexes")
public class SystemCollectionController extends BaseController {
    private final static Logger logger = Logger.getLogger(SystemCollectionController.class);

    /**
     * Maps POST request for adding the user for a particular database present
     * in the mongo db.
     * <p/>
     * Also forms the JSON response for this request and sent it to client. In
     * case of any exception from the service files an error object if formed.
     *
     * @param dbName       Name of the database
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param username     username of the user being added to the database
     * @param password     password of the user being added to the database
     * @param readOnlypar  The optional parameter for creating the user
     * @param request      Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a
     *         collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("addUser")
    public String addUserRequest(@PathParam("dbName") final String dbName, @DefaultValue("POST") @QueryParam("connectionId") final String connectionId, @FormParam("addUser_user_name") final String username,
                                 @FormParam("addUser_password") final String password, @FormParam("addUser_readonly") final String readOnlypar, @Context final HttpServletRequest request) {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                boolean readOnly = false;

                SystemCollectionService systemCollectionService = new SystemCollectionServiceImpl(connectionId);
                if (readOnlypar == null) {
                    readOnly = false;
                } else if (readOnlypar.equalsIgnoreCase("on")) {
                    readOnly = true;
                }

                return systemCollectionService.addUser(dbName, username, password, readOnly);
            }
        });
        return response;
    }

    /**
     * Maps POST request for removing the user from a particular database present
     * in the mongo db.
     *
     * @param dbName       Name of the database
     * @param username     username of the user being deleted from the database
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param request      Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a
     *         collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("removeUser")
    public String removeUserRequest(@PathParam("dbName") final String dbName, @FormParam("username") final String username, @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
                                    @Context final HttpServletRequest request) {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                SystemCollectionService systemCollectionService = new SystemCollectionServiceImpl(connectionId);
                return systemCollectionService.removeUser(dbName, username);
            }
        });

        return response;
    }

    /**
     * Maps POST request for removing all the users from a particular database present
     * in the mongo db.
     *
     * @param dbName       Name of the database
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param request      Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a
     *         collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("removeAllUsers")
    public String removeAllUserRequest(@PathParam("dbName") final String dbName, @DefaultValue("POST") @QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                SystemCollectionService systemCollectionService = new SystemCollectionServiceImpl(connectionId);
                return systemCollectionService.removeAllUsers(dbName);
            }
        });

        return response;
    }

    /**
     * Maps to the POST request for adding an index to a collection in a database
     * present in mongo db
     *
     * @param dbName         Name of the database
     * @param index_keys     keys of the index to be added
     * @param collectionName Name of the collection for which the index is added
     * @param connectionId   Mongo Db Configuration provided by user to connect to.
     * @param request        Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a
     *         collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("addIndex")
    public String addIndex(@PathParam("dbName") final String dbName, @FormParam("index_keys") final String index_keys, @FormParam("index_colname") final String collectionName, @DefaultValue("POST") @QueryParam("connectionId") final String connectionId,
                           @Context final HttpServletRequest request) {

        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                //Convert the json keys into a DB object
                DBObject keys = (DBObject) JSON.parse(index_keys);
                SystemCollectionService systemCollectionService = new SystemCollectionServiceImpl(connectionId);
                return systemCollectionService.addIndex(dbName, collectionName, keys);
            }

        });

        return response;
    }

    /**
     * Maps to the POST request for dropping all the indexes in all collection from a give database.
     *
     * @param dbName       Name of the database
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param request      Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a
     *         collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("dropAllIndexes")
    public String dropIndexes(@PathParam("dbName") final String dbName, @DefaultValue("POST") @QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) {
        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            @Override
            public Object execute() throws Exception {
                SystemCollectionService systemCollectionService = new SystemCollectionServiceImpl(connectionId);
                return systemCollectionService.removeIndexes(dbName);
            }
        });
        return response;

    }

    /**
     * Maps to the POST request of dropping an index from a collection in the given database
     *
     * @param dbName       Name of the database
     * @param nameSpace    namespace of the index to be deleted. Colleciton name is extracted from the nameSpace
     * @param indexName    Name of the index to be deleted
     * @param connectionId Mongo Db Configuration provided by user to connect to.
     * @param request      Get the HTTP request context to extract session parameters
     * @return A String of JSON format with list of All Documents in a
     *         collection.
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("dropIndex")
    public String dropIndex(@PathParam("dbName") final String dbName, @FormParam("nameSpace") final String nameSpace, @FormParam("indexName") final String indexName, @DefaultValue("POST") @QueryParam("connectionId") final String connectionId, @Context final HttpServletRequest request) {
        String response = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            @Override
            public Object execute() throws Exception {
                SystemCollectionService systemCollectionService = new SystemCollectionServiceImpl(connectionId);
                //The collection name is obtained by removing the DB name from the namespace.
                String collectionName = nameSpace.replace(dbName + ".", "");
                return systemCollectionService.removeIndex(dbName, collectionName, indexName);
            }
        });
        return response;

    }

}
