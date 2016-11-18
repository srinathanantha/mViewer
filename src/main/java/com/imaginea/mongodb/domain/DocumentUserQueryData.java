package com.imaginea.mongodb.domain;

import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class DocumentUserQueryData {

  private String query;
  private String fields;
  private String limit;
  private String skip;
  private String sortBy;
  private boolean allKeys;

  public DocumentUserQueryData() {
    // TODO Auto-generated constructor stub
  }

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  public String getFields() {
    return fields;
  }

  public void setFields(String fields) {
    this.fields = fields;
  }

  public String getLimit() {
    return limit;
  }

  public void setLimit(String limit) {
    this.limit = limit;
  }

  public String getSkip() {
    return skip;
  }

  public void setSkip(String skip) {
    this.skip = skip;
  }

  public String getSortBy() {
    return sortBy;
  }

  public void setSortBy(String sortBy) {
    this.sortBy = sortBy;
  }

  public boolean isAllKeys() {
    return allKeys;
  }

  public void setAllKeys(boolean allKeys) {
    this.allKeys = allKeys;
  }

  @Override
  public String toString() {
    return "DocumentUserQueryData [query=" + query + ", fields=" + fields + ", limit=" + limit
        + ", skip=" + skip + ", sortBy=" + sortBy + ", allKeys=" + allKeys + "]";
  }


}
