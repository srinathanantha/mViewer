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

package com.imaginea.mongodb.services;

import com.imaginea.mongodb.controllers.LoginController;
import com.imaginea.mongodb.controllers.TestingTemplate;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.services.impl.DatabaseServiceImpl;
import com.imaginea.mongodb.utils.ConfigMongoInstanceProvider;
import com.imaginea.mongodb.utils.JSON;
import com.imaginea.mongodb.utils.MongoInstanceProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;

/**
 * Test service functions for performing operations like create/drop on
 * databases present in Mongo Db.
 *
 * @author Rachit Mittal
 * @since 16 July 2011
 */

public class DatabaseServiceImplTest extends TestingTemplate {

    /**
     * Instance of class to be tested.
     */
    private DatabaseServiceImpl testDbService;
    /**
     * Provides Mongo Instance.
     */
    private MongoInstanceProvider mongoInstanceProvider;
    private static Mongo mongoInstance;
    private MockHttpServletRequest request = new MockHttpServletRequest();
    /**
     * Logger Object
     */
    private static Logger logger = Logger.getLogger(DatabaseServiceImplTest.class);

    private static final String logConfigFile = "src/main/resources/log4j.properties";
    private String connectionId;

    /**
     * Constructs a mongoInstanceProvider Object
     */
    public DatabaseServiceImplTest() {
        ErrorTemplate.execute(logger, new ResponseCallback() {
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
    public void instantiateTestClass() throws ApplicationException {
        LoginController loginController = new LoginController();
        // Add user to mappings in userLogin for authentication
        String response = loginController.authenticateUser("admin", "admin", "localhost", "27017", null, request);
        BasicDBObject responseObject = (BasicDBObject) JSON.parse(response);
        connectionId = (String) ((BasicDBObject) responseObject.get("response")).get("connectionId");


        // Creates Mongo Instance.
        mongoInstance = mongoInstanceProvider.getMongoInstance();
        // Add user to mappings in userLogin for authentication
        String dbInfo = mongoInstance.getAddress() + "_" + mongoInstance.getConnectPoint();
        LoginController.mongoConfigToInstanceMapping.put(dbInfo, mongoInstance);
        // Class to be tested
        testDbService = new DatabaseServiceImpl(connectionId);
    }

    /**
     * Tests get databases list service function of Mongo Db. Hereby we first
     * create a Database and check whether get Service shows that Db in the list
     * of Db Names
     */
    @Test
    public void getDbList() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("admin");
        testDbNames.add(null);
        testDbNames.add("");
        for (final String dbName : testDbNames) {
            ErrorTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    try {
                        // Create a Database
                        if (dbName != null) {
                            if (!"".equals(dbName)) {
                                if (!mongoInstance.getDatabaseNames().contains(dbName)) {
                                    mongoInstance.getDB(dbName).getCollectionNames();
                                }
                            }
                        }
                        // Get list using service
                        List<String> dbNames = testDbService.getDbList();
                        if (dbName == null) {
                            assert (!dbNames.contains(dbName));
                        } else if ("".equals(dbName)) {
                            assert (!dbNames.contains(dbName));
                        } else if (dbName.equals("admin")) {
                            assert (dbNames.contains(dbName));
                        } else {
                            assert (dbNames.contains(dbName));
                            // Db not populate by test Cases
                            mongoInstance.dropDatabase(dbName);
                        }
                    } catch (MongoException m) // while dropping Db
                    {
                        ApplicationException e = new ApplicationException(ErrorCodes.GET_DB_LIST_EXCEPTION, "Error Testing Database List", m.getCause());
                        throw e;
                    }
                    return null;
                }
            });
        }
    }

    /**
     * Tests service function that creates database in Mongo Db. Here we create
     * a new database using the Service and check if the database created is
     * present in the list of databases in Mongo.
     */
    @Test
    public void createDb() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);
        for (final String dbName : testDbNames) {
            ErrorTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    try {
                        // Create a Database using service
                        testDbService.createDb(dbName);
                        // Get Db List
                        List<String> dbNames = mongoInstance.getDatabaseNames();
                        if (dbName == null) {
                            assertFalse("Db should not be created when it is null", dbNames.contains(dbName));
                        } else if ("".equals(dbName)) {
                            assertFalse("Db should not be created when it is an empty string", dbNames.contains(dbName));
                        } else {
                            assertTrue("Db should be created when it is a non empty string", dbNames.contains(dbName));
                            // Db not populate by test Cases
                            mongoInstance.dropDatabase(dbName);
                        }
                    } catch (MongoException m) {
                        ApplicationException e = new ApplicationException(ErrorCodes.DB_CREATION_EXCEPTION, "Error Testing Database insert operation", m.getCause());
                        formErrorResponse(logger, e);
                        throw e;
                    }
                    return null;
                }
            });
        }
    }

    /**
     * Tests service function that deletes database in Mongo Db. Here we delete
     * database using the Service and check if the database created is present
     * in the list of databases in Mongo.
     */

    @Test
    public void dropDb() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        for (final String dbName : testDbNames) {
            ErrorTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    // Create a Db
                    try {
                        if (dbName != null) {
                            if (!"".equals(dbName)) {
                                if (!mongoInstance.getDatabaseNames().contains(dbName)) {
                                    mongoInstance.getDB(dbName).getCollectionNames();
                                }
                            }
                        }
                        // Drop using service
                        testDbService.dropDb(dbName);
                        List<String> dbNames = mongoInstance.getDatabaseNames();
                        if (dbName == null) {
                            assertFalse("Check if dbName doesnot exist when db name is null", dbNames.contains(dbName));
                        } else if ("".equals(dbName)) {
                            assertFalse("Check if dbName doesnot exist when db name is an empty string", dbNames.contains(dbName));
                        } else {
                            assertFalse("Check db Name is it droped properly", dbNames.contains(dbName));
                            // Db not populate by test Cases
                            mongoInstance.dropDatabase(dbName);
                        }
                    } catch (MongoException m) {
                        ApplicationException e = new ApplicationException(ErrorCodes.DB_DELETION_EXCEPTION, "Error Testing Database delete operation", m.getCause());
                        throw e;
                    }
                    return null;
                }
            });
        }
    }

    /**
     * Tests service function that gets statistcs of a database in Mongo Db.
     * Hereby we create an empty Db and verify that the collections field in
     * database statistics is empty.
     */
    @Test
    public void getDbStats() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");

        for (final String dbName : testDbNames) {
            ErrorTemplate.execute(logger, new ResponseCallback() {
                public Object execute() throws Exception {
                    try {
                        if (mongoInstance.getDatabaseNames().contains(dbName)) {
                            // Delete if Db exist
                            mongoInstance.dropDatabase(dbName);
                        }
                        // Create an empty db
                        mongoInstance.getDB(dbName).getCollectionNames();
                        JSONArray dbStats = testDbService.getDbStats(dbName);

                        for (int i = 0; i < dbStats.length(); i++) {
                            JSONObject temp = (JSONObject) dbStats.get(i);
                            if (temp.get("Key").equals("collections")) {
                                int noOfCollections = Integer.parseInt((String) temp.get("Value"));

                                assertEquals("Collection should be zero as empty db", noOfCollections, 0); // As
                                // Empty
                                // Db
                                break;
                            }
                        }
                    } catch (MongoException m) {
                        ApplicationException e = new ApplicationException(ErrorCodes.GET_DB_STATS_EXCEPTION, "Error Testing Database stats operation", m.getCause());
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
