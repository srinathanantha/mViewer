/* eslint react/prop-types: 0 */
import React from 'react';
import userDetailsStyles from './user-details.css';
import DeleteComponent from '../delete-component/DeleteComponent.jsx';
import ModifyUser from '../new-user/NewUserComponent.jsx';
import privilegesAPI from '../../gateway/privileges-api.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';

class UserDetailsComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      userDetails : [],
      selectedDB : null,
      modalIsOpen : false,
      sidebarOpen : false,
      currentUser : null,
      _isMounted : false,
      roles : '',
      showAuth : false,
      hasPriv : false
    };
    this.closeModal = this.closeModal.bind(this);
    this.refreshRespectiveData = this.refreshRespectiveData.bind(this);
    this.refreshCollectionList = this.refreshCollectionList.bind(this);
    this.createUserDetails = this.createUserDetails.bind(this);
  }

  openModal = () => {
    this.setState({modalIsOpen : true});
    this.setState({message : ''});
    const hasPriv = privilegesAPI.hasPrivilege('dropRole', '', this.props.currentDb);
    if(hasPriv) {
      this.setState({showAuth : false});
    } else{
      this.setState({showAuth : true});
    }
  }

  authClose = () => {
    this.setState({showAuth : false});
    this.setState({modalIsOpen : false});
  }


  closeModal(successMessage) {
    if(this.state._isMounted === true) {
      this.setState({modalIsOpen : false});
      if (successMessage === true) {
        this.props.refreshCollectionList(false);
      }
    }
  }

  refreshRespectiveData(userName) {
    this.props.refreshData(userName);
  }

  refreshCollectionList(showQueryExecutor) {
    this.props.refreshCollectionList(showQueryExecutor);
  }

  createUserDetails(nextProps) {
    let userDetail = [];
    let sortItem = {};
    if(nextProps != null && typeof(nextProps) != 'undefined') {
      sortItem = nextProps.users;
    } else {
      sortItem = this.props.users;
    }
    let roles = '';
    let Db = '';
    typeof(sortItem.roles) != 'undefined' ? sortItem.roles.map(function(item) {
      roles = roles.length > 0 ? roles + ', ' + item.role : item.role;
      Db = item.db;
    }) : null;
    userDetail.push({'key' : 'role', 'value' : roles});
    userDetail.push({'key' : 'DbSource', 'value' : Db});
    Object.keys(sortItem).map(function(key) {
      if(key !== 'roles')
        userDetail.push({'key' : key, 'value' : sortItem[key]});
    });
    this.setState({userDetails : userDetail});
  }

  componentDidMount() {
    this.setState({_isMounted : true});
    this.setState({currentUser : this.props.users.user});
    this.createUserDetails();
  }

  componentWillUnmount() {
    // this.state._isMounted = false; //eslint fix
    this.setState({_isMounted : false});
  }

  componentWillReceiveProps(nextProps) {
    this.setState({currentUser : nextProps.users.user});
    this.createUserDetails(nextProps);
  }

  failure() {
  }

  render () {
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
          <li className={userDetailsStyles.deleteButtonGridfs} onClick={this.openModal}><i className="fa fa-trash" aria-hidden="true"></i><span>Delete User</span></li>
          { this.state.modalIsOpen ? (!this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal} title = 'User' dbName = {this.props.currentDb} userName = {this.state.currentUser} connectionId={this.props.connectionId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose} action = 'drop user' ></AuthPopUp>) : '' }
          <li><ModifyUser className={userDetailsStyles.modifyUser} users={this.props.users} modifyUser={true} currentDb = {this.props.currentDb} userName = {this.state.currentUser} connectionId={this.props.connectionId} refreshCollectionList={this.refreshCollectionList} refreshRespectiveData={this.refreshRespectiveData}></ModifyUser></li>
        </ul>
      </div>
      </div>

      <div className={userDetailsStyles.detailsBody}>
        <table className={'table'}>
          <tbody>
            <tr>
              <th className='text-left'>Keys</th>
              <th className='text-left'>Values</th>
            </tr>
            { this.state.userDetails.length > 0 ?
              this.state.userDetails.map((item) => {
                return <tr key={item.key}><td className='text-left'>{item.key}</td><td className='text-left'>{item.value}</td></tr>;
              }) : null }
          </tbody>
        </table>
      </div>
    </div>
    );
  }
}

export default UserDetailsComponent;
