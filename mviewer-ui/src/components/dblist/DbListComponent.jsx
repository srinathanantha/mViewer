import React from 'react'
import dbListStyles from './dblist.css'
import collectionListStyles from '../shared/listpanel.css'
import $ from 'jquery'
import CollectionList from '../collectionlist/CollectionListComponent.jsx'
import GridFSList from '../gridfslist/GridFSListComponent.jsx'
import DbItem from './DbItemComponent.jsx'
import ReactDOM  from 'react-dom'
import { Form } from 'formsy-react'
import TextInput from '../TextInput/TextInputComponent.jsx'
import Modal from 'react-modal'
import service from '../../gateway/service.js'
import SearchInput, {createFilter} from 'react-search-input'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx';
import ReactHeight from 'react-height';
class DbListComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dbNames:[],
      connectionId: this.props.propps.connectionId,
      dbStats: {},
      visible: true,
      selectedItem: null,
      selectedDb: this.props.propps.propss.location.query.db,
      modalIsOpen: false,
      name: null,
      error:false,
      searchTerm: '',
      selectedNav: this.props.selectedNav,
      showAuth: false,
      hasPriv: false,
      viewMore: false,
      viewMoreLink: false
    }
  }

  openModal() {
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
    this.setState({error:false});
    var hasPriv = privilegesAPI.hasPrivilege('createCollection','', '');
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

  closeModal() {
    this.setState({modalIsOpen: false});
  }
  enableButton() {
    return function() {
      this.setState({
        canSubmit: true
      });
    }.bind(this);
  }

  disableButton() {
    return function() {
      this.setState({
        canSubmit: false
      });
    }.bind(this);
  }

  handleChange(key){
   this.setState({successMessage:false});
   this.setState({message:''});
  }

  clickHandler (idx, db) {
    var that = this;
    this.setState({ visible: !this.state.visible });
    this.setState({selectedItem: db});
    this.props.selectedDB(db);
    this.setState({selectedDb : db});
    sessionStorage.setItem('queryType', JSON.stringify("collection"));
    window.location.hash = '#/dashboard/database?db='+db + '&collapsed='+this.state.visible;
  }

  componentDidMount(){
    var that = this;
    var url = window.location.href;
    var params = url.split('?');
    var n = params[1].search("&collapsed=true");
    if (n!= -1) {
      this.setState({visible:false});
    }
    var partialUrl = 'login/details?connectionId='+ this.state.connectionId;
    var refreshDbCall = service('GET', partialUrl, '');
    refreshDbCall.then(this.success.bind(this , 'componentDidMount' , ''), this.failure.bind(this , 'componentDidMount', ''));
  }

  setViewMore(height) {
    var dbListHeight = $('.dbContainer').height();
    var listContainerHeight = height;

    if (listContainerHeight > dbListHeight) {
      this.setState({viewMoreLink: true});
    } else {
      this.setState({viewMoreLink: false});
    }
  }

  refreshDbList(dbName){

    var partialUrl = 'login/details?connectionId='+ this.state.connectionId;
    var refreshDbCall = service('GET', partialUrl, '');
    refreshDbCall.then(this.success.bind(this , 'refreshDbList' , ''), this.failure.bind(this , 'refreshDbList', ''));
    if(dbName != null){
      window.location.hash = '#/dashboard/database?db='+dbName + '&collapsed=false';
    }

    if (dbName == 'undefined') {
      window.location.hash = '#/dashboard/home?collapsed=false';
    }
  }

  changeHandler(){
    this.setState({visible:false});
  }

  collapsedDivHandler(){
    var that =this;
    this.setState({visible: !this.state.visible}, function(){
      window.location.hash = '#/dashboard/database?db='+that.state.selectedDb + '&collapsed='+false;
    });

  }

  clickHandlerModal(){
    var that =this;
    var data = $("form").serialize().split("&");
    var obj={};
    for(var key in data)
    {
      obj[data[key].split("=")[0]] = data[key].split("=")[1];
    }
    if (obj['name']!=''){
      var partialUrl = 'db/'+obj['name']+'?connectionId='+this.props.propps.connectionId;
      var createDbCall = service('POST', partialUrl, obj);
      createDbCall.then(this.success.bind(this , 'clickHandlerModal' , obj), this.failure.bind(this , 'clickHandlerModal', obj));
    }
    else{
      this.setState({error : true})
    }
  }

  moreClick() {
    this.setState({viewMore: !this.state.viewMore});
    this.setState({viewMoreLink: false});
  }

  searchUpdated (term) {
    this.setState({searchTerm: term})
  }

  componentWillReceiveProps(){
    var url = window.location.href;
    var params = url.split('?');
    var shouldCollapse = params[1].search("&collapsed=true");
    var queryType = JSON.parse(sessionStorage.getItem('queryType'));
    if (shouldCollapse!= -1) {
      this.setState({visible:false});
    }
    else{
      this.setState({visible:true});
    }
    if(queryType == -1){
     this.setState({selectedDb: null});
    }
  }

  success(calledFrom, obj, data) {
    if(calledFrom == 'componentDidMount'){
      if (typeof(data.response.result) != 'undefined')
        {
          var result = data.response.result;
          this.setState({dbNames: result.dbNames});
          sessionStorage.setItem('dbNames', JSON.stringify(this.state.dbNames));
          if (result.rolesAndPrivileges) {
            privilegesAPI.setRoles(result.rolesAndPrivileges.documents[0].users[0]);
          }
          else{
            privilegesAPI.setRoles(undefined);
          }
          var test = privilegesAPI.hasPrivilege('collStats','',this.props.propps.loggedInDatabase);
        }
      else {
        {
          window.location.hash='#?code=INVALID_CONNECTION';
        }
      }
    }

    if(calledFrom == 'refreshDbList'){
      if (typeof(data.response.result) != 'undefined')
        {
          this.setState({dbNames: data.response.result.dbNames});
          sessionStorage.setItem('dbNames', JSON.stringify(data.response.result.dbNames));
        }
      else {
        window.location.hash='#?code=INVALID_CONNECTION';
      }
    }

    if(calledFrom == 'clickHandlerModal'){
      if (data.response.result) {
        this.setState({message:'Database '+obj['name']+ ' was successfully created'});
        this.setState({successMessage:true});
        this.refreshDbList(this.state.selectedDb);
        setTimeout(function() { this.closeModal() }.bind(this), 2000);
      }
      if (data.response.error) {
        this.setState({successMessage:false});
        if(data.response.error.code == 'DB_ALREADY_EXISTS'){
          this.setState({message:'Database '+obj['name']+ ' already exists'});
        }
        if(data.response.error.code == 'DB_CREATION_EXCEPTION'){
          this.setState({message : 'could not create database with given db name'});
        }
        if(data.response.error.code == 'ANY_OTHER_EXCEPTION'){
          this.setState({message : 'Error occured while creating the database'});
        }
      }
    }
  }

  failure() {

  }


  render () {
    const customStyles = {
      content : {
        top                   : '50%',
        left                  : '53%',
        right                 : 'auto',
        width                 : '25%',
        minWidth              : '200px',
        bottom                : 'auto',
        padding               : '0px',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)',
        border                : 'none',
        borderRadius          : '3px'
      },
      overlay : {
        backgroundColor       : 'rgba(0,0,0, 0.74902)'
      }
    };

    var that = this;
    const filteredData = this.state.dbNames.filter(createFilter(this.state.searchTerm));
    return(
     <div className = {this.state.visible ? dbListStyles.mainMenu : dbListStyles.mainMenuCollapsed}>
       <div className={dbListStyles.menu}>
         <div className={(this.state.visible ? dbListStyles.visible   : dbListStyles.collapsed)  }>
          <div className = {dbListStyles.dbListHeader}>
             <SearchInput className={dbListStyles.searchInput} onChange={this.searchUpdated.bind(this)} />
             <h5 className={dbListStyles.menuTitle}><span onClick= {this.openModal.bind(this)} ><i className="fa fa-plus-circle" aria-hidden="true"></i> Add Database</span></h5>
          </div>
          
            <div className = {(this.state.viewMore ? dbListStyles.dbListBody : dbListStyles.dbListBodyExpanded) + ' dbContainer'}>
              <ReactHeight onHeightReady={this.setViewMore.bind(this)}>
                  {filteredData.map((item,idx) => {
                     return(
                       <DbItem
                       key={item}
                       name={item}
                       onClick={this.clickHandler.bind(this,idx, item)}
                       isSelected={this.state.selectedDb==item}
                       connectionId = {this.state.connectionId}
                       refreshDbList={this.refreshDbList.bind(this)}
                       />)
                   })}
              </ReactHeight>
            </div>
          
          <div className= {(this.state.viewMoreLink ? dbListStyles.viewMoreContainer : dbListStyles.displayNone)}>
            <a className = {dbListStyles.viewMore} onClick={this.moreClick.bind(this)}>List All</a>
          </div>
        </div>
        <div className={this.state.visible ?dbListStyles.collapsedDiv: dbListStyles.openDiv} onClick={this.collapsedDivHandler.bind(this)} >
          <span className={dbListStyles.arrow}>
            <i className="fa fa-chevron-right" aria-hidden="true" ></i>
          </span>
          <span className={dbListStyles.collapsedData}>{(this.state.selectedDb != null ? this.state.selectedDb : '') || (this.props.propps.propss != undefined ? this.props.propps.propss.location.query.db : null)}</span>
        </div>
     </div>
    { !this.state.showAuth ? <Modal
       isOpen={this.state.modalIsOpen}
       onRequestClose={this.closeModal.bind(this)}
       style = {customStyles}>
       <div className={dbListStyles.two}>
         <div className={dbListStyles.header}>
          <span className={dbListStyles.text}>Create Database</span>
        </div>
         <Form method='POST' onValid={this.enableButton()} onInvalid={this.disableButton()} >
           <div className={ dbListStyles.formContainer}>
             <div className={dbListStyles.inputBox}>
               <TextInput type="text" name="name" id="name" placeholder="Database name" value={this.state.name} onChange = {this.handleChange.bind(this)} validations={'isRequired2:'+this.state.error+',isAlpha1:'+this.state.error+',maxLength:63'} onChange={this.handleChange.bind(this)} validationErrors={{isRequired2: 'Db name must not be empty', isAlpha1: 'Invalid Db name', maxLength: 'Db name exceeds maximum limit' }}  />
             </div>
             <div className={dbListStyles.buttons}>
              <div className={dbListStyles.right}>
               <span onClick={this.closeModal.bind(this)} value='CANCEL' className={dbListStyles.cancel} >CANCEL</span>
               <button onClick={this.clickHandlerModal.bind(this)} value='SUBMIT' className={dbListStyles.submit} disabled={!this.state.canSubmit}>CREATE</button>
              </div>
             </div>
             <div className={dbListStyles.clear}></div>
             <div className={!this.state.successMessage? (dbListStyles.errorMessage + ' ' + (this.state.message!='' ? dbListStyles.show : dbListStyles.hidden)) : (this.state.message != '' ? dbListStyles.successMessage : '')}>{this.state.message}</div>
           </div>
         </Form>
       </div>
     </Modal> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose.bind(this)} action =   'create Database' ></AuthPopUp> }
    </div>
    );
  }
}

DbListComponent.contextTypes = {
  selectedDB: React.PropTypes.string
};

export default DbListComponent;
