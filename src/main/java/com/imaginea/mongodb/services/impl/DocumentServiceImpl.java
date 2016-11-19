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

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.CollectionException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.DocumentException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.ValidationException;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.DatabaseService;
import com.imaginea.mongodb.services.DocumentService;
import com.imaginea.mongodb.utils.JSON;
import com.imaginea.mongodb.utils.QueryExecutor;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;

/**
 * Defines services definitions for performing operations like create/update/delete on documents
 * inside a collection in a database present in mongo to which we are connected to. Also provides
 * service to get list of all documents present.
 *
 * @author Srinath Anantha
 */

public class DocumentServiceImpl implements DocumentService {
    /**
     * Mongo Instance to communicate with mongo
     */
    private MongoClient mongoInstance;
    private DatabaseService databaseService;
    private CollectionService collectionService;

    private static final AuthService AUTH_SERVICE = AuthServiceImpl.getInstance();

    /**
     * Creates an instance of MongoInstanceProvider which is used to get a mongo instance to perform
     * operations on documents. The instance is created based on a userMappingKey which is received
     * from the database request dispatcher and is obtained from tokenId of user.
     *
     * @param connectionId A combination of username,mongoHost and mongoPort
     */
    public DocumentServiceImpl(String connectionId) throws ApplicationException {
        mongoInstance = AUTH_SERVICE.getMongoInstance(connectionId);
        databaseService = new DatabaseServiceImpl(connectionId);
        collectionService = new CollectionServiceImpl(connectionId);
    }

    /**
     * Gets the list of documents inside a collection in a database in mongo to which user is
     * connected to.
     *
     * @param dbName         Name of Database
     * @param collectionName Name of Collection from which to get all Documents
     * @param command        Name of the Command to be executed
     * @param queryStr       query to be performed. In case of empty query {} return all
     * @param keys           Keys to be present in the resulted docs.
     * @param limit          Number of docs to show.
     * @param skip           Docs to skip from the front.
     * @param allKeys
     * @return List of all documents.
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException
     * @throws CollectionException throw super type of UndefinedCollectionException
     * @throws DocumentException   exception while performing get doc list
     */

    public JSONObject executeQuery(String dbName, String collectionName, String command,
                                   String queryStr, String keys, String sortBy, int limit, int skip, boolean allKeys)
            throws ApplicationException, CollectionException, DocumentException, ValidationException,
            JSONException {

        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        try {
            // List<String> databaseNames = databaseService.getDbList();
            // if (!databaseNames.contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB with name [" + dbName + "]DOES_NOT_EXIST");
            // }
            MongoDatabase db = mongoInstance.getDatabase(dbName);
            if (collectionName == null) {
                throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
            }
            if (collectionName.equals("")) {
                throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection Name Empty");
            }
            if (!collectionService.getCollList(dbName).contains(collectionName)) {
                throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST, "Collection with name ["
                        + collectionName + "] DOES NOT EXIST in Database [" + dbName + "]");
            }

            MongoCollection<Document> collection = db.getCollection(collectionName);
            JSONObject jsonObject = QueryExecutor.executeQuery(db, collection, collectionName, command, queryStr, keys,
                    sortBy, limit, skip, allKeys);
            processComplexQuery(dbName, queryStr, db, jsonObject);
            return jsonObject;
        } catch (MongoException e) {
            throw new DocumentException(ErrorCodes.QUERY_EXECUTION_EXCEPTION, e.getMessage());
        }
    }

    /**
     * Insert a document inside a collection in a database in mongo to which user is connected to.
     *
     * @param dbName         Name of Database
     * @param collectionName Name of Collection from which to get all Documents
     * @param document       : Document data to be inserted
     * @return : Insertion Status
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException ,EmptyDocumentDataException
     * @throws CollectionException throw super type of UndefinedCollectionException
     * @throws DocumentException   throw super type of InsertDocumentException
     */

    public String insertDocument(String dbName, String collectionName, Document document)
            throws DatabaseException, CollectionException, DocumentException, ValidationException {
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

        String result = null;
        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }

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
                throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST,
                        "COLLECTION [ " + collectionName + "] _DOES_NOT_EXIST in Db [ " + dbName + "]");
            }

            // MongoDb permits Duplicate document Insert
            mongoInstance.getDatabase(dbName).getCollection(collectionName).insertOne(document);
            result = "Inserted Document with Data : [" + document + "]";
        } catch (MongoException e) {
            throw new DocumentException(ErrorCodes.DOCUMENT_CREATION_EXCEPTION, e.getMessage());
        }
        return result;
    }

    /**
     * Updates a document inside a collection in a database in mongo to which user is connected to.
     *
     * @param dbName         Name of Database
     * @param collectionName Name of Collection from which to get all Documents
     * @param _id            Id of Document to be updated
     * @param newData        new Document value.
     * @return Update status
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException ,EmptyDocumentDataException
     * @throws CollectionException throw super type of UndefinedCollectionException
     * @throws DocumentException   throw super type of UpdateDocumentException
     */

    public String updateDocument(String dbName, String collectionName, String _id, Document newData)
            throws DatabaseException, CollectionException, DocumentException, ValidationException {

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
        String result = null;

        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }

            if (!collectionService.getCollList(dbName).contains(collectionName)) {
                throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST,
                        "COLLECTION [ " + collectionName + "] _DOES_NOT_EXIST in Db [ " + dbName + "]");
            }
            if (_id == null) {
                throw new DocumentException(ErrorCodes.DOCUMENT_EMPTY, "Document is empty");
            }

            String newId = (String) newData.get("_id");


            if (newId == null) {
                throw new DocumentException(ErrorCodes.INVALID_OBJECT_ID, "Object Id is invalid.");
            }
            if (newId.equals("")) {
                throw new DocumentException(ErrorCodes.INVALID_OBJECT_ID, "Object Id is invalid.");
            }


            ObjectId docId = new ObjectId(_id);

            if (!newId.equals(_id)) {
                throw new DocumentException(ErrorCodes.UPDATE_OBJECT_ID_EXCEPTION,
                        "_id cannot be updated.");
            }

            MongoCollection<Document> collection =
                    mongoInstance.getDatabase(dbName).getCollection(collectionName);


            Document document = collection.find(Filters.eq("_id", docId)).first();

            if (document != null) {

                ObjectId objectId = document.getObjectId("_id");

                newData.put("_id", objectId);

                Document updateData = new Document("$set", newData);
                collection.updateOne(Filters.eq("_id", objectId), updateData);

            } else {
                throw new DocumentException(ErrorCodes.DOCUMENT_DOES_NOT_EXIST,
                        "Document does not exist !");
            }

        } catch (IllegalArgumentException e) {
            // When error converting object Id

            throw new DocumentException(ErrorCodes.INVALID_OBJECT_ID, "Object Id is invalid.");

        } catch (MongoException e) {
            throw new DocumentException(ErrorCodes.DOCUMENT_UPDATE_EXCEPTION, e.getMessage());
        }
        result = "Document: [" + newData + "] has been updated.";

        return result;
    }

    /**
     * Deletes a document inside a collection in a database in mongo to which user is connected to.
     *
     * @param dbName         Name of Database
     * @param collectionName Name of Collection from which to get all Documents
     * @param _id            Id of Document to be updated
     * @return Deletion status
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException ,EmptyDocumentDataException
     * @throws CollectionException throw super type of UndefinedCollectionException
     * @throws DocumentException   throw super type of DeleteDocumentException
     */

    public String deleteDocument(String dbName, String collectionName, String _id)
            throws DatabaseException, CollectionException, DocumentException, ValidationException {
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

        String result = null;
        Document documentData = null;
        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }

            if (!collectionService.getCollList(dbName).contains(collectionName)) {
                throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST,
                        "COLLECTION [ " + collectionName + "] _DOES_NOT_EXIST in Db [ " + dbName + "]");
            }


            boolean cappedCollection = (boolean) collectionService.isCappedCollection(dbName, collectionName).get("capped");

            if (cappedCollection) {
                throw new DocumentException(ErrorCodes.DELETING_FROM_CAPPED_COLLECTION,
                        "Cannot Delete From a Capped Collection");
            }
            if (_id == null) {
                throw new DocumentException(ErrorCodes.DOCUMENT_EMPTY, "Document is empty");
            }

            Document query = new Document();

            ObjectId docId = new ObjectId(_id);

            query.put("_id", docId);

            MongoCollection<Document> collection =
                    this.mongoInstance.getDatabase(dbName).getCollection(collectionName);
            documentData = collection.find(query).first();

            if (documentData == null) {
                throw new DocumentException(ErrorCodes.DOCUMENT_DOES_NOT_EXIST,
                        "Document does not exist !");
            }

            DeleteResult deleteOne =
                    mongoInstance.getDatabase(dbName).getCollection(collectionName).deleteOne(query);

        } catch (MongoException e) {
            throw new DocumentException(ErrorCodes.DOCUMENT_DELETION_EXCEPTION, e.getMessage());
        }
        result = "Document with Data : [" + documentData + "] has been deleted.";
        return result;
    }

    private void processComplexQuery(String dbName, String queryStr, MongoDatabase db, JSONObject jsonObject) throws DatabaseException, CollectionException, DocumentException {
        // if the query string contains complex query like : forEach( function(x){db.targetTest.insert(x)} ); get the function part of the string
        if (queryStr.contains("forEach")) {
            if (queryStr.contains("function")) {
                String postQueryString = queryStr.substring(queryStr.indexOf("function("));
                int functionStartIndex = postQueryString.indexOf('{') + 1; // +1 to discard { in the string
                int functionLastIndex = postQueryString.lastIndexOf('}');
                String functionString = postQueryString.substring(functionStartIndex, functionLastIndex);
                // function string looks like : db.targetTest.insert(x)
                if (functionString.contains("insert") && functionString.contains(".")) {
                    String newCollectionName = functionString.split("\\.")[1];
                    // If collection doesn't exist, create new one .. else insert into existing collection
                    if (!collectionService.getCollList(dbName).contains(newCollectionName)) {
                        db.createCollection(newCollectionName);
                        insertIntoTargetCollection(db, jsonObject, newCollectionName);
                    } else
                        insertIntoTargetCollection(db, jsonObject, newCollectionName);
                    //jsonObject.put("complexQueryMessage", "Successfully copied the documents to "+newCollectionName+" collection");
                }
            } else
                throw new DocumentException(ErrorCodes.INVALID_QUERY, "Invalid Query specified. Please verify the syntax");
        }
    }

    private void insertIntoTargetCollection(MongoDatabase db, JSONObject jsonObject, String newCollectionName) {
        MongoCollection<Document> targetCollection = db.getCollection(newCollectionName);
        if (jsonObject.has("documents")) {
            JSONArray jsonArray = (JSONArray) jsonObject.get("documents");
            jsonArray.forEach(obj -> {
                JSONObject eachDocument = (JSONObject) obj;
                targetCollection.insertOne(Document.parse(eachDocument.toString()));
            });
        }
    }
}
