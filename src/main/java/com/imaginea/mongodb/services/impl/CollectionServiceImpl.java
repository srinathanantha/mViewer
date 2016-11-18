/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd. Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in
 * writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
package com.imaginea.mongodb.services.impl;

import com.imaginea.mongodb.exceptions.*;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.DatabaseService;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import com.mongodb.MongoNamespace;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoIterable;
import com.mongodb.client.model.CreateCollectionOptions;
import org.bson.Document;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/**
 * Defines services definitions for performing operations like create/drop on collections inside a
 * database present in mongo to which we are connected to. Also provides service to get list of all
 * collections present and Statistics of a particular collection.
 *
 * @author Srinath Anantha
 */
public class CollectionServiceImpl implements CollectionService {

  private DatabaseService databaseService;
  /**
   * Mongo Instance to communicate with mongo
   */
  private MongoClient mongoInstance;

  private static final AuthService AUTH_SERVICE = AuthServiceImpl.getInstance();

  /**
   * Creates an instance of MongoInstanceProvider which is used to get a mongo instance to perform
   * operations on collections. The instance is created based on a userMappingKey which is received
   * from the collection request dispatcher and is obtained from tokenId of user.
   *
   * @param connectionId A combination of username,mongoHost and mongoPort
   */
  public CollectionServiceImpl(String connectionId) throws ApplicationException {
    mongoInstance = AUTH_SERVICE.getMongoInstance(connectionId);
    databaseService = new DatabaseServiceImpl(connectionId);
  }

  /**
   * Gets the list of collections present in a database in mongo to which user is connected to.
   *
   * @param dbName Name of database
   * @return List of All Collections present in MongoDb
   * @throws DatabaseException throw super type of UndefinedDatabaseException
   * @throws CollectionException exception while performing get list operation on collection
   */
  public Set<String> getCollList(String dbName) throws DatabaseException, CollectionException {

    if (dbName == null || dbName.equals("")) {
      throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Invalid Database name");
    }

    try {
      // List<String> dbList = databaseService.getDbList();
      // if (!dbList.contains(dbName)) {
      //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
      //       "Database with dbName [ " + dbName + "] does not exist");
      // }
      MongoIterable<String> listCollectionNames =
          mongoInstance.getDatabase(dbName).listCollectionNames();

      Set<String> collectionList = new HashSet<>();

      MongoCursor<String> iterator = listCollectionNames.iterator();

      while (iterator.hasNext()) {
        
        String colName = iterator.next();
        
        if(colName.contains(".files") || colName.contains(".chunks")){
          continue;
        }
        
        collectionList.add(colName);

      }

      // For a newly added database there will be no system.users, So we
      // are manually creating the system.users
      if (collectionList.contains("system.indexes") && !collectionList.contains("system.users")) {
        mongoInstance.getDatabase(dbName).createCollection("system.users");
        collectionList.add("system.users");
      }
      return collectionList;
    } catch (MongoException m) {
      throw new CollectionException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, m.getMessage());
    }
  }

  /**
   * Creates a collection inside a database in mongo to which user is connected to.
   *
   * @param dbName Name of Database in which to insert a collection
   * @param newCollName Name of Collection to be added/renamed to
   * @param capped Specify if the collection is capped
   * @param size Specify the size of collection
   * @param maxDocs specify maximum no of documents in the collection
   * @return Success if Insertion is successful else throw exception
   * @throws DatabaseException throw super type of UndefinedDatabaseException
   * @throws ValidationException throw super type of
   *         EmptyDatabaseNameException,EmptyCollectionNameException
   * @throws CollectionException throw super type of
   *         DuplicateCollectionException,InsertCollectionException
   */
  public String insertCollection(String dbName, String newCollName, boolean capped, long size,
      int maxDocs, boolean autoIndexId)
      throws DatabaseException, CollectionException, ValidationException {

    if (dbName == null || dbName.equals("")) {
      throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Invalid Database name");
    }
    if (newCollName == null || newCollName.equals("")) {
      throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Invalid Collection name");
    }

    try {
      // if (!databaseService.getDbList().contains(dbName)) {
      //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
      //       "Db with name [" + dbName + "] doesn't exist.");
      // }

      if (getCollList(dbName).contains(newCollName)) {
        throw new CollectionException(ErrorCodes.COLLECTION_ALREADY_EXISTS,
            "Collection [" + newCollName + "] already exists in Database [" + dbName + "]");
      }

      // DBObject options = new BasicDBObject();
      CreateCollectionOptions options = new CreateCollectionOptions();

      options.capped(capped);
      if (capped) {
        options.maxDocuments(maxDocs);
        options.autoIndex(autoIndexId);
        options.sizeInBytes(size);
      }

      mongoInstance.getDatabase(dbName).createCollection(newCollName, options);
    } catch (MongoException m) {
      throw new CollectionException(ErrorCodes.COLLECTION_CREATION_EXCEPTION, m.getMessage());
    }
    return "Collection [" + newCollName + "] was successfully added to Database [" + dbName + "].";
  }

  /**
   * Creates a collection inside a database in mongo to which user is connected to.
   *
   * @param dbName Name of Database in which to insert a collection
   * @param selectedCollectionName Collection on which the operation is performed
   * @param newCollName Name of Collection to be added/renamed to
   * @param capped Specify if the collection is capped
   * @param size Specify the size of collection
   * @param maxDocs specify maximum no of documents in the collection
   * @return Success if Insertion is successful else throw exception
   * @throws DatabaseException throw super type of UndefinedDatabaseException
   * @throws ValidationException throw super type of
   *         EmptyDatabaseNameException,EmptyCollectionNameException
   * @throws CollectionException throw super type of
   *         DuplicateCollectionException,InsertCollectionException
   */
  public String updateCollection(String dbName, String selectedCollectionName, String newCollName,
      boolean capped, long size, int maxDocs, boolean isDbAdmin, boolean autoIndexId)
      throws DatabaseException, CollectionException, ValidationException {

    if (dbName == null || dbName.equals("")) {
      throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Invalid Database name");
    }

    if (selectedCollectionName == null || newCollName == null) {
      throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY,
          "Collection name should be provided");
    }
    if (selectedCollectionName.equals("") || newCollName.equals("")) {
      throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY,
          "Collection name cannot be empty");
    }
    String result = "No updates were specified!";
    try {
      // if (!databaseService.getDbList().contains(dbName)) {
      //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
      //       "Db with name [" + dbName + "] doesn't exist.");
      // }

      boolean convertedToCapped = false, convertedToNormal = false, renamed = false, updated = false;
      boolean isCapped =(boolean)isCappedCollection(dbName, selectedCollectionName).get("capped");
      MongoDatabase db = mongoInstance.getDatabase(dbName);
      MongoCollection<Document> selectedCollection = db.getCollection(selectedCollectionName);
      if(isDbAdmin) {
        Document option = new Document();
        option.put("convertToCapped", selectedCollectionName);
        option.put("size", size);
        option.put("max", maxDocs);
        option.put("autoIndexId", autoIndexId);
        Document commandResult = db.runCommand(option);

        String errMsg = (String) commandResult.get("errmsg");
        if (errMsg != null) {
          return "Failed to convert [" + selectedCollectionName + "] to capped Collection! "
                  + errMsg;
        }
        if((isCapped && capped) || (!isCapped && !capped))
          updated = true;
        else if(!isCapped && capped)
          convertedToCapped = true;
      } else {
        if (capped) {
          CreateCollectionOptions options = new CreateCollectionOptions();
          options.capped(capped);
          options.maxDocuments(maxDocs);
          options.autoIndex(autoIndexId);
          options.sizeInBytes(size);
          createCollection(options, selectedCollection, selectedCollectionName, db);
        } else {
          CreateCollectionOptions options = new CreateCollectionOptions();
          options.capped(capped);
          createCollection(options, selectedCollection, selectedCollectionName, db);
        }
        if((isCapped && capped) || (!isCapped && !capped))
          updated = true;
        else if(!isCapped && capped)
          convertedToCapped = true;
        else if(isCapped && !capped)
          convertedToNormal = true;
      }
      if (!selectedCollectionName.equals(newCollName)) {
        if (getCollList(dbName).contains(newCollName)) {
          throw new CollectionException(ErrorCodes.COLLECTION_ALREADY_EXISTS,
              "Collection [" + newCollName + "] already exists in Database [" + dbName + "]");
        }
        selectedCollection = db.getCollection(selectedCollectionName);

        MongoNamespace mongoNamespace = new MongoNamespace(dbName + "." + newCollName);

        selectedCollection.renameCollection(mongoNamespace);
        renamed = true;
      }
      if (((convertedToNormal || convertedToCapped || updated) && renamed) || updated)  {
        result = "Collection [" + selectedCollectionName + "] was successfully updated.";
      } else if (convertedToCapped) {
        result = "Collection [" + selectedCollectionName
            + "] was successfully converted to capped collection";
      } else if (convertedToNormal) {
        result = "Capped Collection [" + selectedCollectionName
            + "] was successfully converted to normal collection";
      } else if (renamed) {
        result = "Collection [" + selectedCollectionName + "] was successfully renamed to '"
            + newCollName + "'";
      }
    } catch (MongoException m) {
      throw new CollectionException(ErrorCodes.COLLECTION_UPDATE_EXCEPTION, m.getMessage());
    }
    return result;
  }

  private void createCollection(CreateCollectionOptions options, MongoCollection<Document> selectedCollection, String selectedCollectionName,MongoDatabase db) {
    db.createCollection(selectedCollectionName + "_temp", options);
    MongoCollection<Document> tempCollection =
            db.getCollection(selectedCollectionName + "_temp");

    MongoCursor<Document> cur = selectedCollection.find().iterator();
    while (cur.hasNext()) {
      Document obj = cur.next();
      tempCollection.insertOne(obj);
    }
    MongoNamespace namespace = selectedCollection.getNamespace();
    selectedCollection.drop();
    tempCollection.renameCollection(namespace);
  }


  /**
   * Deletes a collection inside a database in mongo to which user is connected to.
   *
   * @param dbName Name of Database in which to insert a collection
   * @param collectionName Name of Collection to be inserted
   * @return Success if deletion is successful else throw exception
   * @throws DatabaseException throw super type of UndefinedDatabaseException
   * @throws ValidationException throw super type of
   *         EmptyDatabaseNameException,EmptyCollectionNameException
   * @throws CollectionException throw super type of
   *         UndefinedCollectionException,DeleteCollectionException
   */

  public String deleteCollection(String dbName, String collectionName)
      throws DatabaseException, CollectionException, ValidationException {

    if (dbName == null || dbName.equals("")) {
      throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Invalid Database name");
    }
    if (collectionName == null || collectionName.equals("")) {
      throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Invalid Collection name");
    }

    try {
      // if (!databaseService.getDbList().contains(dbName)) {
      //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
      //       "DB with name [" + dbName + "]DOES_NOT_EXIST");
      // }
      if (!getCollList(dbName).contains(collectionName)) {
        throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST, "Collection with name ["
            + collectionName + "] DOES NOT EXIST in Database [" + dbName + "]");
      }
      mongoInstance.getDatabase(dbName).getCollection(collectionName).drop();
    } catch (MongoException m) {
      throw new CollectionException(ErrorCodes.COLLECTION_DELETION_EXCEPTION, m.getMessage());
    }
    return "Collection [" + collectionName + "] was successfully deleted from Database [" + dbName
        + "].";
  }

  /**
   * Get Statistics of a collection inside a database in mongo to which user is connected to.
   *
   * @param dbName Name of Database in which to insert a collection
   * @param collectionName Name of Collection to be inserted
   * @return Array of JSON Objects each containing a key value pair in Collection Stats.
   * @throws DatabaseException throw super type of UndefinedDatabaseException
   * @throws ValidationException throw super type of
   *         EmptyDatabaseNameException,EmptyCollectionNameException
   * @throws CollectionException throw super type of UndefinedCollectionException
   * @throws JSONException JSON Exception
   */

  public JSONArray getCollStats(String dbName, String collectionName)
      throws DatabaseException, CollectionException, ValidationException, JSONException {

    if (dbName == null || dbName.equals("")) {
      throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Invalid Database name");
    }
    if (collectionName == null || collectionName.equals("")) {
      throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Invalid Collection name");
    }

    JSONArray collStats = new JSONArray();

    try {
      // if (!databaseService.getDbList().contains(dbName)) {
      //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
      //       "DB with name [" + dbName + "]DOES_NOT_EXIST");
      // }
      if (!getCollList(dbName).contains(collectionName)) {
        throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST, "Collection with name ["
            + collectionName + "] DOES NOT EXIST in Database [" + dbName + "]");
      }
      Document stats =
          mongoInstance.getDatabase(dbName).runCommand(new Document("collStats", collectionName));
      Set<String> keys = stats.keySet();
      Iterator<String> keyIterator = keys.iterator();

      while (keyIterator.hasNext()) {
        JSONObject temp = new JSONObject();
        String key = keyIterator.next();
        temp.put("Key", key);
        String value = stats.get(key).toString();
        temp.put("Value", value);
        String type = stats.get(key).getClass().toString();
        temp.put("Type", type.substring(type.lastIndexOf('.') + 1));
        collStats.put(temp);
      }
    } catch (MongoException m) {
      throw new CollectionException(ErrorCodes.GET_COLL_STATS_EXCEPTION, m.getMessage());
    }
    return collStats;
  }

  @Override
  public JSONObject isCappedCollection(String dbName, String collectionName)
      throws DatabaseException, CollectionException, ValidationException {

    if (dbName == null || dbName.equals("")) {
      throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Invalid Database name");
    }
    if (collectionName == null || collectionName.equals("")) {
      throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Invalid Collection name");
    }

    Document document =
        mongoInstance.getDatabase(dbName).runCommand(new Document("collStats", collectionName));

    JSONObject collectionJSON = new JSONObject();

    boolean isCapped = (Boolean) document.get("capped");
    collectionJSON.put("capped",isCapped);
    if(isCapped) {
      String size = document.get("maxSize").toString();
      String maxDocs = document.get("max").toString();

      collectionJSON.put("size", size);
      collectionJSON.put("maxDocs", maxDocs);
    }
    return collectionJSON;
  }


}
