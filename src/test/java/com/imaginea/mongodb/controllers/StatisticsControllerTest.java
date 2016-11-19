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

package com.imaginea.mongodb.controllers;

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.CollectionException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.CreateCollectionOptions;

import org.apache.log4j.Logger;
import org.json.JSONException;
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

/**
 * Tests the Statistics request dispatcher resource that provides statistics of Database and
 * Collection.
 *
 * @author Rachit Mittal
 * @since 17 Jul 2011
 */
public class StatisticsControllerTest extends TestingTemplate {

  /**
   * Object of class to be tested
   */
  private StatisticsController testStatisticsController;

  private static HttpServletRequest request = new MockHttpServletRequest();
  private static String connectionId;

  private static Logger logger = Logger.getLogger(StatisticsControllerTest.class);

  @Before
  public void instantiateTestClass() {
    testStatisticsController = new StatisticsController();
    connectionId = loginAndGetConnectionId(request);
  }

  /**
   * Tests the GET Request which gets stats of all databases present in Mongo. Here we construct an
   * empty database first and will test if number of collections in that Db are 0.
   *
   * @throws DatabaseException
   */

  @Test
  public void getdbStatsRequest() throws DatabaseException, JSONException {
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

            // Create an empty Db
            if (dbName != null) {
              if (!dbName.equals("")) {
                MongoCursor<String> iterator = mongoInstance.listDatabaseNames().iterator();

                Set<String> databaseNames = new HashSet<>();

                while (iterator.hasNext()) {
                  databaseNames.add(iterator.next());

                }
                if (databaseNames.contains(dbName)) {
                  mongoInstance.dropDatabase(dbName);
                }

                if (!databaseNames.contains(dbName)) {
                  mongoInstance.getDatabase(dbName).listCollectionNames();
                }
              }
            }

            String resp = testStatisticsController.getDbStats(dbName, connectionId, request);

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
              DBObject response = (BasicDBObject) JSON.parse(resp);
              DBObject result = (BasicDBObject) response.get("response");

              BasicDBList dbStats = (BasicDBList) result.get("result");

              for (int i = 0; i < dbStats.size(); i++) {
                BasicDBObject temp = (BasicDBObject) dbStats.get(i);
                if (temp.get("Key").equals("collections")) {
                  int noOfCollections = Integer.parseInt((String) temp.get("Value"));
                  assertEquals(0, noOfCollections);
                  break;
                }
              }
              mongoInstance.dropDatabase(dbName);
            }
          } catch (MongoException m) {
            ApplicationException e = new ApplicationException(ErrorCodes.GET_DB_LIST_EXCEPTION,
                "GET_DB_LIST_EXCEPTION", m.getCause());
            throw e;
          }
          return null;
        }
      });
    }
  }

  /**
   * Tests the GET Request which gets stats of all collections present in Mongo. Here we construct
   * an empty collection first and will test if number of documents in that collection are 0.
   *
   * @throws CollectionException
   */

  @Test
  public void getCollStatsRequest() throws CollectionException, JSONException {
    // ArrayList of several test Objects - possible inputs
    List<String> testDbNames = new ArrayList<String>();
    // Add some test Cases.
    testDbNames.add("random");
    testDbNames.add("");
    testDbNames.add(null);

    final String testCollName = "test";

    for (final String dbName : testDbNames) {
      TestingTemplate.execute(logger, new ResponseCallback() {
        public Object execute() throws Exception {
          try {
            // Create an empty collection
            if (dbName != null) {
              if (!dbName.equals("")) {

                MongoCursor<String> iterator = mongoInstance.listDatabaseNames().iterator();

                Set<String> databaseNames = new HashSet<>();

                while (iterator.hasNext()) {
                  databaseNames.add(iterator.next());
                }

                if (databaseNames.contains(dbName)) {

                  MongoCursor<String> iterator2 =
                      mongoInstance.getDatabase(dbName).listCollectionNames().iterator();

                  Set<String> collectionNames = new HashSet<>();

                  while (iterator2.hasNext()) {
                    collectionNames.add(iterator2.next());
                  }


                  if (collectionNames.contains(testCollName)) {

                    mongoInstance.getDatabase(dbName).getCollection(testCollName).drop();
                  }

                  CreateCollectionOptions options = new CreateCollectionOptions();
                  mongoInstance.getDatabase(dbName).createCollection(testCollName, options);
                }
              }
            }

            String resp =
                testStatisticsController.getCollStats(dbName, testCollName, connectionId, request);

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
              DBObject response = (BasicDBObject) JSON.parse(resp);
              DBObject result = (BasicDBObject) response.get("response");
              BasicDBList collStats = (BasicDBList) result.get("result");

              for (int i = 0; i < collStats.size(); i++) {
                BasicDBObject temp = (BasicDBObject) collStats.get(i);
                if (temp.get("Key").equals("count")) {
                  int noOfDocuments = Integer.parseInt((String) temp.get("Value"));
                  assertEquals(noOfDocuments, 0);
                  break;
                }
              }

            }

          } catch (MongoException m) {
            throw new ApplicationException(ErrorCodes.GET_COLL_STATS_EXCEPTION, m.getMessage());
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
