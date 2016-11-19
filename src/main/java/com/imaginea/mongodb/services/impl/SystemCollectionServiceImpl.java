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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.json.JSONObject;

/**
 * Defines services for performing operations like create/drop on indexes and users which are part
 * of system name space system.users & system.indexes collections inside a database present in mongo
 * to which we are connected to.
 *
 * @author Sanjay Chaluvadi
 */

import com.imaginea.mongodb.domain.MongoConnectionDetails;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.SystemCollectionService;
import com.imaginea.mongodb.utils.ApplicationUtils;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import com.mongodb.client.ListIndexesIterable;
import com.mongodb.client.MongoCursor;

public class SystemCollectionServiceImpl implements SystemCollectionService {
    /**
     * Mongo Instance to communicate with mongo
     */
    private MongoClient mongoInstance;
    private static final AuthService AUTH_SERVICE = AuthServiceImpl.getInstance();

    /**
     * Creates an instance of MongoInstanceProvider which is used to get a mongo instance to perform
     * operations on collections. The instance is created based on a userMappingKey which is recieved
     * from the collection request dispatcher and is obtained from tokenId of user.
     *
     * @param connectionId A combination of username,mongoHost and mongoPort
     */
    public SystemCollectionServiceImpl(String connectionId) throws ApplicationException {
        MongoConnectionDetails mongoConnectionDetails =
                AUTH_SERVICE.getMongoConnectionDetails(connectionId);
        mongoInstance = mongoConnectionDetails.getMongo();
    }

    /**
     * Adds a user to the given database
     *
     * @param dbName   Name of the database
     * @param username Username of the user to be added
     * @param password Password of the usre to be added
     * @param role     optional attribute for creating the user
     * @param dbSource optional attribute for creating the dbSource
     * @return Returns the success message that should be shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String addUser(String dbName, String username, String password, String role, String dbSource)
            throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (username == null) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "Username is null");
        }
        if (username.equals("")) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "Username is empty");
        }
        if (password == null) {
            throw new DatabaseException(ErrorCodes.PASSWORD_IS_EMPTY, "Password is null");
        }
        if (password.equals("")) {
            throw new DatabaseException(ErrorCodes.PASSWORD_IS_EMPTY, "Password is empty");
        }
        try {

            List<Document> roles = new ArrayList<Document>();
            String[] roleSep = role.split(",");
            for (String eachRole : roleSep) {
                roles.add(new Document("role", eachRole).append("db", dbSource));
            }
            mongoInstance.getDatabase(dbName)
                    .runCommand(new Document("createUser", username).append("pwd", password)
                            .append("roles", roles));

        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.USER_CREATION_EXCEPTION, e.getMessage());
        }
        return "User: " + username + " has been added to the DB: " + dbName;
    }

    /**
     * Modifies a user to the given database
     *
     * @param dbName        Name of the database
     * @param username      username of the user being modifies to the database
     * @param password      password of the user being modified to the database
     * @param revokedRoles  The parameter for removedRoles the user roles
     * @param grantNewRoles The parameter for removedRoles the user roles
     * @return Returns the success message that should be shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String modifyUser(String dbName, String username, String password, String revokedRoles, String grantNewRoles, String dbSource)
            throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (username == null) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "Username is null");
        }
        if (username.equals("")) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "Username is empty");
        }
        if (password == null) {
            throw new DatabaseException(ErrorCodes.PASSWORD_IS_EMPTY, "Password is null");
        }
        if (password.equals("")) {
            throw new DatabaseException(ErrorCodes.PASSWORD_IS_EMPTY, "Password is empty");
        }
        try {

            if (username != null && password != null) {
                mongoInstance.getDatabase(dbName)
                        .runCommand(new Document("updateUser", username).append("pwd", password));
            }
            if (revokedRoles != null && revokedRoles.length() > 0) {
                List<Document> roles = new ArrayList<>();
                String[] remRoles = revokedRoles.split(",");
                for (String eachRole : remRoles) {
                    roles.add(new Document("role", eachRole).append("db", dbSource));
                }
                mongoInstance.getDatabase(dbName)
                        .runCommand(new Document("revokeRolesFromUser", username).append("roles", roles));
            }

            if (grantNewRoles != null && grantNewRoles.length() > 0) {
                List<Document> roles = new ArrayList<>();
                String[] newRoles = grantNewRoles.split(",");
                for (String eachRole : newRoles) {
                    roles.add(new Document("role", eachRole).append("db", dbSource));
                }
                mongoInstance.getDatabase(dbName)
                        .runCommand(new Document("grantRolesToUser", username).append("roles", roles));
            }
        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.USER_CREATION_EXCEPTION, e.getMessage());
        }
        return "User: " + username + " has been modified for the DB: " + dbName;
    }

    /**
     * Drops the user from the given mongo db based on the username
     *
     * @param dbName   Name of the database
     * @param username Username of the user to be deleted/dropped
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throwsuper type of UndefinedDatabaseException
     */
    @Override
    public String removeUser(String dbName, String username) throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (username == null) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "Username is null");
        }
        if (username.equals("")) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "Username is empty");
        }
        try {
            Document commandArguments = new Document();
            commandArguments.put("dropUser", username);
            mongoInstance.getDatabase(dbName).runCommand(commandArguments);

        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.USER_DELETION_EXCEPTION, e.getMessage());
        }
        return "User: " + username + " deleted from the DB: " + dbName;
    }

    /**
     * Get all the users from the given mongo db
     *
     * @param dbName Name of the database
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public JSONObject getUsers(String dbName) throws ApplicationException {
        // TODO Auto-generated method stub

        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        try {

            Document document = new Document("usersInfo", 1);
            Document command = mongoInstance.getDatabase(dbName).runCommand(document);
            return ApplicationUtils.constructResponse(false, command);

        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.ANY_OTHER_EXCEPTION, e.getMessage());
        }

    }

    public JSONObject getUsersPrivileges(String dbName, String userName) throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (userName == null) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "User name is null");
        }
        if (userName.equals("")) {
            throw new DatabaseException(ErrorCodes.USERNAME_IS_EMPTY, "User Name Empty");
        }

        try {
            Document doc = new Document();
            Document user = new Document("user", userName).append("db", dbName);
            doc.put("usersInfo", user);
            doc.put("showCredentials", true);
            doc.put("showPrivileges", true);

            //System.out.print(doc.toJson());
            Document comm = mongoInstance.getDatabase(dbName).runCommand(doc);
            return ApplicationUtils.constructResponse(false, comm);
        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.ANY_OTHER_EXCEPTION, e.getMessage());
        }

    }

    /**
     * Drops all the users from the given mongo db
     *
     * @param dbName Name of the database
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String removeAllUsers(String dbName) throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        MongoCursor<Document> users =
                mongoInstance.getDatabase(dbName).getCollection("system.users").find().iterator();
        if (users.hasNext()) {
            while (users.hasNext()) {
                try {
                    Document user = users.next();
                    mongoInstance.getDatabase(dbName).getCollection("system.users").findOneAndDelete(user);
                } catch (MongoException e) {
                    throw new ApplicationException(ErrorCodes.USER_DELETION_EXCEPTION, e.getMessage());
                }
            }
            return "All users are dropped from the DB: " + dbName;
        } else {
            return "The DB:" + dbName + "does not have any users";
        }
    }

    /**
     * Adds an index for a given colleciton in a mongo db
     *
     * @param dbName         Name of the database the index should be added
     * @param collectionName Name of the collection to which the index is to be added
     * @param keys           The keys with the which the index is created
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String addIndex(String dbName, String collectionName, Document keys)
            throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (collectionName == null) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (collectionName.equals("")) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is Empty");
        }
        if (keys == null) {
            throw new DatabaseException(ErrorCodes.KEYS_EMPTY, "Index Keys are null");
        }
        if (keys.equals("")) {
            throw new DatabaseException(ErrorCodes.KEYS_EMPTY, "Index keys are Empty");
        }
        try {

            mongoInstance.getDatabase(dbName).getCollection(collectionName).createIndex(keys);
        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.INDEX_ADDITION_EXCEPTION, e.getMessage());
        }
        return "Index successfully added to the collection: " + dbName + ":" + collectionName;
    }

    /**
     * Updates an index for a given collection in a mongo db
     *
     * @param dbName         Name of the database the index should be updated
     * @param collectionName Name of the collection to which the index is to be updated
     * @param keys           The keys with the which the index is updated
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String updateIndex(String dbName, String collectionName, Document keys)
            throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (collectionName == null) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (collectionName.equals("")) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is Empty");
        }
        if (keys == null) {
            throw new DatabaseException(ErrorCodes.KEYS_EMPTY, "Index Keys are null");
        }
        if (keys.equals("")) {
            throw new DatabaseException(ErrorCodes.KEYS_EMPTY, "Index keys are Empty");
        }
        try {
            for (String keyCurrent : keys.keySet()) {
                if (!((int) keys.get(keyCurrent) == 1 || (int) keys.get(keyCurrent) == -1)) {
                    keys.replace(keyCurrent, -1);
                }
            }

            mongoInstance.getDatabase(dbName).getCollection(collectionName).dropIndexes();
            if (!(keys.isEmpty() || keys == null)) {
                mongoInstance.getDatabase(dbName).getCollection(collectionName).createIndex(keys);
            }
        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.INDEX_UPDATION_EXCEPTION, e.getMessage());
        }
        return "Index successfully updated in the collection: " + dbName + ":" + collectionName;
    }


    /**
     * Gets indexes for a given collection in a mongo db
     *
     * @param dbName         Name of the database the indexes should be listed
     * @param collectionName Name of the collection to which the index is to be listed
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */
    @Override
    public JSONObject getIndex(String dbName, String collectionName)
            throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        if (collectionName == null) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (collectionName.equals("")) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is Empty");
        }
        try {

            ListIndexesIterable<Document> result = mongoInstance.getDatabase(
                    dbName).getCollection(collectionName).listIndexes();
            MongoCursor<Document> iterator = result.iterator();

            List<Document> listOfIndexes = null;
            if (iterator.hasNext()) {
                listOfIndexes = new ArrayList<Document>();
                while (iterator.hasNext()) {
                    Document doc = iterator.next();
                    Document resultDoc = (Document) doc.get("key");
                    listOfIndexes.add(resultDoc);
                }
            }
            return ApplicationUtils
                    .constructResponse(false, listOfIndexes.size(), listOfIndexes);
        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.INDEX_ADDITION_EXCEPTION, e.getMessage());
        }
    }


    /**
     * Removes all the indexes from all the collections in a given mongo db
     *
     * @param dbName Name of the database
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String removeIndexes(String dbName) throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        MongoCursor<String> iterator =
                mongoInstance.getDatabase(dbName).listCollectionNames().iterator();
        if (iterator.hasNext()) {
            while (iterator.hasNext()) {
                String collection = iterator.next();
                try {
                    mongoInstance.getDatabase(dbName).getCollection(collection).dropIndexes();
                } catch (MongoException e) {
                    throw new ApplicationException(ErrorCodes.INDEX_REMOVE_EXCEPTION, e.getMessage());
                }
            }
        }
        return "All indexes are dropped from DB: " + dbName;
    }

    /**
     * Removes an index from the collection based on the index name
     *
     * @param dbName         Name of the database from which the index should be dropped/removed
     * @param collectionName Name of the collection from which the index should be dropped
     * @param indexName      Name of the index that should be deleted
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    @Override
    public String removeIndex(String dbName, String collectionName, String indexName)
            throws ApplicationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        if (collectionName == null) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is null");
        }
        if (collectionName.equals("")) {
            throw new DatabaseException(ErrorCodes.COLLECTION_NAME_EMPTY, "Collection name is Empty");
        }
        if (indexName == null) {
            throw new DatabaseException(ErrorCodes.INDEX_EMPTY, "Index name is null");
        }
        if (indexName.equals("")) {
            throw new DatabaseException(ErrorCodes.INDEX_EMPTY, "Index name is Empty");
        }
        try {
            mongoInstance.getDatabase(dbName).getCollection(collectionName).dropIndex(indexName);
        } catch (MongoException e) {
            throw new ApplicationException(ErrorCodes.INDEX_REMOVE_EXCEPTION, e.getMessage());
        }

        return "Index: " + indexName + " dropped from the collection: " + dbName + ":" + collectionName;
    }

    public String getMongoClientVersion(String dataBaseName) throws ApplicationException {
        String version = "";
        try {
            Document document = new Document();
            document.put("buildInfo", null);
            Document responseFromClient = mongoInstance.getDatabase(dataBaseName).runCommand(document);
            if (responseFromClient != null && responseFromClient.get("version") != null) {
                return responseFromClient.get("version").toString();
            }
            return version;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCodes.JSON_EXCEPTION, exception.getMessage());
        }
    }

}
