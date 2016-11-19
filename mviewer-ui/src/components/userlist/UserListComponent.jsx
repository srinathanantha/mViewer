import React from 'react'
import UserListStyles from '../shared/listpanel.css'
import $ from 'jquery'
import UserItem from './UserItemComponent.jsx'
import NewUser from '../newuser/NewUserComponent.jsx'
import SearchInput, {createFilter} from 'react-search-input'
import service from '../../gateway/service.js'
import ReactHeight from 'react-height'

class UserList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      user:[],
      userDetails: [],
      connectionId: this.props.propps.connectionId,
      selectedDB: this.props.selectedDB,
      visible: false,
      selectedItem: null,
      loading: 'Loading',
      selectedCollection:null,
      searchTerm: '',
      viewMore: false,
      viewMoreLink: false
    }
  }

  fillData(data){
    var users = [];
    if(data.documents[0].users.length > 0) {
      data.documents[0].users.map(function(item){
        users.push(item.user);
      });
    }
    this.setState({user: users});
    this.setState({userDetails: data.documents[0].users});
  }

  success(calledFrom, data) {
    if(calledFrom == 'refreshCollectionList'){
      if(typeof(data.response.result) !== 'undefined'){
        this.fillData(data.response.result);
        this.clickHandler(0,this.state.selectedItem);
      }
      if(typeof(data.response.error) !== 'undefined'){
        if(data.response.error.code == 'DB_DOES_NOT_EXISTS'){
            this.props.refreshDb();
        }
      }
    }

    if(calledFrom == 'componentWillMount'){
      this.fillData(data.response.result);
    }

    if(calledFrom == 'componentWillReceiveProps'){
      this.fillData(data.response.result);
    }
  }

  failure() {

  }


  clickHandler (idx,selectedUser) {
    this.setState({ visible: false});
    var itemDetails = null;
    this.state.userDetails.map(function(item){
      if(item.user == selectedUser) {
        itemDetails = item;
      }
    });
    if(itemDetails != null){
      this.props.setStates(itemDetails.user,itemDetails, "user");
      this.setState({selectedCollection : itemDetails.user}, function(){
      });
    }
  }

  refreshRespectiveData(newCollectionName) {
    this.setState({selectedItem:newCollectionName});
    this.setState({selectedCollection: newCollectionName});
    this.props.setStates(newCollectionName);
  }

  searchUpdated (term) {
    this.setState({searchTerm: term})
  }

  refreshCollectionList(db){
    var partialUrl = db +'/usersIndexes/users?connectionId=' + this.state.connectionId;
    var userListCall = service('GET', partialUrl, '');
    userListCall.then(this.success.bind(this, 'refreshCollectionList'), this.failure.bind(this, 'refreshCollectionList'));
  }

  componentWillMount(){
    var that = this;
    var partialUrl = this.props.selectedDB +'/usersIndexes/users?connectionId=' + this.state.connectionId;
    var userListCall = service('GET', partialUrl, '');
    userListCall.then(this.success.bind(this, 'componentWillMount'), this.failure.bind(this, 'componentWillMount'));
  }

  componentWillReceiveProps(nextProps) {
    var that = this;
    var partialUrl = nextProps.selectedDB +'/usersIndexes/users?connectionId=' + this.state.connectionId;
    var userListCall = service('GET', partialUrl, '');
    userListCall.then(this.success.bind(this, 'componentWillReceiveProps'), this.failure.bind(this, 'componentWillReceiveProps'));
  }

  setViewMore(height) {
    var usersListHeight = $('.usersContainer').height();
    var listContainerHeight = height;

    if (listContainerHeight > usersListHeight) {
      this.setState({viewMoreLink: true});
    } else {
      this.setState({viewMoreLink: false});
    }
  }

  usersMoreClick() {
    this.setState({viewMore: !this.state.viewMore});
    this.setState({viewMoreLink: false});
  }

  render () {
    var that=this;
    var items=null;
    var filteredData = null;
    if (this.state.user != undefined){
      filteredData = this.state.user.filter(createFilter(this.state.searchTerm));
      var items = filteredData.map(function (item, idx) {
        var is_selected = that.state.selectedCollection == idx;
        return <UserItem
                key={item}
                name={item}
                dbName={this.state.selectedDB}
                onClick={this.clickHandler.bind(this,idx,item)}
                isSelected={that.state.selectedCollection==item}
                connectionId={this.state.connectionId}
                refreshCollectionList={this.refreshCollectionList.bind(this)}
                />;
        }.bind(this));
    }
      return (
        <div className={UserListStyles.menu + ' col-md-2 col-xs-5 col-sm-3'} key = {this.props.visible}>
          <div className={(this.props.visible ?(this.state.visible ? UserListStyles.visible   : this.props.alignment): this.props.alignment ) }>
            <SearchInput className={UserListStyles.searchInput} onChange={this.searchUpdated.bind(this)} />
            <h5 className={UserListStyles.menuTitle}><NewUser currentDb={this.props.selectedDB} currentItem="fs" connectionId={this.state.connectionId} refreshCollectionList={this.refreshCollectionList.bind(this)} refreshRespectiveData={this.refreshRespectiveData.bind(this)}></NewUser></h5>
            <div className = {(this.state.viewMore ? UserListStyles.listBody : UserListStyles.listBodyExpanded) + ' usersContainer'}>
              <ReactHeight onHeightReady={this.setViewMore.bind(this)}>
                {items}
              </ReactHeight>
            </div>
            <div className= {(this.state.viewMoreLink ? UserListStyles.viewMoreContainer : UserListStyles.displayNone)}>
              <a className = {UserListStyles.viewMore} onClick={this.usersMoreClick.bind(this)}>List All</a>
            </div>
          </div>
        </div>
      );
  }
}

export default UserList;
