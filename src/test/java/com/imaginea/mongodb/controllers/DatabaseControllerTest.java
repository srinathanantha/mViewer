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
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.MongoException;
import org.apache.log4j.Logger;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
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

    /**
     * Class to be tested.
     */
    private DatabaseController testDatabaseController;

    private static HttpServletRequest request = new MockHttpServletRequest();
    private static String connectionId;

    private static Logger logger = Logger.getLogger(DatabaseControllerTest.class);

    @Before
    public void instantiateTestClass() {
        // Class to be tested
        testDatabaseController = new DatabaseController();
        connectionId = loginAndGetConnectionId(request);
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
                        String dbList = testDatabaseController.getDbList(connectionId, request);

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

                        String resp = testDatabaseController.postDbRequest(dbName, "PUT", connectionId, request);

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

                        String resp = testDatabaseController.postDbRequest(dbName, "DELETE", connectionId, request);

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
        logout(connectionId, request);
    }
}
