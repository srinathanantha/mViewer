/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd. Hyderabad, India
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted
 * provided that the following condition is met:
 *
 * + Neither the name of Imaginea, nor the names of its contributors may be used to endorse or
 * promote products derived from this software.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package com.imaginea.mongodb.services;

import com.imaginea.mongodb.controllers.TestingTemplate;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.services.impl.DocumentServiceImpl;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.MongoException;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.CreateCollectionOptions;

import org.apache.log4j.Logger;
import org.bson.Document;
import org.json.JSONObject;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

/**
 * Test all the service functions like create/update/delete documents in collections inside
 * databases present in MongoDb.
 *
 * @author Rachit Mittal
 * @since 16 July 2011
 */

public class DocumentServiceImplTest extends TestingTemplate {

  /**
   * Instance of class to be tested.
   */
  private DocumentService testDocumentService;

  private static HttpServletRequest request = new MockHttpServletRequest();
  private static String connectionId;

  private static Logger logger = Logger.getLogger(DocumentServiceImplTest.class);

  @Before
  public void instantiateTestClass() throws ApplicationException {
    connectionId = loginAndGetConnectionId(request);
    testDocumentService = new DocumentServiceImpl(connectionId);
  }

  /**
   * Tests get documents service to get all documents in a collection inside a database. Here we
   * will create a test document in a collection inside a Database and will check if that document
   * exists in the document list from the service.
   */
  @Test
  public void getDocList() {

    // ArrayList of several test Objects - possible inputs
    List<String> testDbNames = new ArrayList<String>();
    testDbNames.add("random");
    List<String> testCollectionNames = new ArrayList<String>();
    testCollectionNames.add("foo");
    List<Document> testDocumentNames = new ArrayList<>();
    testDocumentNames.add(new Document("p", "q"));

    for (final String dbName : testDbNames) {
      for (final String collectionName : testCollectionNames) {
        for (final Document documentName : testDocumentNames)
          ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
              try {
                MongoCursor<String> iterator =
                    mongoInstance.getDatabase(dbName).listCollectionNames().iterator();
                Set<String> collectionNames = null;
                if (iterator.hasNext()) {
                  collectionNames = new HashSet<>();
                  while (iterator.hasNext()) {
                    collectionNames.add(iterator.next());
                  }
                }
                if (!collectionNames.contains(collectionName)) {
                  // Create Collection first
                  mongoInstance.getDatabase(dbName).createCollection(collectionName);
                }
                mongoInstance.getDatabase(dbName).getCollection(collectionName)
                    .insertOne(documentName);

                // Test with null query and with keys "p"
                Document keys = new Document();
                keys.put("p", 1);

                JSONObject result = testDocumentService.executeQuery(dbName, collectionName, "find",
                    null, "p", "", 0, 0, false);

                ArrayList<Document> documentList = (ArrayList<Document>) result.get("documents");
                boolean flag = false;
                for (Document document : documentList) {
                  for (String key : documentName.keySet()) {
                    if (document.get(key) != null) {
                      assertEquals(document.get(key), documentName.get(key));
                      flag = true;
                    } else {
                      flag = false;
                      break;
                    }
                  }
                }
                if (!flag) {
                  assert (false);
                }
                // Db not populate by test Cases

                mongoInstance.dropDatabase(dbName);
              } catch (MongoException m) // while dropping Db
              {
                throw new ApplicationException(ErrorCodes.QUERY_EXECUTION_EXCEPTION,
                    "Error Testing Document List", m.getCause());
              }
              return null;
            }
          });
      }
    }
  }

  /**
   * Tests insert document service to insert Document in a Collection inside a Database. Here we
   * will create a test document in a collection inside a Database using the service and will check
   * if that document exists in the document list.
   */
  @Test
  public void testInsertDocument() {
    // ArrayList of several test Objects - possible inputs
    List<String> testDbNames = new ArrayList<String>();
    testDbNames.add("random");
    List<String> testCollectionNames = new ArrayList<String>();
    testCollectionNames.add("foo");
    List<Document> testDocumentNames = new ArrayList<>();
    testDocumentNames.add(new Document("test", "test"));

    for (final String dbName : testDbNames) {
      for (final String collectionName : testCollectionNames) {
        for (final Document documentName : testDocumentNames)
          ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
              // Create the collection first in which service will
              // insert
              try {
                MongoCursor<String> iterator =
                    mongoInstance.getDatabase(dbName).listCollectionNames().iterator();
                Set<String> collectionNames = null;
                if (iterator.hasNext()) {
                  collectionNames = new HashSet<>();
                  while (iterator.hasNext()) {
                    collectionNames.add(iterator.next());
                  }
                }
                if (!collectionNames.contains(collectionName)) {
                  CreateCollectionOptions options = new CreateCollectionOptions();
                  mongoInstance.getDatabase(dbName).createCollection(collectionName, options);
                }
                // Insert document
                testDocumentService.insertDocument(dbName, collectionName, documentName);
                List<Document> documentList = new ArrayList<>();
                MongoCursor<Document> cursor = mongoInstance.getDatabase(dbName)
                    .getCollection(collectionName).find().iterator();
                while (cursor.hasNext()) {
                  documentList.add(cursor.next());
                }
                boolean flag = false;
                for (Document document : documentList) {
                  for (String key : documentName.keySet()) {
                    if (document.get(key) != null) {
                      // need to check
                      // assertEquals(document.get(key), documentName.get(key));
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
                mongoInstance.getDatabase(dbName).getCollection(collectionName)
                    .findOneAndDelete(documentName);

              } catch (MongoException m) // while dropping Db
              {
                ApplicationException e =
                    new ApplicationException(ErrorCodes.DOCUMENT_CREATION_EXCEPTION,
                        "Error Testing Document insert", m.getCause());
                throw e;
              }
              return null;
            }
          });
      }
    }
  }

  /**
   * Tests update document service to update Document in a Collection inside a Database. Here we
   * will update a test document in a collection inside a Database using the service and will check
   * if that old document is updated.
   */
  @Test
  public void testUpdateDocument() {
    // ArrayList of several test Objects - possible inputs
    List<String> testDbNames = new ArrayList<String>();
    testDbNames.add("random");
    List<String> testCollectionNames = new ArrayList<String>();
    testCollectionNames.add("foo");
    List<Document> testDocumentNames = new ArrayList<>();
    testDocumentNames.add(new Document("test", "test"));

    for (final String dbName : testDbNames) {
      for (final String collectionName : testCollectionNames) {
        for (final Document documentName : testDocumentNames)
          ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
              try {
                Document newDocument = new Document();
                newDocument.put("test1", "newTest");
                // Create collection first
                if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {

                  DBObject options = new BasicDBObject();
                  mongoInstance.getDB(dbName).createCollection(collectionName, options);
                }
                mongoInstance.getDatabase(dbName).getCollection(collectionName)
                    .insertOne(documentName);
                // get Object id of inserted old document
                Document document = (Document) mongoInstance.getDatabase(dbName)
                    .getCollection(collectionName).find(documentName);
                String docId = JSON.serialize(document.get("_id"));
                newDocument.put("_id", docId);
                testDocumentService.updateDocument(dbName, collectionName, docId, newDocument);
                Document query = new Document("_id", docId);
                MongoCollection<Document> collection =
                    mongoInstance.getDatabase(dbName).getCollection(collectionName);
                document = collection.find(query).first();

                assertNotNull("Updated doc should not be null", document);

                String value = (String) document.get("test");

                assertEquals("Verify update", newDocument.get("test"), value);

                // Delete the document
                mongoInstance.getDatabase(dbName).getCollection(collectionName)
                    .findOneAndDelete(newDocument);

              } catch (MongoException m) // while dropping Db
              {
                ApplicationException e =
                    new ApplicationException(ErrorCodes.DOCUMENT_UPDATE_EXCEPTION,
                        "Error Testing Document update", m.getCause());
                throw e;
              }
              return null;
            }
          });
      }
    }
  }

  /**
   * Tests delete document service to delete document in a Collection inside a Database. Here we
   * will delete a test document in a collection inside a Database using the service and will check
   * if that document exists in the document list.
   */
  @Test
  public void testDeleteDocument() {

    List<String> testDbNames = new ArrayList<String>();
    testDbNames.add("random123");
    List<String> testCollectionNames = new ArrayList<String>();
    testCollectionNames.add("foo1");
    List<Document> testDocumentNames = new ArrayList<>();
    testDocumentNames.add(new Document("test", "test"));

    for (final String dbName : testDbNames) {
      for (final String collectionName : testCollectionNames) {
        for (final Document documentName : testDocumentNames)
          ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
              try {
                // Create a collection and insert document
                MongoCursor<String> iterator =
                    mongoInstance.getDatabase(dbName).listCollectionNames().iterator();
                Set<String> collectionNames = null;
                if (iterator.hasNext()) {
                  collectionNames = new HashSet<>();
                  while (iterator.hasNext()) {
                    collectionNames.add(iterator.next());
                  }
                }
                if (!collectionNames.contains(collectionName)) {

                  CreateCollectionOptions options = new CreateCollectionOptions();
                  mongoInstance.getDatabase(dbName).createCollection(collectionName, options);
                }

                mongoInstance.getDatabase(dbName).getCollection(collectionName)
                    .insertOne(documentName);

                // get Object id of inserted document
                Document document = mongoInstance.getDatabase(dbName).getCollection(collectionName)
                    .find(documentName).first();
                assertNotNull("chk if doc just created is not null", document);

                String docId = JSON.serialize(document.get("_id"));
                assertNotNull("document for that _id not null", docId);

                // Testing if doc exists before delete
                MongoCollection<Document> collection =
                    mongoInstance.getDatabase(dbName).getCollection(collectionName);
                long countBeforeDelete = collection.count();
                testDocumentService.deleteDocument(dbName, collectionName, docId);
                FindIterable<Document> docAfterDelete = collection.find(document);

                assertNull("docAfterDelete should be null if delete was successfull",
                    docAfterDelete);
                long countAfterDelete = collection.count();

                assertEquals("Count reduced after delete or not",
                    (countBeforeDelete - countAfterDelete), 1);

                // Older way of checking.
                // List<DBObject> documentList = new ArrayList<DBObject>();
                //
                // DBCursor cursor =
                // mongoInstance.getDB(dbName).getCollection(collectionName).find();
                // while (cursor.hasNext()) {
                // documentList.add(cursor.next());
                // }
                //
                // boolean flag = false;
                // for (DBObject doc : documentList) {
                // for (String key : documentName.keySet()) {
                // if (doc.get(key) == null) {
                // flag = true;
                // } else {
                // flag = false; // key present
                // break;
                // }
                // }
                // }

              } catch (MongoException m) // while dropping Db
              {
                ApplicationException e =
                    new ApplicationException(ErrorCodes.DOCUMENT_DELETION_EXCEPTION,
                        "Error Testing Document delete", m.getCause());
                throw e;
              }
              return null;
            }
          });
      }
      // mongoInstance.dropDatabase(dbName); //Uncomment incase we need to clean up
    }
  }

  @AfterClass
  public static void destroyMongoProcess() {
    logout(connectionId, request);
  }
}
