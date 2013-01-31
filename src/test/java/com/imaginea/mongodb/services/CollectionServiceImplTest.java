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
import com.imaginea.mongodb.services.impl.CollectionServiceImpl;
import com.imaginea.mongodb.utils.ConfigMongoInstanceProvider;
import com.imaginea.mongodb.utils.JSON;
import com.imaginea.mongodb.utils.MongoInstanceProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
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
import org.springframework.mock.web.MockHttpSession;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertEquals;

/**
 * Test all the Service functions on collections inside Databases present in
 * MongoDb.
 *
 * @author Rachit Mittal
 * @since 16 July 2011
 */

public class CollectionServiceImplTest extends TestingTemplate {

    /**
     * Instance of class to be tested.
     */
    private CollectionServiceImpl testCollService;
    /**
     * Provides Mongo Instance.
     */
    private MongoInstanceProvider mongoInstanceProvider;
    private static Mongo mongoInstance;
    private MockHttpServletRequest request = new MockHttpServletRequest();
    /**
     * Logger Object
     */
    private static Logger logger = Logger.getLogger(CollectionServiceImplTest.class);
    private static final String logConfigFile = "src/main/resources/log4j.properties";
    private String connectionId;

    /**
     * Constructs a mongoInstanceProvider Object.
     */
    public CollectionServiceImplTest() {
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
        testCollService = new CollectionServiceImpl(connectionId);
        request = new MockHttpServletRequest();

    }

    /**
     * Tests get collection service to get all Collections in a database. Here
     * we will create a test collection inside a Database and will check if that
     * collection exists in the collection list from the service.
     */
    @Test
    public void getCollList() {
        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        testDbNames.add("random");
        List<String> testCollectionNames = new ArrayList<String>();
        testCollectionNames.add("foo");

        for (final String dbName : testDbNames) {
            for (final String collectionName : testCollectionNames) {
                TestingTemplate.execute(logger, new ResponseCallback() {
                    public Object execute() throws Exception {
                        try {
                            // Create a collection
                            if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {
                                DBObject options = new BasicDBObject();
                                mongoInstance.getDB(dbName).createCollection(collectionName, options);
                            }
                            // Get collection list from service
                            Set<String> collectionList = testCollService.getCollList(dbName);
                            assert (collectionList.contains(collectionName));
                            // Db not populate by test Cases
                            mongoInstance.dropDatabase(dbName);
                        } catch (MongoException m) {
                            // Throw a new Exception here if mongoexception in
                            // this code
                            ApplicationException e = new ApplicationException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, "Error While testing Get Collections", m.getCause());
                            throw e;
                        }
                        // Return nothing . Just error written in log
                        return null;
                    }
                });
            }
        }

    }

    /**
     * Tests insert collection service on collections in a Database. Hereby we
     * will insert a collection using the service and then will check if that
     * collection is present in the list of collections.
     */
    @Test
    public void insertColl() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        testDbNames.add("random");
        List<String> testCollectionNames = new ArrayList<String>();
        testCollectionNames.add("foo");

        for (final String dbName : testDbNames) {
            for (final String collectionName : testCollectionNames) {
                TestingTemplate.execute(logger, new ResponseCallback() {
                    public Object execute() throws Exception {
                        try {// Delete the collection first
                            if (mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {
                                mongoInstance.getDB(dbName).getCollection(collectionName).drop();
                            }
                            // Insert collection using service
                            testCollService.insertCollection(dbName, collectionName, true, 100000, 100, true);
                            // Check if collection exists in get List of
                            // collections
                            Set<String> collectionList = mongoInstance.getDB(dbName).getCollectionNames();
                            assert (collectionList.contains(collectionName));
                            // drop this collection
                            mongoInstance.getDB(dbName).getCollection(collectionName).drop();
                        } catch (MongoException m) // while dropping Db
                        {
                            ApplicationException e = new ApplicationException(ErrorCodes.COLLECTION_CREATION_EXCEPTION, "Error Testing Collection insert", m.getCause());
                            formErrorResponse(logger, e);
                            throw e;
                        }
                        return null;
                    }
                });
            }
        }

    }

    /**
     * Tests delete collection service on collections in a Database. Hereby we
     * will delete a collection using the service and then will check if that
     * collection is not present in the collection list.
     */
    @Test
    public void deleteColl() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        testDbNames.add("random");
        List<String> testCollectionNames = new ArrayList<String>();
        testCollectionNames.add("foo");
        for (final String dbName : testDbNames) {
            for (final String collectionName : testCollectionNames) {
                TestingTemplate.execute(logger, new ResponseCallback() {
                    public Object execute() throws Exception {
                        try {
                            // Create a collection first
                            if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {
                                DBObject options = new BasicDBObject();
                                mongoInstance.getDB(dbName).createCollection(collectionName, options);
                            }

                            // Delete collection using service
                            testCollService.deleteCollection(dbName, collectionName);
                            // Check if collection exists in the list
                            Set<String> collectionList = mongoInstance.getDB(dbName).getCollectionNames();
                            assert (!collectionList.contains(collectionName));
                        } catch (MongoException m) // while dropping Db
                        {
                            ApplicationException e = new ApplicationException(ErrorCodes.COLLECTION_DELETION_EXCEPTION, "Error Testing Collection delete", m.getCause());
                            throw e;
                        }
                        return null;
                    }
                });
            }
        }
    }

    /**
     * Tests get collection statistics service on collections in a database.
     * Hereby we will create an empty collection inside a Database and will
     * check the Number of documents in the Statistics obtained.
     */
    @Test
    public void getCollStats() {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        testDbNames.add("random");
        List<String> testCollectionNames = new ArrayList<String>();
        testCollectionNames.add("foo");
        for (final String dbName : testDbNames) {
            for (final String collectionName : testCollectionNames) {
                TestingTemplate.execute(logger, new ResponseCallback() {
                    public Object execute() throws Exception {
                        try {
                            // Delete the collection first if exist
                            if (mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {
                                mongoInstance.getDB(dbName).getCollection(collectionName).drop();
                            }
                            // Create an empty collection
                            DBObject options = new BasicDBObject();
                            mongoInstance.getDB(dbName).createCollection(collectionName, options);
                            JSONArray dbStats = testCollService.getCollStats(dbName, collectionName);
                            // Check if noOf Documents = 0
                            for (int i = 0; i < dbStats.length(); i++) {
                                JSONObject temp = (JSONObject) dbStats.get(i);
                                if ("count".equals(temp.get("Key"))) {
                                    int noOfDocuments = Integer.parseInt((String) temp.get("Value"));
                                    assertEquals(noOfDocuments, 0); // As Empty
                                    // Collection
                                    break;
                                }
                            }
                        } catch (MongoException m) // while dropping Db
                        {
                            ApplicationException e = new ApplicationException(ErrorCodes.GET_COLL_STATS_EXCEPTION, "Error Testing Collection stats", m.getCause());
                            throw e;
                        }
                        return null;
                    }
                });
            }
        }

    }

    @AfterClass
    public static void destroyMongoProcess() {
        mongoInstance.close();
    }
}
