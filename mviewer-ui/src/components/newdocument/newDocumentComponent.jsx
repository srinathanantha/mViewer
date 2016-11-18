import React from 'react'
import newDocumentStyles from './newdocument.css'
import $ from 'jquery'
import Modal from 'react-modal'
import { Form } from 'formsy-react'
import TextInput from '../TextInput/TextInputComponent.jsx'
import service from '../../gateway/service.js'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx'

class newDocumentComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      message:'',
      successMessage: false,
      newDocument: '{}',
      errorMessage: false,
      showAuth: false,
      hasPriv: false
    }
  }

  openModal() {
    if (this.props.addOrUpdate == 'Edit'){
      var hasPriv = privilegesAPI.hasPrivilege('update',this.props.currentItem, this.props.currentDb);
      if(hasPriv && !this.props.currentItem.startsWith('system.')){
        this.setState({showAuth : false});    }
      else{
        this.setState({showAuth : true});
      }
    }
    else{
      var hasPriv = privilegesAPI.hasPrivilege('insert',this.props.currentItem, this.props.currentDb);
      if(hasPriv && !this.props.currentItem.startsWith('system.')){
        this.setState({showAuth : false});    }
      else{
        this.setState({showAuth : true});
      }
    }

    this.setState({modalIsOpen: true});
    this.setState({successMessage : false});
    this.setState({message: ''});
    if(this.props.addOrEdit == 'Edit'){
      this.setState({newDocument: this.props.documentValue});
    }
    this.setState({errorMessage : false});
  }

  authClose(){
      this.setState({showAuth:false});
      this.setState({modalIsOpen:false});
  }

  closeModal() {
    this.setState({modalIsOpen: false});
    this.setState({newDocument: "{}"});
    if(this.state.successMessage==true)
    {
      if(this.props.addOrEdit == 'Edit'){
        this.props.refresh('edit');
      }
      else{
        this.props.refresh('new');
      }
    }
  }

  handleChange(key){
    return function(e) {
      var state = {};
      state[key] = e.target.value;
      this.setState(state);
      if (e.target.value == '') {
        this.setState({errorMessage : true});
      }
      else {
        this.setState({errorMessage : false});
      }
    }.bind(this);


  }

  clickHandler(){
    var that =this;
    var data = $("form").serialize().split("&");
    var obj={};
    if(this.props.addOrEdit == 'Edit'){
      obj['_id'] = this.props.uId;
    }
    for(var key in data)
    {
      obj[data[key].split("=")[0]] = unescape(data[key].split("=")[1]);
    }

    var partialUrl = this.props.currentDb+'/'+this.props.currentItem+'/document?connectionId='+this.props.connectionId;
    var newDocumentCall = service((this.props.addOrEdit != 'Edit'? 'POST' : 'PUT'), partialUrl, obj);
    newDocumentCall.then(this.success.bind(this), this.failure.bind(this));

  }

  success(data){
    if (data.response.result) {
      this.setState({successMessage:true});
      if (this.props.addOrEdit != 'Edit')
      {
        this.setState({message:'Document was successfully added to collection ' + this.props.currentItem});
      }
      else {
        this.setState({message:'Document was successfully Updated'}, function(){
        });
      }
      setTimeout(function() { this.closeModal() }.bind(this), 2000);
    }
    if (data.response.error) {
        if(data.response.error.code == 'DOCUMENT_UPDATE_EXCEPTION'){
          this.setState({successMessage:false});
          this.setState({message: 'Cannot change the size of a document in a capped collection'});
        }
        else
        {
          this.setState({successMessage:false});
          this.setState({message: data.response.error.message});  
        }

        if (data.response.error.code == 'ANY_OTHER_EXCEPTION') {
          this.setState({message : 'Invalid JSON Object'});
        }
    }
  }

  failure(data){

  }

  render () {
    const customStyles = {
      content : {
        top                   : '50%',
        left                  : '50%',
        border                : 'none',
        borderRadius          : '4px',
        right                 : 'auto',
        width                 : '25%',
        minWidth              : '329px',
        overflow              : 'hidden',
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
      <div className = {this.props.addOrEdit != 'Edit' ? newDocumentStyles.mainContainer : newDocumentStyles.editMainContainer }>
      <span className={this.props.addOrEdit != 'Edit' ?newDocumentStyles.addButton : newDocumentStyles.editButton} onClick= {this.openModal.bind(this)} >{this.props.addOrEdit != 'Edit' ? (<i className="fa fa-plus-circle" aria-hidden="true"></i> ) : (<i className="fa fa-pencil" aria-hidden="true"></i> )}  {this.props.addOrEdit!='Edit' ? <span>Add Document</span> : null} </span>
       { !this.state.showAuth ? <Modal
         isOpen={this.state.modalIsOpen}
         onRequestClose={this.closeModal.bind(this)}
         style = {customStyles}>
         <div className={newDocumentStyles.two}>
           <div className={newDocumentStyles.header}>
             {this.props.addOrEdit !='Edit' ? <span className={newDocumentStyles.text}>Add Document</span> : <span className={newDocumentStyles.text}>Edit Document</span>}
           </div>
            <form>
              {this.props.addOrEdit !='Edit' ? <label>Enter JSON data</label> : <label>Edit JSON data</label>}
              <textarea className={this.state.errorMessage ? newDocumentStyles.error : ''} value ={this.state.newDocument} name={this.props.addOrEdit != 'Edit' ? 'document' : 'keys'} id='document' onChange={this.handleChange('newDocument')}></textarea>
            </form>
            <div className={newDocumentStyles.buttonContainer}>
                <button onClick={this.clickHandler.bind(this)} value='SUBMIT' className={newDocumentStyles.submit} disabled = {this.state.errorMessage}>SUBMIT</button>
                <button onClick={this.closeModal.bind(this)} value='CANCEL' className={newDocumentStyles.cancel}>CANCEL</button>
            </div>
            <div className={!this.state.successMessage? (newDocumentStyles.errorMessage + ' ' + (this.state.message!='' ? newDocumentStyles.show : newDocumentStyles.hidden)) : (this.state.message != '' ? newDocumentStyles.successMessage : '')}>{this.state.message}</div>
         </div>
       </Modal> : <AuthPopUp modalIsOpen = {this.state.showAuth} action = {this.props.addOrEdit == 'Edit' ? 'edit document' : 'add document' }  authClose = {this.authClose.bind(this)} ></AuthPopUp>}
     </div>
    );
  }
}

export default newDocumentComponent;
