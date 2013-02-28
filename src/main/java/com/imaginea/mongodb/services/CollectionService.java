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

import com.imaginea.mongodb.exceptions.CollectionException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.ValidationException;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.Set;

/**
 * Defines services for performing operations like create/drop on collections
 * inside a database present in mongo to which we are connected to. Also
 * provides service to get list of all collections present and Statistics of a
 * particular collection.
 *
 * @author Srinath Anantha
 */
public interface CollectionService {

    /**
     * Gets the list of collections present in a database in mongo to which user
     * is connected to.
     *
     * @param dbName Name of database
     * @return List of All Collections present in MongoDb
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws CollectionException exception while performing get list operation on
     *                             collection
     */

    public Set<String> getCollList(String dbName) throws DatabaseException, CollectionException;

    /**
     * Creates a collection inside a database in mongo to which user is
     * connected to.
     *
     * @param dbName      Name of Database in which to insert a collection
     * @param newCollName New collection name
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
    public String insertCollection(String dbName, String newCollName, boolean capped, int size, int maxDocs, boolean autoIndexId) throws DatabaseException, CollectionException, ValidationException;

    /**
     * Creates a collection inside a database in mongo to which user is
     * connected to.
     *
     * @param dbName             Name of Database in which to insert a collection
     * @param selectedCollection Collection on which the operation is performed
     * @param newCollName        New collection name
     * @param capped             Specify if the collection is capped
     * @param size               Specify the size of collection
     * @param maxDocs            specify maximum no of documents in the collection
     * @return Success if Insertion is successful else throw exception
     * @throws DatabaseException   throw super type of UndefinedDatabaseException
     * @throws ValidationException throw super type of
     *                             EmptyDatabaseNameException,EmptyCollectionNameException
     * @throws CollectionException throw super type of
     *                             DuplicateCollectionException,InsertCollectionException
     */
    public String updateCollection(String dbName, String selectedCollection, String newCollName, boolean capped, int size, int maxDocs, boolean autoIndexId) throws DatabaseException, CollectionException, ValidationException;

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

    public String deleteCollection(String dbName, String collectionName) throws DatabaseException, CollectionException, ValidationException;

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

    public JSONArray getCollStats(String dbName, String collectionName) throws DatabaseException, CollectionException, ValidationException, JSONException;
}
