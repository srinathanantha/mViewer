package com.imaginea.mongodb.services;

import com.imaginea.mongodb.domain.ConnectionDetails;
import com.imaginea.mongodb.domain.MongoConnectionDetails;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.mongodb.MongoClient;

import java.util.List;

/**
 * @author Uday Shankar
 */
public interface AuthService {

  String authenticate(ConnectionDetails connectionDetails) throws ApplicationException;

  MongoConnectionDetails getMongoConnectionDetails(String connectionId) throws ApplicationException;

  MongoClient getMongoInstance(String connectionId) throws ApplicationException;

  void disconnectConnection(String connectionId) throws ApplicationException;
  List listDatabases(String connectionId,String dbName) throws ApplicationException;
}
