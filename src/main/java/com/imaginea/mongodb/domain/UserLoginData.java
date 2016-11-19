package com.imaginea.mongodb.domain;

import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class UserLoginData {

  private String userName;
  private String password;
  private String host;
  private String port;
  private String databases;

  public UserLoginData() {
    // TODO Auto-generated constructor stub
  }

  public String getUserName() {
    return userName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host;
  }

  public String getPort() {
    return port;
  }

  public void setPort(String port) {
    this.port = port;
  }

  public String getDatabases() {
    return databases;
  }

  public void setDatabases(String databases) {
    this.databases = databases;
  }

  @Override
  public String toString() {
    return "UserLoginData [userName=" + userName + ", password=" + password + ", host=" + host
        + ", port=" + port + ", databases=" + databases + "]";
  }

}
