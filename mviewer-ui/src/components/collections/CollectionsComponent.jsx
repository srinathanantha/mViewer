import React from 'react'
import collectionsStyles from './collections.css'
import NewCollection from '../newcollection/newCollectionComponent.jsx'
import NewDocument from '../newdocument/newDocumentComponent.jsx'
import QueryExecutor from '../queryexecutor/QueryExecutorComponent.jsx'
import CollectionList from '../collectionlist/CollectionListComponent.jsx'
import GridFSList from '../gridfslist/GridFSListComponent.jsx'
import DbStats from '../dbstats/DbStatsComponent.jsx'
import UserList from '../userlist/UserListComponent.jsx'
import $ from 'jquery'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import UserDetails from '../userdetails/UserDetailsComponent.jsx'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import ReactResizeDetector from 'react-resize-detector';

class CollectionsComponent extends React.Component {

  constructor(props) {
      super(props);
      this.state = {
        selectedTab : 0,
        showQueryExecutor: false,
        selectedCollection: '',
        userDetails: [],
        hasListColPriv: null,
        navMessage:'Collections'
      }
  }

  handleSelect(index){
    this.setState({selectedTab:index}, function(){
    });
    if (index == 0){
      this.setState({navMessage : 'Collections'});
    }
    else if (index == 1){
      this.setState({navMessage : 'GridFS'});
    }
    else if (index == 2){
      this.setState({navMessage : 'Users'});
    }
    else if (index == 3){
      this.setState({navMessage : 'Statistics'});
    }

    this.setState({hasListColPriv : privilegesAPI.hasPrivilege('listCollections' , '' , this.props.location.query.db)});
  }

  showQueryExecutor(){
    this.setState({showQueryExecutor: true});
  }

  componentWillReceiveProps(nextProps){

    Tabs.setUseDefaultStyles(false);
    this.setState({selectedTab:0});
    this.setState({showQueryExecutor: false});
    this.setState({selectedCollection: ''});
  
    if (this.props.location.query.db  != nextProps.location.query.db){

      this.setState({hasListColPriv: null});
      setTimeout(function(){
        this.setState({hasListColPriv : privilegesAPI.hasPrivilege('listCollections' , '' , this.props.location.query.db)}, function(){
        }); 
      }.bind(this), 500);
    }
  }


  componentDidMount (){
    setTimeout(function(){
      this.setState({hasListColPriv : privilegesAPI.hasPrivilege('listCollections' , '' , this.props.location.query.db)}, function(){
      }); 
    }.bind(this), 500);
  
  }

  setStates(collection, data, type){
    if(data != undefined && data != null) {
      this.setState({userDetails: data});
    }
    this.setState({selectedCollection: collection});
    this.setState({showQueryExecutor: true});
  }

  hideQueryExecutor(){
    this.setState({showQueryExecutor: false});
  }

  switchTab() {
    this.setState({showQueryExecutor: false});
  }

  refreshCollectionList(showQueryExecutor){
    if(typeof(this.refs.left) != 'undefined'){
      this.refs.left.refreshCollectionList(this.props.location.query.db);
    }
    if(showQueryExecutor==false){
      this.setState({showQueryExecutor:showQueryExecutor});
    }
  }

  refreshRespectiveData(updatedcollectionName){
    this.refs.left.refreshRespectiveData(updatedcollectionName);
  }

  toggleMessage(){

  }

  render () {

    Tabs.setUseDefaultStyles(false);
    var hasUserAdminPriv = privilegesAPI.hasPrivilege('viewUser', '',this.props.location.query.db ); 
    var hasUserAdminAnyDatabasePriv = privilegesAPI.hasPrivilege('viewUser','',this.props.location.query.db );
    var hasDbStatsPriv   = privilegesAPI.hasPrivilege('dbStats' , '' , this.props.location.query.db);

    var hasListColPriv   = privilegesAPI.hasPrivilege('listCollections' , '' , this.props.location.query.db);
    return(
      <div className = {this.props.location.query.collapsed == 'false' ? collectionsStyles.mainContainer+ ' collectionsContainer col-lg-10  col-sm-9 col-xs-8 col-md-9' : collectionsStyles.mainContainer+' collectionsContainer col-lg-11  col-sm-11 col-xs-10 col-md-11 ' +collectionsStyles.collapsedContainer}>
        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#mainNavbar" aria-expanded="false" onClick={this.toggleMessage.bind(this)}><span className={collectionsStyles.collapseSpan}>{this.state.navMessage}</span></button>
        {this.props.location.query.db !== 'undefined' ? 
        
        <Tabs selectedIndex={this.state.selectedTab} onSelect={this.handleSelect.bind(this)}>
          
          <TabList id = "mainNavbar" className={collectionsStyles.tabs + ' nav navbar-nav mainTab collapse navbar-collapse'}>
            <Tab onClick={this.switchTab.bind(this)} className={this.state.selectedTab == 0 ? collectionsStyles.activeTab : '' } ><span data-target=".navbar-collapse.in" data-toggle="collapse">Collections</span></Tab>
            <Tab onClick={this.switchTab.bind(this)} className={this.state.selectedTab == 1 ? collectionsStyles.activeTab : '' }><span data-target=".navbar-collapse.in" data-toggle="collapse">GridFS</span></Tab>
            <Tab onClick={this.switchTab.bind(this)} className={this.state.selectedTab == 2 ? collectionsStyles.activeTab : '' }><span data-target=".navbar-collapse.in" data-toggle="collapse">Users</span></Tab>
            <Tab onClick={this.switchTab.bind(this)} className={this.state.selectedTab == 3 ? collectionsStyles.activeTab : '' }><span data-target=".navbar-collapse.in" data-toggle="collapse">Statistics</span></Tab>
          </TabList>
          
          <TabPanel className ='mainTabPanel'>
            { this.state.hasListColPriv == true ?
              <div className={collectionsStyles.holder + ' row'}>
                <CollectionList ref="left"  visible={true} propps = {this.props} showQueryExecutor = {this.showQueryExecutor.bind(this)} hideQueryExecutor = {this.hideQueryExecutor.bind(this)} selectedDB={this.props.location.query.db} setStates = {this.setStates.bind(this)} refreshDb = {this.props.refreshDb.bind(this)} ></CollectionList>
                {this.state.showQueryExecutor ? <QueryExecutor ref='right' refreshRespectiveData={this.refreshRespectiveData.bind(this)} refreshCollectionList={this.refreshCollectionList.bind(this)} queryType= "collection" currentDb={this.props.location.query.db} currentItem={this.state.selectedCollection} connectionId={this.props.connectionId}></QueryExecutor> : null}
              </div> : ( this.state.hasListColPriv ==null ? <div className={collectionsStyles.loading}><img src={'./images/loading.gif'} ></img><label>Checking for Privileges</label></div>:<div className = {collectionsStyles.errorHolder}>You are not authorised to view Collections</div>)
            }
          </TabPanel>
          <TabPanel className ='mainTabPanel'>
            { hasListColPriv  ?
              <div className={'row'}>
                <GridFSList ref="left"  visible={true} propps = {this.props} selectedDB={this.props.location.query.db} setStates = {this.setStates.bind(this)} refreshDb = {this.props.refreshDb.bind(this)} ></GridFSList>
                {this.state.showQueryExecutor ? <QueryExecutor ref='right' refreshRespectiveData={this.refreshRespectiveData.bind(this)} refreshCollectionList={this.refreshCollectionList.bind(this)} queryType= "fs" currentDb={this.props.location.query.db} currentItem={this.state.selectedCollection} connectionId={this.props.connectionId}></QueryExecutor> : null}
              </div> : <div className = {collectionsStyles.errorHolder}>You are not authorised to view GridFS</div>
            }
          </TabPanel>
          <TabPanel className ='mainTabPanel'>
            { hasUserAdminPriv || hasUserAdminAnyDatabasePriv ? 
              <div className={'row'}>
                <UserList ref="left"  visible={true} propps = {this.props} selectedDB={this.props.location.query.db} setStates = {this.setStates.bind(this)} refreshDb = {this.props.refreshDb.bind(this)} ></UserList>
                {this.state.showQueryExecutor ? <UserDetails ref='right' refreshData={this.refreshRespectiveData.bind(this)} users={this.state.userDetails} currentDb={this.props.location.query.db} currentItem={this.state.selectedCollection} connectionId={this.props.connectionId} refreshCollectionList={this.refreshCollectionList.bind(this)}></UserDetails> : null}
              </div> : <div className = {collectionsStyles.errorHolder}>You are not authorised to view Users</div>}  
          </TabPanel>
          <TabPanel className ='mainTabPanel'>
          { hasDbStatsPriv ?
            <DbStats ref="left"  visible={true} connectionId = {this.props.connectionId} selectedDB={this.props.location.query.db}></DbStats>
            : <div className = {collectionsStyles.errorHolder}>You are not authorised to view DB Statistics</div>
          }
          </TabPanel>
      </Tabs> : null}
      </div>
    );
  }
}

export default CollectionsComponent;
