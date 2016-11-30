import React from 'react'
import newUserStyles from './newuser.css'
import Dropdown from 'react-drop-down'
import $ from 'jquery'
import Modal from 'react-modal'
import { Form } from 'formsy-react'
import TextInput from '../TextInput/TextInputComponent.jsx'
import service from '../../gateway/service.js'
import update from 'react-addons-update'

class NewUserComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      autoIndex: true,
      password: null,
      user_name: null,
      roles: "",
      canSubmit:false,
      title:'',
      submitted:false,
      message:'',
      successMessage: false,
      _isMounted: false,
      newUser: null,
      error: false,
      role: "",
      selectedRoles: "",
      addedRoles:[],
      removedRoles:[],
      retrievedRoles:[],
      uniqueRetrievedRoles:[],
      finalRoles:[],
      dbSource: "",
      dbSourceList: [],      
      roles: [{key:"read","selected": false},{key:"userAdmin","selected":false},{key:"userAdminAnyDatabase","selected": false},
              {key:"readWrite","selected": false},{key:"dbAdmin","selected":false},{key:"readWriteAnyDatabase","selected":false},
              {key:"clusterAdmin","selected": false},{key:"readAnyDatabase","selected": false},{key:"dbAdminAnyDatabase","selected":false}]
    }
  }

  openModal() {
    var that = this;
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
    this.setState({successMessage: false});
    this.setState({uniqueRetrievedRoles: []});
    this.setForm();
    var ds = ["Please select a DbSource"];
    var dbList = [];
    dbList = JSON.parse(sessionStorage.getItem('dbNames') || '{}');
    dbList.map(function(item){
      ds.push(item);
    });
    if(this.props.modifyUser) {
      this.setState({dbSource : this.props.currentDb});
      ds=[];
      ds.push(this.props.currentDb)
    }
    this.setState({dbSourceList: ds});
    var unique = this.state.retrievedRoles.filter(function(item, pos) {
      return this.state.retrievedRoles.indexOf(item) == pos;
    }.bind(this));

    this.setState({uniqueRetrievedRoles : unique});
  }

  setRoles(){
    var that = this;
    var userDetail = [];
    var retrievedRoles = [];
    this.setState({retrievedRoles : []});

    if(this.props.modifyUser) {
      this.props.users.roles.map(function(key) {
        userDetail.push({'key': key.role, 'selected': true});
      });
      userDetail.map(function(result){
        var index = 0;
        that.state.roles.map(function(item){
          if(item.key == result.key){
            item.selected = result.selected;
            that.setState(update(that.state.roles[index], {selected: {$set: result.selected}}));
            retrievedRoles.push(item.key);
          }
          ++index;
        });
      });
      // this.setState({retrievedRoles : retrievedRoles});
      this.state.retrievedRoles = retrievedRoles;
    }
  }
  closeModal() {
    this.setState({modalIsOpen: false});
    this.setState({error: false});
    this.setState({selectedRoles:""});
    
    this.setState({roles: [{key:"read","selected": false},{key:"userAdmin","selected":false},{key:"userAdminAnyDatabase","selected": false},
              {key:"readWrite","selected": false},{key:"dbAdmin","selected":false},{key:"readWriteAnyDatabase","selected":false},
              {key:"clusterAdmin","selected": false},{key:"readAnyDatabase","selected": false},{key:"dbAdminAnyDatabase","selected":false}]});
    



    if(this.state.successMessage==true)
    {
      if(this.props.currentDb != this.state.dbSource){
       // this.props.refreshCollectionList(this.state.dbSource);
      }

    else{
      this.props.refreshCollectionList(this.props.currentDb);
      this.props.refreshRespectiveData(this.state.newUser);
      }
    }
    this.setState({dbSource:""});
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
    return true;
  }

  handleCheck(r){
    var that = this;
    var index = 0;
    var selectedCount = 0;
    this.state.roles.map(function(item){
      if(item.key == r.key){
        r.selected = !r.selected;
        that.setState(update(that.state.roles[index], {selected: {$set: r.selected}}));
      }
      ++index;
      ++selectedCount;
    });
    if(selectedCount > 0) {
      this.setState({message:''});
    }
  }

  clickHandler(){
    this.setState({finalRoles:[]});
    var that =this;
    var data = $("form").serialize().split("&");
    var obj={};
    for(var key in data)
    {
      obj[data[key].split("=")[0]] = data[key].split("=")[1];
    }
    if(this.props.modifyUser)
      obj['user_name'] = this.props.userName;
    if(this.state.dbSource.length < 1 || this.state.dbSource == "Please select a DbSource"){
      this.setState({successMessage:false});
      this.setState({message:'Please select a DbSource'});
      this.setState({dbSource:""});
      return;
    }
    obj['dbSource'] = this.state.dbSource;
    var selectedCount = 0;
    this.state.roles.map(function(item){
      if(item.selected){
        ++selectedCount;
        that.state.finalRoles.push(item.key);
        that.state.selectedRoles = that.state.selectedRoles.length > 0 ? that.state.selectedRoles + "," + item.key : item.key;
      }
    });
    if(selectedCount < 1) {
      this.setState({successMessage:false});
      this.setState({message:'Please select atleast one role'});
      this.setState({selectedRoles:""});
      return;
    }
    obj['roles'] = this.state.selectedRoles;
    if ((obj['user_name']!= '' && obj['user_name']!= null)
         && (obj['password']!= '' && obj['password']!=null)){
      this.setState({submitted:true});
    } else {
      this.setState({error:true});
    }

    if (this.props.modifyUser){
      var addedRoles = this.state.finalRoles.filter( function( el ) {
        return this.state.uniqueRetrievedRoles.indexOf( el ) < 0;
      }.bind(this));
      
      var removedRoles = this.state.uniqueRetrievedRoles.filter( function( el ) {
        return this.state.finalRoles.indexOf( el ) < 0;
      }.bind(this));


      var removedRoles = removedRoles.filter(function(item, pos) {
        return removedRoles.indexOf(item) == pos;
      });

      obj['newRoles'] = addedRoles.toString();
      obj['removedRoles'] =  removedRoles.toString();

      // obj['removedRoles'] = this.state.uniqueRetrievedRoles.toString();
      // obj['newRoles'] = this.state.finalRoles.toString();
    }

    var partialUrl = this.props.modifyUser ? this.state.dbSource+'/usersIndexes/modifyUser?connectionId='+this.props.connectionId
                     : this.state.dbSource+'/usersIndexes/addUser?connectionId='+this.props.connectionId;
    var addUserCall = service('POST', partialUrl, obj);
    addUserCall.then(this.success.bind(this, 'clickHandler', obj), this.failure.bind(this, 'clickHandler', obj));
  }

  setForm() {
    var that = this;
    var userDetail= [];
    if(this.props.modifyUser) {
      this.setState({password:""});
      this.setState({user_name: this.props.userName});
      this.setState({title:'Modify User'});
      this.setRoles();
    }
    else
      this.setState({title:'Add User'});
  }

  componentDidMount(){
    this.state._isMounted =  true;
  }

  componentWillUnmount(){
    this.state._isMounted =  false;
  }

  componentWillReceiveProps(nextProps){
    this.props = nextProps;

  }

  success(calledFrom, obj,  data) {
    if (calledFrom == 'clickHandler'){
      if (data.response.result) {
        if(this.props.modifyUser)
          this.setState({message:'User '+obj['user_name']+ ' was successfully modified for database ' + this.state.dbSource});
        else
          this.setState({message:'User '+obj['user_name']+ ' was successfully added to database ' + this.state.dbSource});
        this.state.newUser = obj['user_name'];
        this.setState({successMessage:true});
        setTimeout(function() { this.closeModal() }.bind(this), 2000);
      }
      if (data.response.error) {
        if (data.response.error.code === 'USER_CREATION_EXCEPTION'){
          this.setState({successMessage:false});
          if(data.response.error.message.indexOf("not authorized") >= 0) {
            this.setState({message:'Not Authorized to create user with role ' + this.state.selectedRoles});
          } else if (data.response.error.message.indexOf("No role") >= 0) {
            var db = data.response.error.message.match("errmsg(.*)@")[1].match("named(.*)")[1];
            this.setState({message:'Not Authorized to create user with role ' + db});
          }
          else if (data.response.error.message.indexOf("Cannot create users in the") >= 0){
            this.setState({message:'Cannot create users in ' + this.state.dbSource + ' database'});
          }
          
          else {
            this.setState({message:'User '+obj['user_name']+ ' already exists in database ' + this.state.dbSource});
          }
        }
        this.setState({selectedRoles:""});
      }
    }
  }

  DDhandleChange(e) {
    this.state.dbSource = e;
    if(e != "Please select a DbSource") {
      this.setState({successMessage:false});
      this.setState({message:''});
    }
  }

  failure() {

  }


  render () {
    var that = this;
    const customStyles = {
      content : {
        top                   : '50%',
        left                  : '50%',
        border                : 'none',
        borderRadius          : '4px',
        right                 : 'auto',
        width                 : '34%',
        minWidth              : '450px',
        bottom                : 'auto',
        marginRight           : '-50%',
        padding               : '0px',
        transform             : 'translate(-50%, -50%)'
      },
      overlay : {
        backgroundColor       : 'rgba(0,0,0, 0.74902)'
      }
    };

    return(
      <div className={this.props.modifyUser ? newUserStyles.modifyUser : newUserStyles.modalContainer}>
        {this.props.modifyUser ? <span onClick= {this.openModal.bind(this)} ><i className="fa fa-plus-circle" aria-hidden="true"></i> Modify User</span>
                               : <span onClick= {this.openModal.bind(this)} ><i className="fa fa-plus-circle" aria-hidden="true"></i> Add User</span> }
       <Modal
         isOpen={this.state.modalIsOpen}
         onRequestClose={this.closeModal.bind(this)}
         style = {customStyles}>
         <div className={newUserStyles.two}>
           <div className={newUserStyles.header}>
             <span className={newUserStyles.text}>{this.state.title}</span>
           </div>
           <Form method='POST' onValid={this.enableButton()} onInvalid={this.disableButton()} >
             <div className={ newUserStyles.formContainer}>
               <div className={newUserStyles.name}>
                 <TextInput type="text" name="user_name" id="user_name" placeholder="User Name" value={this.state.user_name} onChange={this.handleChange.bind(this)} validationErrors={{isRequired2: 'User name must not be empty'}} validations={'isRequired2:'+this.state.error} shouldBeDisabled={this.props.modifyUser}/>
               </div>
               <div className={newUserStyles.userPassword}>
                 <TextInput type="password" name="password" id="password" placeholder="Password" value={this.state.name} onChange={this.handleChange.bind(this)} validationErrors={{isRequired2: 'Password must not be empty'}} validations={'isRequired2:'+this.state.error}/>
               </div>
               <div className={newUserStyles.dataSource}>
                 <Dropdown value={this.state.dbSource} onChange={this.DDhandleChange.bind(this)} options={this.state.dbSourceList} disabled={true} />
               </div>
               <div className={newUserStyles.rolesDiv +' '+newUserStyles.clearfix}>
                 {this.state.roles.map(function(item){
                    return (
                     <div className={newUserStyles.roleInputBox} key={item.key}>
                       <input type="checkbox" className={newUserStyles.checkboxClass} name="{item.key}" id="{item.key}"  onChange={that.handleCheck.bind(that,item)} checked={item.selected}  />
                       <div className={newUserStyles.checkLabel} onClick={that.handleCheck.bind(that,item)}><span>{item.key}</span></div>
                     </div> );
                 })}
               </div>
               <div className={newUserStyles.buttonContainer}>
                 <span onClick={this.closeModal.bind(this)} className={ newUserStyles.cancel }>CANCEL</span>
                 <button onClick={this.clickHandler.bind(this)} value='SUBMIT' className={newUserStyles.submit} disabled={!this.state.canSubmit}>SUBMIT</button>
               </div>
             </div>
           </Form>
            <div className={!this.state.successMessage? (newUserStyles.errorMessage + ' ' + (this.state.message!='' ? newUserStyles.show : newUserStyles.hidden)) : (this.state.message != '' ? newUserStyles.successMessage : '')}>{this.state.message}</div>
         </div>
       </Modal>
     </div>
    );
  }
}

export default NewUserComponent;
