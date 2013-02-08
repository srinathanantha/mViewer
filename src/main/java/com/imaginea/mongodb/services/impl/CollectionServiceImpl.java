/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd.
 * Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.imaginea.mongodb.services.impl;

import com.imaginea.mongodb.exceptions.*;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.DatabaseService;
import com.mongodb.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

/**
 * Defines services definitions for performing operations like create/drop on
 * collections inside a database present in mongo to which we are connected to.
 * Also provides service to get list of all collections present and Statistics
 * of a particular collection.
 *
 * @author Srinath Anantha
 */
public class CollectionServiceImpl implements CollectionService {

    private DatabaseService databaseService;
    /**
     * Mongo Instance to communicate with mongo
     */
    private Mongo mongoInstance;

    private static final AuthService AUTH_SERVICE = AuthServiceImpl.getInstance();

    /**
     * Creates an instance of MongoInstanceProvider which is used to get a mongo
     * instance to perform operations on collections. The instance is created
     * based on a userMappingKey which is recieved from the collection request
     * dispatcher and is obtained from tokenId of user.
     *
     * @param connectionId A combination of username,mongoHost and mongoPort
     */
    public CollectionServiceImpl(String connectionId) throws ApplicationException {
        mongoInstance = AUTH_SERVICE.getMongoInstance(connectionId);
        databaseService = new DatabaseServiceImpl(connectionId);
    }

    /**
     * Gets the list of collections present in a database in mongo to which user
     * is connected to.
     *
     * @param dbName Name of database
     * @return List of All Collections present in MongoDb
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of EmptyDatabaseNameException
     * @throws CollectionException exception while performing get list operation on
     *                             collection
     */
    public Set<String> getCollList(String dbName) throws ValidationException, DatabaseException, CollectionException {

        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Is Null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        Set<String> collList = new HashSet<String>();

        try {
            List<String> dbList = databaseService.getDbList();
            if (!dbList.contains(dbName)) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "Database with dbName [ " + dbName + "] does not exist");
            }

            Set<String> collectionList = new HashSet<String>();
            collectionList = mongoInstance.getDB(dbName).getCollectionNames();
            Iterator<String> it = collectionList.iterator();

            while (it.hasNext()) {
                String coll = it.next();
                collList.add(coll);
            }
            //For a newly added database there will be no system.users, So we are manually creating the system.users
            if (collList.contains("system.indexes") && !collList.contains("system.users")) {
                DBObject options = new BasicDBObject();
                mongoInstance.getDB(dbName).createCollection("system.users", options);
                collList.add("system.users");
            }
        } catch (MongoException m) {
            throw new CollectionException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, m.getMessage());
        }
        return collList;

    }

    /**
     * Creates a collection inside a database in mongo to which user is
     * connected to.
     *
     * @param dbName      Name of Database in which to insert a collection
     * @param newCollName Name of Collection to be added/renamed to
     * @param capped      Specify if the collection is capped
     * @param size        Specify the size of collection
     * @param maxDocs     specify maximum no of documents in the collection
     * @return Success if Insertion is successful else throw exception
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException
     * @throws CollectionException throw super type of
     *                             DuplicateCollectionException,InsertCollectionException
     */
    public String insertCollection(String dbName, String newCollName, boolean capped, int size, int maxDocs, boolean autoIndexId) throws DatabaseException, CollectionException, ValidationException {

        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name should be provided");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name cannot be empty");
        }

        if (newCollName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name should be provided");
        }
        if (newCollName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name cannot be empty");
        }
        try {
            if (!databaseService.getDbList().contains(dbName)) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "Db with name [" + dbName + "] doesn't exist.");
            }
            DB db = mongoInstance.getDB(dbName);
            if (db.getCollectionNames().contains(newCollName)) {
                throw new CollectionException(ErrorCodes.COLLECTION_ALREADY_EXISTS, "Collection [" + newCollName + "] already exists in Database [" + dbName + "]");
            }

            DBObject options = new BasicDBObject();
            options.put("capped", capped);
            if (capped) {
                options.put("size", size);
                options.put("max", maxDocs);
                options.put("autoIndexId", autoIndexId);
            }
            mongoInstance.getDB(dbName).createCollection(newCollName, options);
        } catch (MongoException m) {
            throw new CollectionException(ErrorCodes.COLLECTION_CREATION_EXCEPTION, m.getMessage());
        }
        String result = "Collection [" + newCollName + "] was successfully added to Database [" + dbName + "].";
        return result;
    }

    /**
     * Creates a collection inside a database in mongo to which user is
     * connected to.
     *
     * @param dbName                 Name of Database in which to insert a collection
     * @param selectedCollectionName Collection on which the operation is performed
     * @param newCollName            Name of Collection to be added/renamed to
     * @param capped                 Specify if the collection is capped
     * @param size                   Specify the size of collection
     * @param maxDocs                specify maximum no of documents in the collection
     * @return Success if Insertion is successful else throw exception
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException
     * @throws CollectionException throw super type of
     *                             DuplicateCollectionException,InsertCollectionException
     */
    public String updateCollection(String dbName, String selectedCollectionName, String newCollName, boolean capped, int size, int maxDocs, boolean autoIndexId) throws DatabaseException, CollectionException, ValidationException {

        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name should be provided");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name cannot be empty");
        }

        if (selectedCollectionName == null || newCollName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name should be provided");
        }
        if (selectedCollectionName.equals("") || newCollName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name cannot be empty");
        }
        String result = "No updates were specified!";
        try {
            if (!databaseService.getDbList().contains(dbName)) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "Db with name [" + dbName + "] doesn't exist.");
            }

            boolean convertedToCapped = false, convertedToNormal = false, renamed = false;
            DB db = mongoInstance.getDB(dbName);
            DBCollection selectedCollection = db.getCollection(selectedCollectionName);
            if (!selectedCollection.isCapped() && capped) {
                DBObject options = new BasicDBObject();
                options.put("convertToCapped", selectedCollectionName);
                options.put("size", size);
                options.put("max", maxDocs);
                options.put("autoIndexId", autoIndexId);
                CommandResult commandResult = db.command(options);
                String errMsg = (String) commandResult.get("errmsg");
                if (errMsg != null) {
                    return "Failed to convert [" + selectedCollectionName + "] to capped Collection! " + errMsg;
                }
                convertedToCapped = true;
            }

            if (selectedCollection.isCapped() && !capped) {
                DBObject options = new BasicDBObject();
                options.put("capped", false);
                DBCollection tempCollection = db.createCollection(selectedCollectionName + "_temp", options);
                DBCursor cur = selectedCollection.find();
                while (cur.hasNext()) {
                    DBObject obj = cur.next();
                    tempCollection.insert(obj);
                }
                selectedCollection.drop();
                tempCollection.rename(selectedCollectionName);
                convertedToNormal = true;
            }

            if (!selectedCollectionName.equals(newCollName)) {
                if (db.getCollectionNames().contains(newCollName)) {
                    throw new CollectionException(ErrorCodes.COLLECTION_ALREADY_EXISTS, "Collection [" + newCollName + "] already exists in Database [" + dbName + "]");
                }
                selectedCollection = db.getCollection(selectedCollectionName);
                selectedCollection.rename(newCollName);
                renamed = true;
            }
            if ((convertedToNormal || convertedToCapped) && renamed) {
                result = "Collection [" + selectedCollectionName + "] was successfully updated.";
            } else if (convertedToCapped) {
                result = "Collection [" + selectedCollectionName + "] was successfully converted to capped collection";
            } else if (convertedToNormal) {
                result = "Capped Collection [" + selectedCollectionName + "] was successfully converted to normal collection";
            } else if (renamed) {
                result = "Collection [" + selectedCollectionName + "] was successfully renamed to '" + newCollName + "'";
            }
        } catch (MongoException m) {
            throw new CollectionException(ErrorCodes.COLLECTION_UPDATE_EXCEPTION, m.getMessage());
        }
        return result;
    }

    /**
     * Deletes a collection inside a database in mongo to which user is
     * connected to.
     *
     * @param dbName         Name of Database in which to insert a collection
     * @param collectionName Name of Collection to be inserted
     * @return Success if deletion is successful else throw exception
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException
     * @throws CollectionException throw super type of
     *                             UndefinedCollectionException,DeleteCollectionException
     */

    public String deleteCollection(String dbName, String collectionName) throws DatabaseException, CollectionException, ValidationException {

        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (collectionName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (collectionName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection Name Empty");
        }
        try {
            if (!databaseService.getDbList().contains(dbName)) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "DB with name [" + dbName + "]DOES_NOT_EXIST");
            }
            if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {
                throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST, "Collection with name [" + collectionName + "] DOES NOT EXIST in Database [" + dbName + "]");
            }
            mongoInstance.getDB(dbName).getCollection(collectionName).drop();
        } catch (MongoException m) {
            throw new CollectionException(ErrorCodes.COLLECTION_DELETION_EXCEPTION, m.getMessage());
        }
        String result = "Collection [" + collectionName + "] was successfully deleted from Database [" + dbName + "].";

        return result;
    }

    /**
     * Get Statistics of a collection inside a database in mongo to which user
     * is connected to.
     *
     * @param dbName         Name of Database in which to insert a collection
     * @param collectionName Name of Collection to be inserted
     * @return Array of JSON Objects each containing a key value pair in
     *         Collection Stats.
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException
     * @throws CollectionException throw super type of UndefinedCollectionException
     * @throws JSONException       JSON Exception
     */

    public JSONArray getCollStats(String dbName, String collectionName) throws DatabaseException, CollectionException, ValidationException, JSONException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (collectionName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (collectionName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection Name Empty");
        }

        JSONArray collStats = new JSONArray();

        try {
            if (!databaseService.getDbList().contains(dbName)) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "DB with name [" + dbName + "]DOES_NOT_EXIST");
            }
            if (!mongoInstance.getDB(dbName).getCollectionNames().contains(collectionName)) {
                throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST,
                    "Collection with name [" + collectionName + "] DOES NOT EXIST in Database [" + dbName + "]");
            }
            CommandResult stats = mongoInstance.getDB(dbName).getCollection(collectionName).getStats();

            Set<String> keys = stats.keySet();
            Iterator<String> keyIterator = keys.iterator();
            JSONObject temp = new JSONObject();

            while (keyIterator.hasNext()) {
                temp = new JSONObject();
                String key = keyIterator.next().toString();
                temp.put("Key", key);
                String value = stats.get(key).toString();
                temp.put("Value", value);
                String type = stats.get(key).getClass().toString();
                temp.put("Type", type.substring(type.lastIndexOf('.') + 1));
                collStats.put(temp);
            }
        } catch (JSONException e) {
            throw e;
        } catch (MongoException m) {
            throw new CollectionException(ErrorCodes.GET_COLL_STATS_EXCEPTION, m.getMessage());
        }
        return collStats;
    }
}
