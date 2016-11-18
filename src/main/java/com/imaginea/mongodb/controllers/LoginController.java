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
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import com.imaginea.mongodb.domain.ConnectionDetails;
import com.imaginea.mongodb.domain.MongoConnectionDetails;
import com.imaginea.mongodb.domain.UserLoginData;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.MongoConnectionException;
import com.imaginea.mongodb.services.impl.AuthServiceImpl;
import com.imaginea.mongodb.services.impl.DatabaseServiceImpl;
import com.imaginea.mongodb.services.impl.SystemCollectionServiceImpl;
import com.mongodb.MongoException;
import com.mongodb.MongoInternalException;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import java.util.List;

/**
 * O Authenticates User to Mongo Db by checking the user in <system.users> collection of admin
 * database.
 * <p/>
 * Here we also create a map of a mongo configuration which is mongo host and mongoPort provided by
 * user to a mongo Instance. This mongo Instance is used for requests made to this database
 * configuration. Also stores a map of active users on a given mongo configuration for closing the
 * mongo instance at time of disconnect.
 *
 * @author Rachit Mittal
 * @since 10 July 2011
 */

@Path("/login")
@Api(value = "/login", description = "login base uri")
public class LoginController extends BaseController {

    private static Logger logger = Logger.getLogger(LoginController.class);

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiOperation(value = "for login to mongodb", notes = "In order to login you must pass atleast host and port", position = 1)
    public String authenticateUser(
            @ApiParam(value = "user login data in json format", required = true) final UserLoginData userLoginData,
            @Context final HttpServletRequest request) {

        String response = ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
                if ("".equals(userLoginData.getHost()) || "".equals(userLoginData.getPort())) {
                    ApplicationException e =
                            new ApplicationException(ErrorCodes.MISSING_LOGIN_FIELDS, "Missing Login Fields");
                    return formErrorResponse(logger, e);
                }

                int port = 0;
                try {
                    port = Integer.parseInt(userLoginData.getPort());
                } catch (NumberFormatException e) {
                    throw new MongoConnectionException(ErrorCodes.INVALID_PORT,
                            "You have entered an invalid port number !");
                }
                ConnectionDetails connectionDetails = new ConnectionDetails(userLoginData.getHost(), port,
                        userLoginData.getUserName(), userLoginData.getPassword(), userLoginData.getDatabases());
                String connectionId = null;
                try {
                    connectionId = authService.authenticate(connectionDetails);
                } catch (IllegalArgumentException m) {
                    throw new MongoConnectionException(ErrorCodes.INVALID_ARGUMENT,
                            "You have entered an invalid data !");
                } catch (MongoInternalException m) {
                    // Throws when cannot connect to localhost.com
                    throw new MongoConnectionException(ErrorCodes.HOST_UNKNOWN, m.getMessage());
                } catch (MongoException m) {
                    throw new MongoConnectionException(ErrorCodes.MONGO_CONNECTION_EXCEPTION,
                            "Connection Failed. Check if MongoDB is running at the given host and port.");
                }
                JSONObject response = new JSONObject();
                try {
                    response.put("success", true);
                    response.put("connectionId", connectionId);
                } catch (JSONException e) {
                    logger.error(e);
                }
                return response;
            }
        }, true);
        return response;
    }


    /**
     * Authenticates User by verifying Mongo config details against admin database and authenticating
     * user to that Db. A facility for guest login is also allowed when both fields username and
     * password are empty.
     * <p/>
     * Also stores a mongo instance based on database configuration.
     *
     * @param request   Request made by user for authentication
     * @param user      Name of user as in admin database in mongo
     * @param password  password of user as in admin database in mongo
     * @param host      mongo host to connect to
     * @param mongoPort mongo Port to connect to
     */

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public String authenticateUser(final @FormParam("username") String user,
                                   @FormParam("password") final String password, final @FormParam("host") String host,
                                   @FormParam("port") final String mongoPort, @FormParam("databases") final String databases,
                                   @Context final HttpServletRequest request) {


        String response = ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
                if ("".equals(host) || "".equals(mongoPort)) {
                    ApplicationException e = new ApplicationException(ErrorCodes.MISSING_LOGIN_FIELDS, "Missing Login Fields");
                    return formErrorResponse(logger, e);
                }
                int port = 0;
                try {
                    port = Integer.parseInt(mongoPort);
                } catch (NumberFormatException e) {
                    throw new MongoConnectionException(ErrorCodes.INVALID_PORT,"You have entered an invalid port number !");
                }
                ConnectionDetails connectionDetails = new ConnectionDetails(host, port, user, password, databases);
                String connectionId = null;
                try {
                    connectionId = authService.authenticate(connectionDetails);
                } catch (IllegalArgumentException m) {
                    throw new MongoConnectionException(ErrorCodes.INVALID_ARGUMENT,"You have entered an invalid data !");
                } catch (MongoInternalException m) {
                    // Throws when cannot connect to localhost.com
                    throw new MongoConnectionException(ErrorCodes.HOST_UNKNOWN, m.getMessage());
                } catch (MongoException m) {
                    throw new MongoConnectionException(ErrorCodes.MONGO_CONNECTION_EXCEPTION,"Connection Failed. Check if MongoDB is running at the given host and port.");
                } catch (ApplicationException m) {
                    throw new ApplicationException(ErrorCodes.NEED_AUTHORISATION, m.getMessage());
                }

                JSONObject response = new JSONObject();
                try {
                    String clientMongoVersion = new SystemCollectionServiceImpl(connectionId).getMongoClientVersion(connectionDetails.getDbName());
                    if (clientMongoVersion.contains("2.4")) {
                        logger.info("User is currently using " + clientMongoVersion + "  which has compatability issues..!");
                        throw new ApplicationException(ErrorCodes.LEGACY_MONGO_DB_EXCEPTION, "You are using outdated version of mongodb. Please upgrade to mongo 2.6 or higher");
                    }
                    else {
                        response.put("success", true);
                        response.put("connectionId", connectionId);
                    }
                } catch (JSONException e) {
                    logger.error(e);
                }
                return response;
            }
        }, true);
        return response;
    }

    @Path("/details")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String getConnectionDetails(@QueryParam("connectionId") final String connectionId,
                                       @Context final HttpServletRequest request) {
        String response =
                new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
                    public Object execute() throws Exception {
                        MongoConnectionDetails mongoConnectionDetails =
                                authService.getMongoConnectionDetails(connectionId);
                        ConnectionDetails connectionDetails = mongoConnectionDetails.getConnectionDetails();
                        boolean privileges = (connectionDetails.getUsername() == null || connectionDetails.getDbName() == null) ? false : true;

                        List dbList = authService.listDatabases(connectionId, connectionDetails.getDbName());

                        JSONObject jsonResponse = new JSONObject();
                        try {
                            jsonResponse.put("username", connectionDetails.getUsername());
                            jsonResponse.put("host", connectionDetails.getHostIp());
                            jsonResponse.put("port", connectionDetails.getHostPort());
                            jsonResponse.put("dbNames", dbList);
                            jsonResponse.put("authMode", connectionDetails.isAuthMode());
                            jsonResponse.put("hasAdminLoggedIn", connectionDetails.isAdminLogin());
                            if (privileges)
                                jsonResponse.put("rolesAndPrivileges", new SystemCollectionServiceImpl(connectionId).getUsersPrivileges(connectionDetails.getDbName(), connectionDetails.getUsername()));
                        } catch (JSONException e) {
                            logger.error(e);
                        }
                        return jsonResponse;
                    }
                });
        return response;
    }
}
