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

import com.imaginea.mongodb.controllers.BaseController.ResponseCallback;
import com.imaginea.mongodb.controllers.BaseController.ResponseTemplate;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.impl.AuthServiceImpl;
import com.mongodb.BasicDBObject;
import com.mongodb.CommandResult;
import com.mongodb.DB;
import com.mongodb.Mongo;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Return values of queries,updates,inserts and deletes being performed on Mongo
 * Db per sec.
 *
 * @author Aditya Gaur, Rachit Mittal
 */
public class GraphController extends HttpServlet {
    private static final long serialVersionUID = -1539358875210511143L;

    private static JSONArray array;
    private static int num = 0;

    // TODO For multiple users - static variable do not work. So static variable
    // per mongoHost
    /**
     * Keep the record of last values.
     */
    private static int lastNoOfQueries = 0;
    private static int lastNoOfInserts = 0;
    private static int lastNoOfUpdates = 0;
    private static int lastNoOfDeletes = 0;
    private int maxLen = 20;
    private int jump = 1;

    private AuthService authService = AuthServiceImpl.getInstance();

    private static Logger logger = Logger.getLogger(GraphController.class);

    /**
     * Constructor for Servlet and also configures Logger.
     *
     * @throws IOException If Log file cannot be written
     */
    public GraphController() throws IOException {
        super();
    }

    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request  servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException      if an I/O error occurs
     */
    @Override
    protected void doGet(final HttpServletRequest request, final HttpServletResponse response) throws ServletException, IOException {
        // Declare Response Objects and PrintWriter
        response.setContentType("application/x-json");
        PrintWriter out = response.getWriter();

        final String connectionId = request.getParameter("connectionId");
        String result = new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
            public Object execute() throws Exception {
                Mongo mongoInstance = authService.getMongoInstance(connectionId);
                // Need a Db to get ServerStats
                DB db = mongoInstance.getDB("admin");
                String uri = request.getRequestURI();
                Object result = null;
                if (uri != null) {
                    if (uri.substring(uri.lastIndexOf('/')).equals("/query")) {
                        result = processQuery(db);
                    } else if (uri.substring(uri.lastIndexOf('/')).equals("/initiate")) {
                        if (request.getParameter("pollingTime") != null) {
                            jump = Integer.parseInt(request.getParameter("pollingTime"));
                        }
                        result = processInitiate(db);
                    }
                }
                return result;
            }
        });
        out.write(result);

    }

    /**
     * Process <opcounters> query request made after each second by Front end
     *
     * @param db : Db Name to egt Server Stats <admin>
     * @return Server stats of <opcounters> key
     * @throws IOException
     * @throws JSONException
     */
    private JSONArray processQuery(DB db) throws IOException, JSONException {

        CommandResult cr = db.command("serverStatus");
        BasicDBObject obj = (BasicDBObject) cr.get("opcounters");
        int currentValue;
        JSONObject temp = new JSONObject();

        num = num + jump;
        temp.put("TimeStamp", num);
        currentValue = (Integer) obj.get("query");
        temp.put("QueryValue", currentValue - lastNoOfQueries);
        lastNoOfQueries = currentValue;
        currentValue = (Integer) obj.get("insert");
        temp.put("InsertValue", currentValue - lastNoOfInserts);
        lastNoOfInserts = currentValue;
        currentValue = (Integer) obj.get("update");
        temp.put("UpdateValue", currentValue - lastNoOfUpdates);
        lastNoOfUpdates = currentValue;
        currentValue = (Integer) obj.get("delete");
        temp.put("DeleteValue", currentValue - lastNoOfDeletes);
        lastNoOfDeletes = currentValue;

        if (array.length() == maxLen) {
            JSONArray tempArray = new JSONArray();
            for (int i = 1; i < maxLen; i++) {
                tempArray.put(array.get(i));
            }
            array = tempArray;
        }
        array.put(temp);
        return array;
    }

    /**
     * Initialize by previous <opcounter> value.
     *
     * @param db : Name of Database
     * @return : Status of Initialization
     * @throws RuntimeException
     */

    private JSONObject processInitiate(DB db) throws RuntimeException, JSONException {

        JSONObject respObj = new JSONObject();
        array = new JSONArray();
        num = 0;
        try {

            CommandResult cr = db.command("serverStatus");
            BasicDBObject obj = (BasicDBObject) cr.get("opcounters");
            lastNoOfQueries = (Integer) obj.get("query");
            lastNoOfInserts = (Integer) obj.get("insert");
            lastNoOfUpdates = (Integer) obj.get("update");
            lastNoOfDeletes = (Integer) obj.get("delete");

            respObj.put("result", "Initiated");
        } catch (Exception e) {
            // Invalid User
            JSONObject error = new JSONObject();
            error.put("message", e.getMessage());
            error.put("code", ErrorCodes.ERROR_INITIATING_GRAPH);

            respObj.put("error", error);
            logger.info(respObj);
        }
        return respObj;
    }
}
