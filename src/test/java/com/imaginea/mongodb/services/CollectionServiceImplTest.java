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

import com.imaginea.mongodb.controllers.TestingTemplate;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.services.impl.CollectionServiceImpl;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.MongoException;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
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
    private CollectionService testCollectionService;

    private static HttpServletRequest request = new MockHttpServletRequest();
    private static String connectionId;


    private static Logger logger = Logger.getLogger(CollectionServiceImplTest.class);

    @Before
    public void instantiateTestClass() throws ApplicationException {
        connectionId = loginAndGetConnectionId(request);
        testCollectionService = new CollectionServiceImpl(connectionId);
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
                            Set<String> collectionList = testCollectionService.getCollList(dbName);
                            assert (collectionList.contains(collectionName));
                            // Db not populate by test Cases
                            mongoInstance.dropDatabase(dbName);
                        } catch (MongoException m) {
                            // Throw a new Exception here if mongoexception in
                            // this code
                            throw new ApplicationException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, "Error While testing Get Collections", m.getCause());
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
                            testCollectionService.insertCollection(dbName, collectionName, true, 100000, 100, true);
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
                            testCollectionService.deleteCollection(dbName, collectionName);
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
                            JSONArray dbStats = testCollectionService.getCollStats(dbName, collectionName);
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
        logout(connectionId, request);
    }
}
