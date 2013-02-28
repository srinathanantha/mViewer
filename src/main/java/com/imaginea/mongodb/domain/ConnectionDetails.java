package com.imaginea.mongodb.domain;

import java.util.HashSet;
import java.util.Set;

/**
 * @author Uday Shankar
 */
public class ConnectionDetails {
    private String hostIp;
    private int hostPort;
    private String username;
    private String password;
    private String dbNames;//Comma separated Values
    private Set<String> authenticatedDbNames = new HashSet<String>();
    private boolean authMode;

    public ConnectionDetails(String hostIp, int hostPort, String username, String password, String dbNames) {
        this.hostIp = hostIp;
        this.hostPort = hostPort;
        this.username = username;
        this.password = password;
        this.dbNames = dbNames;
    }

    public String getHostIp() {
        return hostIp;
    }

    public void setHostIp(String hostIp) {
        this.hostIp = hostIp;
    }

    public int getHostPort() {
        return hostPort;
    }

    public void setHostPort(int hostPort) {
        this.hostPort = hostPort;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDbNames() {
        return dbNames;
    }

    public void setDbNames(String dbNames) {
        this.dbNames = dbNames;
    }

    public Set<String> getAuthenticatedDbNames() {
        return authenticatedDbNames;
    }

    public void addToAuthenticatedDbNames(String dbName) {
        authenticatedDbNames.add(dbName);
    }

    public boolean isAuthMode() {
        return authMode;
    }

    public void setAuthMode(boolean authMode) {
        this.authMode = authMode;
    }

    public boolean isAdminLogin() {
        return authenticatedDbNames.contains("admin");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ConnectionDetails)) return false;

        ConnectionDetails that = (ConnectionDetails) o;

        if (hostPort != that.hostPort) return false;
        if (dbNames != null ? !dbNames.equals(that.dbNames) : that.dbNames != null) return false;
        if (hostIp != null ? !hostIp.equals(that.hostIp) : that.hostIp != null) return false;
        if (password != null ? !password.equals(that.password) : that.password != null) return false;
        if (username != null ? !username.equals(that.username) : that.username != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = hostIp != null ? hostIp.hashCode() : 0;
        result = 31 * result + hostPort;
        result = 31 * result + (username != null ? username.hashCode() : 0);
        result = 31 * result + (password != null ? password.hashCode() : 0);
        result = 31 * result + (dbNames != null ? dbNames.hashCode() : 0);
        if (result == Integer.MIN_VALUE) {
            return Integer.MAX_VALUE;
        }
        return Math.abs(result);
    }
}
