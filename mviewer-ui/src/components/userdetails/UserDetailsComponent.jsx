import React from 'react'
import userDetailsStyles from './userdetails.css'
import $ from 'jquery'
import service from '../../gateway/service.js';
import DeleteComponent from '../deletecomponent/DeleteComponent.jsx'
import ModifyUser from '../newuser/NewUserComponent.jsx'

class UserDetailsComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      userDetails: [],
      selectedDB: null,
      modalIsOpen: false,
      sidebarOpen: false,
      currentUser: null,
      _isMounted: false,
      roles: ""
    }
  }

  openModal() {
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
  }

  closeModal(successMessage) {
    if(this.state._isMounted == true){
      this.setState({modalIsOpen: false});
      if (successMessage == true){
        this.props.refreshCollectionList(false);
      }
    }
  }

  refreshRespectiveData(userName){
    this.props.refreshData(userName);
  }

  refreshCollectionList(showQueryExecutor){
    this.props.refreshCollectionList(showQueryExecutor);
  }

  createUserDetails(nextProps){
    var userDetail = [];
    var sortItem = {};
    var that = this;
     if(nextProps != null && nextProps != undefined){
       sortItem = nextProps.users;
     } else {
       sortItem = this.props.users;
     }
    var roles = "";
    sortItem.roles.map(function(item) {
      roles = roles.length > 0 ? roles + ", " +  item.role : item.role;
    });
    userDetail.push({'key': 'role', 'value': roles});
    Object.keys(sortItem).map(function(key) {
      if(key != "roles")
        userDetail.push({'key': key, 'value': sortItem[key]});
    });
    this.setState({userDetails: userDetail});
  }

  componentDidMount(){
    this.setState({_isMounted: true});
    this.setState({currentUser: this.props.users.user});
    this.createUserDetails();
  }

  componentWillUnmount(){
    this.state._isMounted = false;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({currentUser: nextProps.users.user});
    this.createUserDetails(nextProps);
  }

  failure() {
  }

  render () {
    var that = this;
    var roles = "";
    this.state.userDetail ? this.state.userDetail.map(function(item){
      if(item.key == "role")
        roles = item.value;
    }) : null;
    var roles = this.state.userDetail ? this.state.userDetail[0].key : null;
    return(
      <div className={userDetailsStyles.mainContainer}>
          <div className= {userDetailsStyles.actionsContainer}>
            <span className={userDetailsStyles.detailsLabel}> {this.state.currentUser} Details:</span>
              <div className={userDetailsStyles.deleteButtonGridfs} onClick={this.openModal.bind(this)}><i className="fa fa-trash" aria-hidden="true"></i><span>Delete User</span></div>
              { this.state.modalIsOpen?<DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal.bind(this)} title = 'User' dbName = {this.props.currentDb} userName = {this.state.currentUser} connectionId={this.props.connectionId} ></DeleteComponent> : '' }
              <ModifyUser className={userDetailsStyles.modifyUser} users={this.props.users} modifyUser="true" currentDb = {this.props.currentDb} userName = {this.state.currentUser} connectionId={this.props.connectionId} refreshCollectionList={this.refreshCollectionList.bind(this)} refreshRespectiveData={this.refreshRespectiveData.bind(this)}></ModifyUser>
          </div>
        <div className={userDetailsStyles.detailsBody}>
          <table>
            <tbody>
              <tr>
                <th>Keys</th>
                <th>Values</th>
              </tr>
              { this.state.userDetails.length > 0 ?
                that.state.userDetails.map(function(item) {
                return <tr key={item.key}><td>{item.key}</td><td>{item.value}</td></tr>
              }) : null }
            </tbody>
          </table>
        </div>
    </div>
  );
 }
}

export default UserDetailsComponent;
