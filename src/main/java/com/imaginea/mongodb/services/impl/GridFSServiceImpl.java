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

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import org.bson.BsonObjectId;
import org.bson.BsonValue;
import org.bson.Document;
import org.bson.codecs.BsonValueCodec;
import org.bson.types.ObjectId;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.CollectionException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.DocumentException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.GridFSException;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.imaginea.mongodb.exceptions.ValidationException;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.CollectionService;
import com.imaginea.mongodb.services.DatabaseService;
import com.imaginea.mongodb.services.GridFSService;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;

/**
 * Defines services definitions for performing operations like create/drop on collections inside a
 * database present in mongo to which we are connected to. Also provides service to get list of all
 * collections present and Statistics of a particular file.
 *
 * @author Srinath Anantha
 */
public class GridFSServiceImpl implements GridFSService {

    /**
     * Mongo Instance to communicate with mongo
     */
    private MongoClient mongoInstance;

    private DatabaseService databaseService;
    private CollectionService collectionService;

    private static final AuthService AUTH_SERVICE = AuthServiceImpl.getInstance();
    private static final String FILES_COLLECTION_FIELD_STRING = "_filesCollection";
    private static final String CHUNKS_COLLECTION_FIELD_STRING = "_chunkCollection";

    /**
     * Creates an instance of MongoInstanceProvider which is used to get a mongo instance to perform
     * operations on files. The instance is created based on a userMappingKey which is received from
     * the file request dispatcher and is obtained from tokenId of user.
     *
     * @param connectionId A combination of username,mongoHost and mongoPort
     */
    public GridFSServiceImpl(String connectionId) throws ApplicationException {
        mongoInstance = AUTH_SERVICE.getMongoInstance(connectionId);
        databaseService = new DatabaseServiceImpl(connectionId);
        collectionService = new CollectionServiceImpl(connectionId);
    }


    /**
     * Service implementation for creating GridFS store in the specified database.
     *
     * @param dbName     Name of Database
     * @param bucketName Name of GridFS Bucket
     * @return Status message.
     */
    public String createStore(String dbName, String bucketName)
            throws DatabaseException, CollectionException, GridFSException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Is Null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (bucketName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket name is null");
        }
        if (bucketName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket Name Empty");
        }
        if (getAllBuckets(dbName).contains(bucketName)) {
            throw new CollectionException(ErrorCodes.COLLECTION_ALREADY_EXISTS,
                    "Collection [" + bucketName + "] already exists in Database [" + dbName + "]");
        } else {
            try {


                GridFSBucket gridFSBucket =
                        GridFSBuckets.create(mongoInstance.getDatabase(dbName), bucketName);

                // Get the input stream
                InputStream streamToUploadFrom = new FileInputStream(new File("/home/maheshk/sample.txt"));

                // Create some custom options
                GridFSUploadOptions options = new GridFSUploadOptions().chunkSizeBytes(1024)
                        .metadata(new Document("type", "presentation"));

                ObjectId fileId = gridFSBucket.uploadFromStream("temp-file", streamToUploadFrom, options);

            } catch (MongoException e) {
                throw new GridFSException(ErrorCodes.GRIDFS_CREATION_EXCEPTION, e.getMessage());
            } catch (FileNotFoundException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
            return "GridFS bucket [" + bucketName + "] added to database [" + dbName + "].";
        }
    }

    /**
     * Service implementation for getting the list of files stored in GridFS of specified database.
     *
     * @param dbName     Name of Database
     * @param bucketName Name of GridFS Bucket
     * @param bucketType
     * @param command
     * @param query
     * @param skip
     * @param limit
     * @param sortBy
     * @return JSON representation of list of all files as a String.
     */
    public JSONObject executeQuery(String dbName, String bucketName, String bucketType,
                                   String command, String query, String skip, String limit, String sortBy)
            throws ApplicationException, JSONException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Is Null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (bucketName == null) {
            throw new CollectionException(ErrorCodes.BUCKET_NAME_EMPTY, "Bucket name is null");
        }
        if (bucketName.equals("")) {
            throw new CollectionException(ErrorCodes.BUCKET_NAME_EMPTY, "Bucket Name Empty");
        }
        if (bucketType == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (bucketType.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection Name Empty");
        }
        // if (!databaseService.getDbList().contains(dbName)) {
        //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
        //       "Database with dbName [ " + dbName + "] does not exist");
        // }
        MongoDatabase db = mongoInstance.getDatabase(dbName);

        GridFSBucket gridFS = GridFSBuckets.create(db, bucketName);

        // MongoCollection<Document> filesCollection =
        // getGridFSCollection(gridFS, bucketType);
        try {
            if (command.equals("find")) {
                return executeFind(gridFS, query, sortBy, limit, skip);
            } else if (command.equals("drop")) {
                return executeDrop(db, bucketName);
            } else {
                throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
                        "This command is not supported in GridFS");
            }
        } catch (MongoException e) {
            throw new GridFSException(ErrorCodes.QUERY_EXECUTION_EXCEPTION, e.getMessage());
        }
    }

    private JSONObject executeFind(GridFSBucket gridFS, String query, String sortBy, String limit,
                                   String skip) throws JSONException {
        Document queryObj = Document.parse(query);
        Document sortObj = Document.parse(sortBy);
        int filesLimit = Integer.parseInt(limit);
        int filesSkip = Integer.parseInt(skip);
        long count = 0l;
        // Partial Keys cant be fetched for a file

        MongoCursor<GridFSFile> it =
                gridFS.find(queryObj).sort(sortObj).skip(filesSkip).limit(filesLimit).iterator();

        JSONArray fileList = new JSONArray();
        while (it.hasNext()) {
            GridFSFile fsFile = it.next();
            JSONObject file = new JSONObject();

            file.put("_id", fsFile.getId().asObjectId().getValue());
            file.put("fileName", fsFile.getFilename());
            file.put("length", fsFile.getLength());
            file.put("chunkSize", fsFile.getChunkSize());
            file.put("uploadDate", fsFile.getUploadDate());
            file.put("md5", fsFile.getMD5());
            if (fsFile.getMetadata() != null) {
                file.put("metadata", fsFile.getMetadata());
            }
            fileList.put(file);
        }
        // count of documents must not depend on limit size.
        for (GridFSFile gridFSFile : gridFS.find(queryObj)) {
            count++;
        }
        JSONObject result = new JSONObject();
        result.put("documents", fileList);
        result.put("editable", true);
        result.put("count", count);
        return result;
    }

    private JSONObject executeDrop(MongoDatabase db, String bucketName) throws JSONException {
        db.getCollection(bucketName + ".files").drop();
        db.getCollection(bucketName + ".chunks").drop();
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("success", true);
        return jsonObject;
    }

    // private MongoCollection<Document> getGridFSCollection(GridFSBucket
    // gridFS, String collectionName) throws ApplicationException {
    // String collectionField = null;
    // if (collectionName.equals("files")) {
    // collectionField = FILES_COLLECTION_FIELD_STRING;
    // } else if (collectionName.equals("chunks")) {
    // throw new CollectionException(ErrorCodes.COMMAND_NOT_SUPPORTED, "Commands
    // on chunks are not yet supported");
    // } else {
    // throw new CollectionException(ErrorCodes.COLLECTION_DOES_NOT_EXIST,
    // "Collection does not exist for bucket");
    // }
    // Field field = null;
    // try {
    // field = GridFSBucket.class.getDeclaredField(collectionField);
    // field.setAccessible(true);
    // return (MongoCollection<Document>) field.get(gridFS);
    // } catch (Exception e) {
    // throw new ApplicationException(ErrorCodes.INVALID_ARGUMENT,
    // e.getMessage());
    // }
    // }

    /**
     * Service implementation for retrieving the specified file stored in GridFS.
     *
     * @param dbName     Name of Database
     * @param bucketName Name of GridFS Bucket
     * @param _id        ObjectId of the file to be retrieved
     * @return Requested multipartfile for viewing or download based on 'download' param.
     */
    public File getFile(String dbName, String bucketName, String _id)
            throws ValidationException, DatabaseException, CollectionException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Is Null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        File tempFile = null;
        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,

            //       "Database with dbName [ " + dbName + "] does not exist");
            // }


            ObjectId objectId = new ObjectId(_id);

            MongoDatabase db = mongoInstance.getDatabase(dbName);

            GridFSBucket gridFS = GridFSBuckets.create(db, bucketName);

            Document id = new Document();

            id.put("_id", objectId);

            GridFSFile fsFile = gridFS.find(id).first();

            if (fsFile != null) {

                String tempDir = System.getProperty("java.io.tmpdir");

                tempFile = new File(tempDir + "/" + fsFile.getFilename());

                FileOutputStream streamToDownloadTo = new FileOutputStream(tempFile);

                gridFS.downloadToStream(objectId, streamToDownloadTo);

                streamToDownloadTo.close();

            }

        } catch (MongoException m) {
            throw new CollectionException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, m.getMessage());
        } catch (IOException e) {
            throw new CollectionException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, e.getMessage());
        }
        return tempFile;
    }

    /**
     * Service implementation for uploading a file to GridFS.
     *
     * @param dbName       Name of Database
     * @param bucketName   Name of GridFS Bucket
     * @param formData     formDataBodyPart of the uploaded file
     * @param inputStream  inputStream of the uploaded file
     * @param connectionId ConnectionId of the connection
     * @return Success message with additional file details such as name, size, download url &
     * deletion url as JSON Array string.
     */
    public JSONArray insertFile(String dbName, String bucketName, String connectionId,
                                InputStream inputStream, FormDataContentDisposition fileData) throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (bucketName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket name is null");
        }
        if (bucketName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket Name Empty");
        }

        JSONArray result = new JSONArray();

        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }

            MongoDatabase db = mongoInstance.getDatabase(dbName);

            GridFSBucket gridFS = GridFSBuckets.create(db, bucketName);


            GridFSUploadOptions options = new GridFSUploadOptions().chunkSizeBytes(1024)
                    .metadata(new Document("type", "presentation"));

            ObjectId fileId = gridFS.uploadFromStream(fileData.getFileName(), inputStream, options);

            String objectId = JSON.serialize(fileId);
            JSONObject obj = new JSONObject();
            obj.put("name", fileData.getFileName());
            // obj.put("size", fileData.);
            obj.put("url",
                    String.format("services/%s/%s/gridfs/getfile?id=%s&download=%s&connectionId=%s&ts=%s",
                            dbName, bucketName, objectId, false, connectionId, new Date()));
            obj.put("delete_url",
                    String.format("services/%s/%s/gridfs/dropfile?id=%s&connectionId=%s&ts=%s", dbName,
                            bucketName, objectId, connectionId, new Date().getTime()));
            obj.put("delete_type", "GET");
            result.put(obj);

        } catch (MongoException e) {
            throw new CollectionException(ErrorCodes.UPLOAD_FILE_EXCEPTION, e.getMessage());
        } catch (JSONException e) {
            throw new ApplicationException(ErrorCodes.JSON_EXCEPTION, "Error creating json response obj",
                    e.getCause());
        }
        return result;
    }

    /**
     * Service implementation for dropping a file from GridFS.
     *
     * @param dbName     Name of Database
     * @param bucketName Name of GridFS Bucket
     * @param _id        Object id of file to be deleted
     * @return Status message.
     */
    public String deleteFile(String dbName, String bucketName, String _id)
            throws DatabaseException, DocumentException, CollectionException, ValidationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (bucketName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket name is null");
        }
        if (bucketName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket Name Empty");
        }

        String result = null;
        GridFSFile gridFSFile = null;
        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }
            if (_id == null) {
                throw new DocumentException(ErrorCodes.DOCUMENT_EMPTY, "File is empty");
            }


            ObjectId objectId = new ObjectId(_id);

            MongoDatabase db = mongoInstance.getDatabase(dbName);

            GridFSBucket gridFS = GridFSBuckets.create(db, bucketName);

            Document id = new Document();

            id.put("_id", objectId);

            gridFSFile = gridFS.find(id).first();
            if (gridFSFile == null) {
                throw new DocumentException(ErrorCodes.DOCUMENT_DOES_NOT_EXIST,
                        "Document does not exist !");
            }

            gridFS.delete(objectId);

        } catch (MongoException e) {
            throw new DocumentException(ErrorCodes.DOCUMENT_DELETION_EXCEPTION, e.getMessage());
        }
        result = "File [" + gridFSFile.getFilename() + "] has been deleted.";
        return result;
    }

    @Override
    public Set<String> getAllBuckets(String dbName) throws DatabaseException, CollectionException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        // if (!databaseService.getDbList().contains(dbName)) {
        //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
        //       "DB [" + dbName + "] DOES NOT EXIST");
        // }

        MongoCursor<String> iterator =
                mongoInstance.getDatabase(dbName).listCollectionNames().iterator();

        Set<String> bucketsList = new HashSet<String>();
        if (iterator.hasNext()) {
            while (iterator.hasNext()) {

                String collection = iterator.next();

                int pos = collection.lastIndexOf(".files");
                if (pos > 0) {
                    bucketsList.add(collection.substring(0, pos));
                }
            }
        }
        return bucketsList;
    }

    /**
     * Service implementation for dropping all files from a GridFS bucket.
     *
     * @param dbName     Name of Database
     * @param bucketName Name of GridFS Bucket
     * @return Status message.
     */
    public String dropBucket(String dbName, String bucketName) throws DatabaseException,
            DocumentException, CollectionException, ValidationException, JSONException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (bucketName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket name is null");
        }
        if (bucketName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket Name Empty");
        }

        String result = null;
        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }
            executeDrop(mongoInstance.getDatabase(dbName), bucketName);
        } catch (MongoException e) {
            throw new DocumentException(ErrorCodes.DOCUMENT_DELETION_EXCEPTION, e.getMessage());
        }
        result = "Bucket [" + bucketName + "] has been deleted from Database [" + dbName + "].";
        return result;
    }

    /**
     * Service handler for getting count of all files in a GridFS bucket.
     *
     * @param dbName     Name of Database
     * @param bucketName Name of GridFS Bucket
     * @return Status message.
     */
    public JSONObject getCount(String dbName, String bucketName)
            throws DatabaseException, DocumentException, ValidationException, CollectionException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (bucketName == null) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket name is null");
        }
        if (bucketName.equals("")) {
            throw new CollectionException(ErrorCodes.COLLECTION_NAME_EMPTY, "Bucket Name Empty");
        }

        JSONObject result = new JSONObject();
        try {
            // if (!databaseService.getDbList().contains(dbName)) {
            //   throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS,
            //       "DB [" + dbName + "] DOES NOT EXIST");
            // }

            long count = mongoInstance.getDB(dbName).getCollection(bucketName + ".files").count();
            result.put("count", count);

        } catch (Exception e) {
            throw new DocumentException(ErrorCodes.GET_COLLECTION_LIST_EXCEPTION, e.getMessage());
        }
        return result;
    }


}
