package com.imaginea.mongodb.domain;

import com.mongodb.MongoClient;

public class MongoConnectionDetails {
  private ConnectionDetails connectionDetails;
  private MongoClient mongo;
  private String connectionId;

  public MongoConnectionDetails(ConnectionDetails connectionDetails, MongoClient mongo,
      String connectionId) {
    this.connectionDetails = connectionDetails;
    this.mongo = mongo;
    this.connectionId = connectionId;
  }

  public ConnectionDetails getConnectionDetails() {
    return connectionDetails;
  }

  public MongoClient getMongo() {
    return mongo;
  }

  public String getConnectionId() {
    return connectionId;
  }
}
