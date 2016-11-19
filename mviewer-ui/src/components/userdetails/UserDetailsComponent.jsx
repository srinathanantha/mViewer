import React from 'react'
import userDetailsStyles from './userdetails.css'
import $ from 'jquery'
import service from '../../gateway/service.js';
import DeleteComponent from '../deletecomponent/DeleteComponent.jsx'
import ModifyUser from '../newuser/NewUserComponent.jsx'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx'

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
      roles: "",
      showAuth: false,
      hasPriv: false
    }
  }

  openModal() {
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
    var hasPriv = privilegesAPI.hasPrivilege('dropRole','', this.props.currentDb);
    if(hasPriv){
      this.setState({showAuth : false});    }
    else{
      this.setState({showAuth : true});
    }
  }

  authClose(){
    this.setState({showAuth:false});
    this.setState({modalIsOpen:false});
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
    var Db = "";
    sortItem.roles.map(function(item) {
      roles = roles.length > 0 ? roles + ", " +  item.role : item.role;
      Db = item.db;
    });
    userDetail.push({'key': 'role', 'value': roles});
    userDetail.push({'key': 'DbSource', 'value': Db});
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
      <div className={userDetailsStyles.mainContainer + ' col-md-10 col-xs-7 col-sm-9'}>
      <div id="userDetails" className={userDetailsStyles.userContainer + ' navbar navbar-default'}>
      <div className={'navbar-header'}>
        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#userNavbar">
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      </div>
      <div className="collapse navbar-collapse" id="userNavbar">
        <ul className = { userDetailsStyles.navBar + ' navbar navbar-nav navbar-right'}>
          <li className={userDetailsStyles.deleteButtonGridfs} onClick={this.openModal.bind(this)}><i className="fa fa-trash" aria-hidden="true"></i><span>Delete User</span></li>
          { this.state.modalIsOpen?(!this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal.bind(this)} title = 'User' dbName = {this.props.currentDb} userName = {this.state.currentUser} connectionId={this.props.connectionId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose.bind(this)} action = 'drop user' ></AuthPopUp>) : '' }
          <li><ModifyUser className={userDetailsStyles.modifyUser} users={this.props.users} modifyUser="true" currentDb = {this.props.currentDb} userName = {this.state.currentUser} connectionId={this.props.connectionId} refreshCollectionList={this.refreshCollectionList.bind(this)} refreshRespectiveData={this.refreshRespectiveData.bind(this)}></ModifyUser></li>
        </ul>
      </div>
      </div>
        
      <div className={userDetailsStyles.detailsBody}>
        <table className={'table'}>
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
