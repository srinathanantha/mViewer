import React from 'react';
import UserListStyles from '../shared/list-panel.css';
import $ from 'jquery';
import UserItem from './UserItemComponent.jsx';
import NewUser from '../new-user/NewUserComponent.jsx';
import SearchInput, {createFilter} from 'react-search-input';
import service from '../../gateway/service.js';
import ReactHeight from 'react-height';

class UserList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      user : [],
      userDetails : [],
      connectionId : this.props.propps.connectionId,
      selectedDB : this.props.selectedDB,
      visible : false,
      selectedItem : null,
      loading : 'Loading',
      selectedCollection : null,
      searchTerm : '',
      viewMore : false,
      viewMoreLink : false
    };
    this.setViewMore = this.setViewMore.bind(this);
    this.searchUpdated = this.searchUpdated.bind(this);
    this.fillData = this.fillData.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.refreshRespectiveData = this.refreshRespectiveData.bind(this);
    this.refreshCollectionList = this.refreshCollectionList.bind(this);
  }

  fillData(data) {
    let users = [];
    if(data.documents[0].users.length > 0) {
      data.documents[0].users.map(function(item) {
        users.push(item.user);
      });
    }
    this.setState({user : users});
    this.setState({userDetails : data.documents[0].users});
  }

  success(calledFrom, data) {
    if(calledFrom === 'refreshCollectionList') {
      if(typeof(data.response.result) != 'undefined') {
        this.fillData(data.response.result);
        this.clickHandler(0, this.state.selectedItem);
      }
      if(typeof(data.response.error) != 'undefined') {
        if(data.response.error.code === 'DB_DOES_NOT_EXISTS') {
          this.props.refreshDb();
        }
      }
    }

    if(calledFrom === 'componentWillMount') {
      this.fillData(data.response.result);
    }

    if(calledFrom === 'componentWillReceiveProps') {
      this.fillData(data.response.result);
    }
  }

  failure() {

  }


  clickHandler (idx, selectedUser) {
    this.setState({ visible : false});
    let itemDetails = null;
    this.state.userDetails.map(function(item) {
      if(item.user === selectedUser) {
        itemDetails = item;
      }
    });
    if(itemDetails != null) {
      this.props.setStates(itemDetails.user, itemDetails, 'user');
      this.setState({selectedCollection : itemDetails.user}, function() {
      });
    }
  }

  refreshRespectiveData(newCollectionName) {
    this.setState({selectedItem : newCollectionName});
    this.setState({selectedCollection : newCollectionName});
    this.props.setStates(newCollectionName, '', 'user');
  }

  searchUpdated (term) {
    this.setState({searchTerm : term});
  }

  refreshCollectionList(db) {
    const partialUrl = db + '/usersIndexes/users?connectionId=' + this.state.connectionId;
    const userListCall = service('GET', partialUrl, '');
    userListCall.then(this.success.bind(this, 'refreshCollectionList'), this.failure.bind(this, 'refreshCollectionList'));
  }

  componentWillMount() {
    const partialUrl = this.props.selectedDB + '/usersIndexes/users?connectionId=' + this.state.connectionId;
    const userListCall = service('GET', partialUrl, '');
    userListCall.then(this.success.bind(this, 'componentWillMount'), this.failure.bind(this, 'componentWillMount'));
  }

  componentWillReceiveProps(nextProps) {
    const partialUrl = nextProps.selectedDB + '/usersIndexes/users?connectionId=' + this.state.connectionId;
    const userListCall = service('GET', partialUrl, '');
    userListCall.then(this.success.bind(this, 'componentWillReceiveProps'), this.failure.bind(this, 'componentWillReceiveProps'));
  }

  setViewMore(height) {
    const usersListHeight = $('.usersContainer').height();
    const listContainerHeight = height;

    if (listContainerHeight > usersListHeight) {
      this.setState({viewMoreLink : true});
    } else {
      this.setState({viewMoreLink : false});
    }
  }

  usersMoreClick = () => {
    this.setState({viewMore : !this.state.viewMore});
    this.setState({viewMoreLink : false});
  }

  render () {
    const that = this;
    let items = null;
    let filteredData = null;
    if (typeof(this.state.user) != 'undefined') {
      filteredData = this.state.user.filter(createFilter(this.state.searchTerm));
      items = filteredData.map((item, idx) => {
        return <UserItem
                key={item}
                name={item}
                idx={idx}
                dbName={this.state.selectedDB}
                onClick={this.clickHandler}
                isSelected={that.state.selectedCollection === item}
                connectionId={this.state.connectionId}
                refreshCollectionList={this.refreshCollectionList}
                />;
      });
    }
    return (
        <div className={UserListStyles.menu + ' col-md-2 col-xs-5 col-sm-3'} key = {this.props.visible}>
          <div className={(this.props.visible ? (this.state.visible ? UserListStyles.visible : this.props.alignment) : this.props.alignment ) }>
            <SearchInput className={UserListStyles.searchInput} onChange={this.searchUpdated} />
            <h5 className={UserListStyles.menuTitle}><NewUser currentDb={this.props.selectedDB} currentItem="fs" connectionId={this.state.connectionId} refreshCollectionList={this.refreshCollectionList} refreshRespectiveData={this.refreshRespectiveData}></NewUser></h5>
            <div className = {(this.state.viewMore ? UserListStyles.listBody : UserListStyles.listBodyExpanded) + ' usersContainer'}>
              <ReactHeight onHeightReady={this.setViewMore}>
                {items}
              </ReactHeight>
            </div>
            <div className= {(this.state.viewMoreLink ? UserListStyles.viewMoreContainer : UserListStyles.displayNone)}>
              <a className = {UserListStyles.viewMore} onClick={this.usersMoreClick}>List All</a>
            </div>
          </div>
        </div>
    );
  }
}

UserList.propTypes = {
  propps : React.PropTypes.object,
  connectionId : React.PropTypes.string,
  selectedDB : React.PropTypes.string,
  visible : React.PropTypes.bool,
  alignment : React.PropTypes.string,
  setStates : React.PropTypes.func.isRequired,
  refreshDb : React.PropTypes.func.isRequired
};


export default UserList;
