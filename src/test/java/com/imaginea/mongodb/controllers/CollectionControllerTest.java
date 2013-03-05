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
import com.imaginea.mongodb.exceptions.CollectionException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
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
 * Tests the collection request dispatcher resource that handles the GET and
 * POST request for Collections present in Mongo. Tests the get and post
 * functions mentioned in the resource with some dummy request and test
 * collection and database names and check the functionality.
 *
 * @author Rachit Mittal
 * @since 15 July 2011
 */
public class CollectionControllerTest extends TestingTemplate {

    /**
     * Object of class to be tested
     */
    private CollectionController testCollectionController;

    private static HttpServletRequest request = new MockHttpServletRequest();
    private static String connectionId;

    private static Logger logger = Logger.getLogger(CollectionControllerTest.class);

    @Before
    public void instantiateTestClass() {
        testCollectionController = new CollectionController();
        connectionId = loginAndGetConnectionId(request);
    }

    /**
     * Tests the GET Request which gets names of all collections present in
     * Mongo. Here we construct the test collection first and will test if this
     * created collection is present in the response of the GET Request made.
     *
     * @throws CollectionException
     */

    @Test
    public void getCollList() throws CollectionException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        List<String> testCollNames = new ArrayList<String>();
        testCollNames.add("foo");
        testCollNames.add("");

        for (final String dbName : testDbNames) {
            for (final String collName : testCollNames) {
                TestingTemplate.execute(logger, new ResponseCallback() {
                    public Object execute() throws Exception {
                        try {
                            if (dbName != null && collName != null) {
                                if (!dbName.equals("") && !collName.equals("")) {
                                    if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collName)) {
                                        DBObject options = new BasicDBObject();
                                        mongoInstance.getDB(dbName).createCollection(collName, options);
                                    }
                                }
                            }

                            String collList = testCollectionController.getCollList(dbName, connectionId, request);

                            // response has a JSON Object with result as key and
                            // value
                            // as
                            DBObject response = (BasicDBObject) JSON.parse(collList);

                            if (dbName == null) {
                                DBObject error = (BasicDBObject) response.get("response");
                                String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                            } else if (dbName.equals("")) {
                                DBObject error = (BasicDBObject) response.get("response");
                                String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                            } else {
                                // DB exists
                                DBObject result = (BasicDBObject) response.get("response");
                                BasicDBList collNames = ((BasicDBList) result.get("result"));
                                if (collName == null) {
                                    assert (!collNames.contains(collName));
                                } else if (collName.equals("")) {
                                    assert (!collNames.contains(collName));
                                } else {
                                    assert (collNames.contains(collName));
                                    mongoInstance.dropDatabase(dbName);
                                }
                            }
                        } catch (MongoException m) {
                            ApplicationException e = new ApplicationException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, "GET_COLLECTION_LIST_EXCEPTION", m.getCause());
                            throw e;
                        }
                        return null;
                    }
                });
            }
        }
    }

    /**
     * Tests a Create collection POST Request which creates a collection inside
     * a database in MongoDb.
     *
     * @throws CollectionException
     */

    @Test
    public void createCollection() throws CollectionException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        List<String> testCollNames = new ArrayList<String>();
        testCollNames.add("foo");
        testCollNames.add("");
        testCollNames.add(null);

        for (final String dbName : testDbNames) {
            for (final String collName : testCollNames) {

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

                            // if capped = false , size irrelevant
                            String collList = testCollectionController.postCollRequest(dbName, collName, collName, "false", "off", 0, 0, "on", connectionId, "PUT", request);
                            DBObject response = (BasicDBObject) JSON.parse(collList);

                            if (dbName == null) {
                                DBObject error = (BasicDBObject) response.get("response");
                                String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                            } else if (dbName.equals("")) {
                                DBObject error = (BasicDBObject) response.get("response");
                                String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                            } else {
                                // DB exists

                                if (collName == null) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);

                                } else if (collName.equals("")) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);
                                } else {

                                    Set<String> collNames = mongoInstance.getDB(dbName).getCollectionNames();
                                    assert (collNames.contains(collName));
                                    mongoInstance.dropDatabase(dbName);
                                }
                            }
                        } catch (MongoException m) {
                            ApplicationException e = new ApplicationException(ErrorCodes.COLLECTION_CREATION_EXCEPTION, "COLLECTION_CREATION_EXCEPTION", m.getCause());
                            throw e;
                        }
                        return null;
                    }
                });

            }
        }
    }

    /**
     * Tests a delete collection POST Request which deletes a collection inside
     * a database in MongoDb.
     *
     * @throws CollectionException
     */

    @Test
    public void deleteCollection() throws CollectionException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        List<String> testCollNames = new ArrayList<String>();
        testCollNames.add("foo");
        testCollNames.add("");
        testCollNames.add(null);

        for (final String dbName : testDbNames) {
            for (final String collName : testCollNames) {
                TestingTemplate.execute(logger, new ResponseCallback() {
                    public Object execute() throws Exception {
                        try {

                            if (dbName != null && collName != null) {
                                if (!dbName.equals("") && !collName.equals("")) {
                                    if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collName)) {
                                        DBObject options = new BasicDBObject();
                                        mongoInstance.getDB(dbName).createCollection(collName, options);
                                    }
                                }
                            }

                            // if capped = false , size irrelevant
                            String collList = testCollectionController.postCollRequest(dbName, collName, collName, "false", "off", 0, 0, "on", connectionId, "DELETE", request);
                            DBObject response = (BasicDBObject) JSON.parse(collList);

                            if (dbName == null) {
                                DBObject error = (BasicDBObject) response.get("response");
                                String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                            } else if (dbName.equals("")) {
                                DBObject error = (BasicDBObject) response.get("response");
                                String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                            } else {
                                // DB exists

                                if (collName == null) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);

                                } else if (collName.equals("")) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);
                                } else {

                                    Set<String> collNames = mongoInstance.getDB(dbName).getCollectionNames();


                                    assert (!collNames.contains(collName));
                                }
                            }
                        } catch (MongoException m) {
                            ApplicationException e = new ApplicationException(ErrorCodes.COLLECTION_DELETION_EXCEPTION, "COLLECTION_DELETION_EXCEPTION", m.getCause());
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
        logout(connectionId , request);
    }
}
