/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd.
 * Hyderabad, India
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following condition
 * is met:
 *
 *     + Neither the name of Imaginea, nor the
 *       names of its contributors may be used to endorse or promote
 *       products derived from this software.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package com.imaginea.mongodb.controllers;

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.utils.ConfigMongoInstanceProvider;
import com.imaginea.mongodb.utils.JSON;
import com.imaginea.mongodb.utils.MongoInstanceProvider;
import com.mongodb.*;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;

/**
 * Tests the database request dispatcher resource that handles the GET and POST
 * request for performing operations on databases present in Mongo. Hereby we
 * test the get and post resources with dummy request and check the
 * functionality.
 * <p/>
 * An ArrayList of various test DbNames possible has been taken and functions
 * are tested for all of them.
 *
 * @author Rachit Mittal
 * @since 14 July 2011
 */
public class DatabaseControllerTest extends TestingTemplate {

    private MongoInstanceProvider mongoInstanceProvider;
    private static Mongo mongoInstance;

    /**
     * Class to be tested.
     */
    private DatabaseController testDbResource;

    /**
     * Logger object
     */
    private static Logger logger = Logger.getLogger(DatabaseControllerTest.class);
    private static final String logConfigFile = "src/main/resources/log4j.properties";
    // To set a dbInfo in session
    // Not coded to interface as Mock object provides a set Session
    // functionality.
    private MockHttpServletRequest request = new MockHttpServletRequest();
    private String testDbInfo;
    private String connectionId;

    /**
     * Constructs a mongoInstanceProvider Object.
     */
    public DatabaseControllerTest() {

        TestingTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
                mongoInstanceProvider = new ConfigMongoInstanceProvider();
                PropertyConfigurator.configure(logConfigFile);
                return null;
            }
        });
    }

    /**
     * Instantiates the object of class under test and also creates an instance
     * of mongo using the mongo service provider that reads from config file in
     * order to test resources.Here we also put our tokenId in session and in
     * mappings defined in LoginController class so that user is authentcated.
     */
    @Before
    public void instantiateTestClass() {

        // Creates Mongo Instance.
        mongoInstance = mongoInstanceProvider.getMongoInstance();
        // Class to be tested
        testDbResource = new DatabaseController();
        // Add user to mappings in userLogin for authentication
        testDbInfo = mongoInstance.getAddress().getHost() + "_" + mongoInstance.getAddress().getPort();
        LoginController.mongoConfigToInstanceMapping.put(testDbInfo, mongoInstance);
        // Add dbInfo in Session
        List<String> dbInfos = new ArrayList<String>();
        dbInfos.add(testDbInfo);
        HttpSession session = new MockHttpSession();
        session.setAttribute("dbInfo", dbInfos);
        request = new MockHttpServletRequest();
        request.setSession(session);
        // TODO can do this same work in a function at one place.
        LoginController loginController = new LoginController();

        // Add user to mappings in userLogin for authentication
        String response = loginController.authenticateUser("admin", "admin", "localhost", "27017", null, request);
        BasicDBObject responseObject = (BasicDBObject) JSON.parse(response);
        connectionId = (String) ((BasicDBObject) responseObject.get("response")).get("connectionId");
    }

    /**
     * Tests the GET Request which gets names of all databases present in Mongo.
     * Here we construct the Test Database first and will test if this created
     * Database is present in the response of the GET Request made. If it is,
     * then tested ok. We will try it with multiple test Databases.
     */

    @Test
    public void getdbList() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);
        testDbNames.add("admin");

        for (final String dbName : testDbNames) {
            TestingTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    try {
                        // Create a Db.
                        if (dbName != null) {
                            if (!dbName.equals("")) {
                                if (!mongoInstance.getDatabaseNames().contains(dbName)) {
                                    mongoInstance.getDB(dbName).getCollectionNames();
                                }
                            }
                        }
                        String dbList = testDbResource.getDbList(testDbInfo, request);

                        // response has a JSON Object with result as key and
                        // value as
                        DBObject response = (BasicDBObject) JSON.parse(dbList);
                        DBObject result = (BasicDBObject) response.get("response");
                        BasicDBList dbNames = (BasicDBList) result.get("result");
                        if (dbName == null) {
                            assert (!dbNames.contains(dbName));
                        } else if (dbName.equals("")) {
                            assert (!dbNames.contains(dbName));
                        } else if (dbName.equals("admin")) {
                            assert (dbNames.contains(dbName)); // dont delete
                            // admin
                        } else {
                            assert (dbNames.contains(dbName));
                            mongoInstance.dropDatabase(dbName);
                        }
                    } catch (MongoException m) {
                        ApplicationException e = new ApplicationException(ErrorCodes.GET_DB_LIST_EXCEPTION, "GET_DB_LIST_EXCEPTION", m.getCause());
                        throw e;
                    }
                    return null;
                }
            });
        }
    }

    /**
     * Tests a POST request made to database resource for creation of a database
     * in mongo db.
     *
     * @throws DatabaseException
     */

    @Test
    public void createDatabase() throws DatabaseException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add("admin");
        testDbNames.add(null);
        for (final String dbName : testDbNames) {
            TestingTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    try {

                        String resp = testDbResource.postDbRequest(dbName, "PUT", connectionId, request);

                        if (dbName == null) {
                            DBObject response = (BasicDBObject) JSON.parse(resp);
                            DBObject error = (BasicDBObject) response.get("response");
                            String code = (String) ((BasicDBObject) error.get("error")).get("code");
                            assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                        } else if (dbName.equals("")) {
                            DBObject response = (BasicDBObject) JSON.parse(resp);
                            DBObject error = (BasicDBObject) response.get("response");
                            String code = (String) ((BasicDBObject) error.get("error")).get("code");
                            assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                        } else if (dbName.equals("admin")) {
                            DBObject response = (BasicDBObject) JSON.parse(resp);
                            DBObject error = (BasicDBObject) response.get("response");
                            String code = (String) ((BasicDBObject) error.get("error")).get("code");
                            assertEquals(ErrorCodes.DB_ALREADY_EXISTS, code);
                        } else {
                            List<String> dbNames = mongoInstance.getDatabaseNames();
                            assert (dbNames.contains(dbName));
                            mongoInstance.dropDatabase(dbName);
                        }

                    } catch (MongoException m) {
                        ApplicationException e = new ApplicationException(ErrorCodes.DB_CREATION_EXCEPTION, "DB_CREATION_EXCEPTION", m.getCause());
                        throw e;
                    }
                    return null;
                }
            });
        }
    }

    /**
     * Tests a POST request made to database resource for deletion of a database
     * in mongo db.
     *
     * @throws DatabaseException
     */

    @Test
    public void deleteDatabase() throws DatabaseException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        for (final String dbName : testDbNames) {
            TestingTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    try {
                        if (dbName != null) {
                            if (!dbName.equals("")) {
                                if (!mongoInstance.getDatabaseNames().contains(dbName)) {
                                    mongoInstance.getDB(dbName).getCollectionNames();
                                }
                            }
                        }

                        String resp = testDbResource.postDbRequest(dbName, "DELETE", connectionId, request);

                        List<String> dbNames = mongoInstance.getDatabaseNames();

                        if (dbName == null) {
                            DBObject response = (BasicDBObject) JSON.parse(resp);
                            DBObject error = (BasicDBObject) response.get("response");
                            String code = (String) ((BasicDBObject) error.get("error")).get("code");
                            assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                        } else if (dbName.equals("")) {
                            DBObject response = (BasicDBObject) JSON.parse(resp);
                            DBObject error = (BasicDBObject) response.get("response");
                            String code = (String) ((BasicDBObject) error.get("error")).get("code");
                            assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                        } else {
                            assert (!dbNames.contains(dbName));
                            mongoInstance.dropDatabase(dbName);
                        }

                    } catch (MongoException m) {
                        ApplicationException e = new ApplicationException(ErrorCodes.DB_DELETION_EXCEPTION, "DB_DELETION_EXCEPTION", m.getCause());
                        throw e;
                    }
                    return null;

                }
            });
        }
    }

    @AfterClass
    public static void destroyMongoProcess() {
        mongoInstance.close();
    }
}
