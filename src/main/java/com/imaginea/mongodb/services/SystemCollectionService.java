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
package com.imaginea.mongodb.services;

/**
 * Defines services for performing operations like create/drop on indexes and users which
 * are part of system name space system.users & system.indexes collections
 * inside a database present in mongo to which we are connected to.
 * @author Sanjay Chaluvadi
 */

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.mongodb.DBObject;


public interface SystemCollectionService {

    /**
     * Adds a user to the given database
     *
     * @param dbName   Name of the database
     * @param username Username of the user to be added
     * @param password Password of the usre to be added
     * @param readOnly optional attribute for creating the user
     * @return Returns the success message that should be shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    public String addUser(String dbName, String username, String password, boolean readOnly) throws ApplicationException;

    /**
     * Drops the user from the given mongo db based on the username
     *
     * @param dbName   Name of the database
     * @param username Username of the user to be deleted/dropped
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throwsuper type of UndefinedDatabaseException
     */

    public String removeUser(String dbName, String username) throws ApplicationException;

    /**
     * Drops all the users from the given mongo db
     *
     * @param dbName Name of the database
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    public String removeAllUsers(String dbName) throws ApplicationException;

    /**
     * Adds an index for a given colleciton in a mongo db
     *
     * @param dbName         Name of the database the index should be added
     * @param collectionName Name of the collection to which the index is to be added
     * @param keys           The keys with the which the index is created
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */

    public String addIndex(String dbName, String collectionName, DBObject keys) throws ApplicationException;

    /**
     * Removes all the indexes from all the collections in a given mongo db
     *
     * @param dbName Name of the database
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */
    public String removeIndexes(String dbName) throws ApplicationException;

    /**
     * Removes an index from the collection based on the index name
     *
     * @param dbName         Name of the database from which the index should be dropped/removed
     * @param collectionName Name of the collection from which the index should be dropped
     * @param indexName      Name of the index that should be deleted
     * @return Returns the success message that shown to the user
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */
    public String removeIndex(String dbName, String collectionName, String indexName) throws ApplicationException;
}
