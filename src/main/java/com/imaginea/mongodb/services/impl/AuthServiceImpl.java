package com.imaginea.mongodb.services.impl;

import com.imaginea.mongodb.domain.ConnectionDetails;
import com.imaginea.mongodb.domain.MongoConnectionDetails;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.services.AuthService;
import com.mongodb.*;
import com.mongodb.client.MongoDatabase;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * @author Uday Shankar
 */
public class AuthServiceImpl implements AuthService {

    private static AuthService Auth_SERVICE = new AuthServiceImpl();

    private final AtomicLong SUCCESSFUL_CONNECTIONS_COUNT = new AtomicLong();
    private final Map<String, Collection<MongoConnectionDetails>> allConnectionDetails =
            new ConcurrentHashMap<String, Collection<MongoConnectionDetails>>();

    private final int SECONDS = 1000;

    private AuthServiceImpl() {
    }

    @Override
    public String authenticate(ConnectionDetails connectionDetails) throws ApplicationException {
        sanitizeConnectionDetails(connectionDetails);
        String connectionDetailsHashCode = String.valueOf(connectionDetails.hashCode());
        boolean authMode = checkAuthMode(connectionDetails);
        connectionDetails.setAuthMode(authMode);
        if (authMode) {
            String username = connectionDetails.getUsername();
            String pwd = connectionDetails.getPassword();
            String db = connectionDetails.getDbName();
            if (username == null || pwd == null || db == null) {
                throw new ApplicationException(ErrorCodes.NEED_AUTHORISATION,
                        "Mongo DB Running in Auth Mode. Please perform Authentication.");
            }
        }
        Collection<MongoConnectionDetails> mongoConnectionDetailsList =
                allConnectionDetails.get(connectionDetailsHashCode);
        if (mongoConnectionDetailsList != null) {
            for (MongoConnectionDetails mongoConnectionDetails : mongoConnectionDetailsList) {
                if (connectionDetails.equals(mongoConnectionDetails.getConnectionDetails())) {
                    return mongoConnectionDetails.getConnectionId();
                }
            }
        }

        MongoClient mongo = getMongoAndAuthenticate(connectionDetails);

        String connectionId =
                SUCCESSFUL_CONNECTIONS_COUNT.incrementAndGet() + "_" + connectionDetailsHashCode;
        if (mongoConnectionDetailsList == null) {
            mongoConnectionDetailsList = new ArrayList<>(1);
            allConnectionDetails.put(connectionDetailsHashCode, mongoConnectionDetailsList);
        }
        mongoConnectionDetailsList
                .add(new MongoConnectionDetails(connectionDetails, mongo, connectionId));

        return connectionId;
    }

    private boolean checkAuthMode(ConnectionDetails connectionDetails) throws ApplicationException {
        MongoClient mongo = null;
        try {
            mongo = new MongoClient(connectionDetails.getHostIp(), connectionDetails.getHostPort());
            mongo.listDatabaseNames().iterator().next();
            return false;
        }catch (Exception e) {
            if (e instanceof MongoTimeoutException) {
                throw new ApplicationException(ErrorCodes.NEED_AUTHORISATION, "Invalid IP Address or Port");
            }
            return true;
        }finally {
            if (mongo != null) {
                mongo.close();
                mongo = null;
            }
        }
    }

    private MongoClient getMongoAndAuthenticate(ConnectionDetails connectionDetails)
            throws ApplicationException {
        MongoClient mongo = null;
        boolean authModeUi;
        authModeUi = (connectionDetails.getUsername() == null || connectionDetails.getUsername().isEmpty()) ? false : true;
        if (!authModeUi) {
            mongo = new MongoClient(connectionDetails.getHostIp(), connectionDetails.getHostPort());
        }
        String dbName = connectionDetails.getDbName();
        // String[] dbNamesList = dbNames.split(",");
        // dbName will be only one db name
        String username = connectionDetails.getUsername();
        String password = connectionDetails.getPassword();
        dbName = dbName.trim();
        boolean loginStatus = false;
        try {
            if (authModeUi) {
                MongoCredential
                        credential =
                        MongoCredential.createCredential(username, dbName,
                                password.toCharArray());
                mongo =
                        new MongoClient(
                                new ServerAddress(connectionDetails.getHostIp(),
                                        connectionDetails.getHostPort()),
                                java.util.Arrays.asList(credential),
                                MongoClientOptions.builder().serverSelectionTimeout(1*SECONDS).build());
                Iterator iterator = mongo.listDatabaseNames().iterator();

                while (iterator.hasNext()) {
                    if (iterator.next().toString().equals(dbName)) {
                        mongo.getDatabase(dbName).listCollections().iterator();
                        loginStatus = true;
                        break;
                    }
                }
            } else {
                MongoDatabase db = mongo.getDatabase(dbName);
                db.listCollectionNames();
                loginStatus = true;
            }
            // Hack. Checking server connectivity status by fetching collection names on selected db
            // this line will throw exception in two cases.1)On Invalid mongo
            // host Address,2)Invalid authorization to fetch collection names
        } catch (MongoCommandException me) {
            // User is authenticated but user doesn't have sufficient privilges
            loginStatus = true;
        }
        catch (Exception e) {
            String errMsg = e.getMessage();
            if (((MongoTimeoutException) e).getCode() == -3) {
                if (errMsg.contains("Authentication failed")) {
                    errMsg = "Invalid Credentials. Please enter correct combination of Username, password and Database name";
                    throw new ApplicationException(ErrorCodes.NEED_AUTHORISATION, errMsg);
                } else {
                    throw new ApplicationException(ErrorCodes.NEED_AUTHORISATION, "Invalid IP Address or Port");
                }
            } else {
                throw new ApplicationException(ErrorCodes.NEED_AUTHORISATION, errMsg);
            }
        }
        if (loginStatus) {
            connectionDetails.addToAuthenticatedDbNames(dbName);
        }

        if (connectionDetails.getAuthenticatedDbNames().isEmpty()) {
            throw new ApplicationException(
                    ("".equals(username) && "".equals(password))
                            ? ErrorCodes.NEED_AUTHORISATION
                            : ErrorCodes.INVALID_USERNAME,
                    "Invalid combination of username or password or Database name");
        }
        return mongo;
    }

    @Override
    public MongoConnectionDetails getMongoConnectionDetails(String connectionId)
            throws ApplicationException {
        String[] split = connectionId.split("_");
        if (split.length != 2) {
            throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
        }
        String connectionDetailsHashCode = String.valueOf(split[1]);
        Collection<MongoConnectionDetails> mongoConnectionDetailsList =
                allConnectionDetails.get(connectionDetailsHashCode);
        if (mongoConnectionDetailsList == null) {
            throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
        }
        for (MongoConnectionDetails mongoConnectionDetails : mongoConnectionDetailsList) {
            if (connectionId.equals(mongoConnectionDetails.getConnectionId())) {
                return mongoConnectionDetails;
            }
        }
        throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
    }

    @Override
    public MongoClient getMongoInstance(String connectionId) throws ApplicationException {
        String[] split = connectionId.split("_");
        if (split.length != 2) {
            throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
        }
        String connectionDetailsHashCode = String.valueOf(split[1]);
        Collection<MongoConnectionDetails> mongoConnectionDetailsList =
                allConnectionDetails.get(connectionDetailsHashCode);
        if (mongoConnectionDetailsList == null) {
            throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
        }
        for (MongoConnectionDetails mongoConnectionDetails : mongoConnectionDetailsList) {
            if (connectionId.equals(mongoConnectionDetails.getConnectionId())) {
                return mongoConnectionDetails.getMongo();
            }
        }
        throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
    }

    @Override
    public void disconnectConnection(String connectionId) throws ApplicationException {
        String[] split = connectionId.split("_");
        if (split.length != 2) {
            throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
        }
        String connectionDetailsHashCode = String.valueOf(split[1]);
        Collection<MongoConnectionDetails> mongoConnectionDetailsList =
                allConnectionDetails.get(connectionDetailsHashCode);
        if (mongoConnectionDetailsList == null) {
            throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
        }
        Iterator<MongoConnectionDetails> mongoConnectionDetailsIterator =
                mongoConnectionDetailsList.iterator();
        while (mongoConnectionDetailsIterator.hasNext()) {
            MongoConnectionDetails mongoConnectionDetails = mongoConnectionDetailsIterator.next();
            if (connectionId.equals(mongoConnectionDetails.getConnectionId())) {
                mongoConnectionDetailsIterator.remove();
                return;
            }
        }
        throw new ApplicationException(ErrorCodes.INVALID_CONNECTION, "Invalid Connection");
    }

    @Override
    public List listDatabases(String connectionId, String dbName) throws ApplicationException {
        List dbList;
        try {
            dbList = new DatabaseServiceImpl(connectionId).getDbList();
        } catch (DatabaseException e) {
            dbList = new ArrayList();
            dbList.add(dbName);
        }
        return dbList;
    }

    private void sanitizeConnectionDetails(ConnectionDetails connectionDetails) {
        if ("localhost".equals(connectionDetails.getHostIp())) {
            connectionDetails.setHostIp("127.0.0.1");
        }
        String dbNames = connectionDetails.getDbName();
        if (dbNames == null || dbNames.isEmpty()) {
            connectionDetails.setDbName("admin");
        }
    }

    public static AuthService getInstance() {
        return Auth_SERVICE;
    }
}
