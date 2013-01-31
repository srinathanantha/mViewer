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
import com.imaginea.mongodb.exceptions.DocumentException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.utils.ConfigMongoInstanceProvider;
import com.imaginea.mongodb.utils.JSON;
import com.imaginea.mongodb.utils.MongoInstanceProvider;
import com.mongodb.*;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.json.JSONException;
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
 * Tests the document request dispatcher resource that handles the GET and POST
 * request for documents present in Mongo. Tests the get and post functions
 * metioned in the resource with dummy request and test document and collection
 * names and check the functionality.
 *
 * @author Rachit Mittal
 * @since 16 Jul 2011
 */
public class DocumentControllerTest extends BaseController {

    private MongoInstanceProvider mongoInstanceProvider;
    private static Mongo mongoInstance;
    /**
     * Object of class to be tested
     */
    private DocumentController testDocResource;

    /**
     * Logger object
     */
    private static Logger logger = Logger.getLogger(DocumentControllerTest.class);
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
    public DocumentControllerTest() {
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
        testDocResource = new DocumentController();
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
        LoginController loginController = new LoginController();

        // Add user to mappings in userLogin for authentication
        String response = loginController.authenticateUser("admin", "admin", "localhost", "27017", null, request);
        BasicDBObject responseObject = (BasicDBObject) JSON.parse(response);
        connectionId = (String) ((BasicDBObject) responseObject.get("response")).get("connectionId");
    }

    /**
     * Tests the GET Request which gets names of all documents present in Mongo.
     * Here we construct the test document first and will test if this created
     * document is present in the response of the GET Request made. If it is,
     * then tested ok.
     */

    @Test
    public void getDocRequest() throws DocumentException, JSONException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        List<String> testCollNames = new ArrayList<String>();
        testCollNames.add("foo");
        testCollNames.add("");

        List<DBObject> testDocumentNames = new ArrayList<DBObject>();
        testDocumentNames.add(new BasicDBObject("test", "test"));

        for (final String dbName : testDbNames) {
            for (final String collName : testCollNames) {
                for (final DBObject documentName : testDocumentNames)
                    TestingTemplate.execute(logger, new ResponseCallback() {
                        public Object execute() throws Exception {
                            try {
                                if (dbName != null && collName != null) {
                                    if (!dbName.equals("") && !collName.equals("")) {
                                        if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collName)) {
                                            DBObject options = new BasicDBObject();
                                            mongoInstance.getDB(dbName).createCollection(collName, options);
                                        }

                                        mongoInstance.getDB(dbName).getCollection(collName).insert(documentName);
                                    }
                                }

                                String fields = "test,_id";

                                String docList = testDocResource.executeQuery(dbName, collName, "db." + collName + ".find()", connectionId, fields, "100", "0", "", request);

                                DBObject response = (BasicDBObject) JSON.parse(docList);

                                if (dbName == null) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                                } else if (dbName.equals("")) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                                } else {
                                    if (collName == null) {
                                        DBObject error = (BasicDBObject) response.get("response");
                                        String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                        assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);

                                    } else if (collName.equals("")) {
                                        DBObject error = (BasicDBObject) response.get("response");
                                        String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                        assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);// DB
                                        // exists
                                    } else {
                                        DBObject result = (BasicDBObject) response.get("response");
                                        BasicDBList docs = ((BasicDBList) result.get("result"));
                                        for (int index = 0; index < docs.size(); index++) {
                                            DBObject doc = (BasicDBObject) docs.get(index);
                                            if (doc.get("test") != null) {
                                                assertEquals(doc.get("test"), documentName.get("test"));
                                                break;
                                            }

                                        }
                                        mongoInstance.dropDatabase(dbName);
                                    }
                                }

                            } catch (MongoException m) {
                                ApplicationException e = new ApplicationException(ErrorCodes.GET_DOCUMENT_LIST_EXCEPTION, "GET_DOCUMENT_LIST_EXCEPTION", m.getCause());
                                throw e;
                            }
                            return null;
                        }
                    });
            }
        }
    }

    /**
     * Tests the POST Request which create document in Mongo Db. Here we
     * construct the Test document using service first and then will check if
     * that document exists in the list.
     *
     * @throws DocumentException
     */
    @Test
    public void createDocRequest() throws DocumentException {

        // ArrayList of several test Objects - possible inputs
        List<String> testDbNames = new ArrayList<String>();
        // Add some test Cases.
        testDbNames.add("random");
        testDbNames.add("");
        testDbNames.add(null);

        List<String> testCollNames = new ArrayList<String>();
        testCollNames.add("foo");
        testCollNames.add("");

        List<DBObject> testDocumentNames = new ArrayList<DBObject>();
        testDocumentNames.add(new BasicDBObject("test", "test"));
        for (final String dbName : testDbNames) {
            for (final String collName : testCollNames) {
                for (final DBObject documentName : testDocumentNames)
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

                                String resp = testDocResource.postDocsRequest(dbName, collName, "PUT", documentName.toString(), null, null, connectionId, request);
                                DBObject response = (BasicDBObject) JSON.parse(resp);

                                if (dbName == null) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.DB_NAME_EMPTY, code);

                                } else if (dbName.equals("")) {
                                    DBObject error = (BasicDBObject) response.get("response");
                                    String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                    assertEquals(ErrorCodes.DB_NAME_EMPTY, code);
                                } else {
                                    if (collName == null) {
                                        DBObject error = (BasicDBObject) response.get("response");
                                        String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                        assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);

                                    } else if (collName.equals("")) {
                                        DBObject error = (BasicDBObject) response.get("response");
                                        String code = (String) ((BasicDBObject) error.get("error")).get("code");
                                        assertEquals(ErrorCodes.COLLECTION_NAME_EMPTY, code);// DB
                                        // exists
                                    } else {
                                        List<DBObject> documentList = new ArrayList<DBObject>();

                                        DBCursor cursor = mongoInstance.getDB(dbName).getCollection(collName).find();
                                        while (cursor.hasNext()) {
                                            documentList.add(cursor.next());
                                        }

                                        boolean flag = false;
                                        for (DBObject document : documentList) {
                                            for (String key : documentName.keySet()) {
                                                if (document.get(key) != null) {
                                                    assertEquals(document.get(key), documentName.get(key));
                                                    flag = true;
                                                } else {
                                                    flag = false;
                                                    break; // break from inner
                                                }
                                            }
                                        }
                                        if (!flag) {
                                            assert (false);
                                        }
                                        // Delete the document
                                        mongoInstance.getDB(dbName).getCollection(collName).remove(documentName);
                                    }
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
    }

    // TODO Test update and delete doc
    @AfterClass
    public static void destroyMongoProcess() {
        mongoInstance.close();
    }
}
